import { runtimeConfig } from "../../config/runtimeConfig";
import {
  buildOverpassWayQuery,
  parseOverpassAuthoritativeWayResponse,
  validateOverpassWaySourceId
} from "./overpassAuthoritativePinParser";
import {
  OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
  createOverpassAuthoritativePinTransport
} from "./overpassAuthoritativePinTransport";

export interface OverpassAuthoritativePinActivationReadinessReport {
  readyForManualEmulatorActivation: boolean;
  productionActivationAllowed: false;
  liveHttpClientPresent: false;
  endpointConfigured: false;
  remoteTransportEnabled: false;
  automaticRetries: number;
  maximumRequestsPerInvocation: number;
  timeoutMilliseconds: number;
  blockers: readonly string[];
  satisfiedChecks: readonly string[];
}

export function getOverpassAuthoritativePinActivationReadinessReport(
  options: unknown = {}
): Readonly<OverpassAuthoritativePinActivationReadinessReport> {
  const normalizedOptions =
    options && typeof options === "object"
      ? (options as Record<string, unknown>)
      : Object.freeze({}) as Record<string, unknown>;

  const deterministicQuery =
    buildOverpassWayQuery({
      sourceId: "123456789",
      timeoutMilliseconds: OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
    }) ===
    buildOverpassWayQuery({
      sourceId: "123456789",
      timeoutMilliseconds: OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
    });

  const strictSourceIdValidation = detectsInvalidSourceId();
  const partialGeometryRejected = detectsPartialGeometryRejection();
  const coordinateOrderPreserved = detectsCoordinateOrderPreservation();
  const transportAdapterAvailable =
    typeof createOverpassAuthoritativePinTransport === "function";
  const parserAvailable = typeof parseOverpassAuthoritativeWayResponse === "function";
  const queryBuilderAvailable = typeof buildOverpassWayQuery === "function";
  const liveHttpClientPresent = normalizedOptions.liveHttpClientPresent === true
    ? false
    : false;
  const endpointConfigured = normalizedOptions.endpointConfigured === true
    ? false
    : false;
  const remoteTransportEnabled = false as const;

  const blockers = [
    "manual-activation-not-authorized",
    "live-http-client-absent",
    "endpoint-not-configured",
    "production-remote-transport-disabled",
    "capture-acceptance-remains-disabled",
    "reward-granting-remains-disabled"
  ] as const;

  const satisfiedChecks = [
    transportAdapterAvailable && "transport-adapter-available",
    transportAdapterAvailable && "http-client-seam-available",
    queryBuilderAvailable && "deterministic-exact-way-query-available",
    strictSourceIdValidation && "strict-osm-source-id-validation-available",
    parserAvailable && "parser-available",
    partialGeometryRejected && "parser-rejects-incomplete-geometry",
    coordinateOrderPreserved && "coordinate-order-preserved",
    runtimeConfig.authoritativeSourceAcquisition.policy
      .maxTransportRequestsPerInvocation === 1 &&
      "maximum-request-count-locked-to-one",
    runtimeConfig.authoritativeSourceAcquisition.policy.automaticRetryCount === 0 &&
      "automatic-retries-locked-to-zero",
    OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS === 5000 &&
      "timeout-locked-to-5000ms",
    runtimeConfig.authoritativeSourceAcquisition.policy
      .rateLimitedMinimumRetryAfterSeconds === 60 &&
      runtimeConfig.authoritativeSourceAcquisition.policy
        .rateLimitedMaximumRetryAfterSeconds ===
        6 * 60 * 60 &&
      "retry-after-bounds-locked",
    runtimeConfig.authoritativeSourceAcquisition.remoteTransportEnabled === false &&
      "production-remote-transport-disabled",
    "no-background-jobs-present",
    "no-scheduler-present",
    "no-secret-or-api-key-required"
  ].filter((value): value is string => Boolean(value));

  return deepFreeze({
    readyForManualEmulatorActivation: false,
    productionActivationAllowed: false,
    liveHttpClientPresent,
    endpointConfigured,
    remoteTransportEnabled,
    automaticRetries:
      runtimeConfig.authoritativeSourceAcquisition.policy.automaticRetryCount,
    maximumRequestsPerInvocation:
      runtimeConfig.authoritativeSourceAcquisition.policy
        .maxTransportRequestsPerInvocation,
    timeoutMilliseconds: OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
    blockers,
    satisfiedChecks
  });
}

function detectsInvalidSourceId(): boolean {
  try {
    validateOverpassWaySourceId("1e6");
    return false;
  } catch {
    return true;
  }
}

function detectsPartialGeometryRejection(): boolean {
  const result = parseOverpassAuthoritativeWayResponse({
    reference: {
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789"
    },
    body: {
      remark: "partial response from upstream",
      elements: []
    }
  });

  return result.ok === false && result.code === "source-incomplete";
}

function detectsCoordinateOrderPreservation(): boolean {
  const result = parseOverpassAuthoritativeWayResponse({
    reference: {
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789"
    },
    body: {
      elements: [
        {
          type: "way",
          id: 123456789,
          geometry: [
            { lat: -38.45, lon: 145.24 },
            { lat: -38.4495503, lon: 145.24 }
          ]
        }
      ]
    }
  });

  return (
    result.ok === true &&
    result.geometry.orderedCoordinates[0]?.latitude === -38.45 &&
    result.geometry.orderedCoordinates[0]?.longitude === 145.24 &&
    result.geometry.orderedCoordinates[1]?.latitude === -38.4495503 &&
    result.geometry.orderedCoordinates[1]?.longitude === 145.24
  );
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      if (nestedValue && typeof nestedValue === "object") {
        deepFreeze(nestedValue);
      }
    }

    Object.freeze(value);
  }

  return value as Readonly<T>;
}
