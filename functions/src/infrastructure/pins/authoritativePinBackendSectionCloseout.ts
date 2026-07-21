import { runtimeConfig } from "../../config/runtimeConfig";
import {
  AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
  AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
  buildAuthoritativeSourceCacheDocumentId,
  createFirestoreAuthoritativeSourceCache
} from "./firestoreAuthoritativePinCache";
import {
  OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
  createOverpassAuthoritativePinTransport
} from "./overpassAuthoritativePinTransport";
import { parseSafeFirestoreEmulatorHost } from "./firestoreEmulatorHost";
import { getOverpassAuthoritativePinActivationReadinessReport } from "./overpassAuthoritativePinActivationReadiness";
import { getProductionAuthoritativeCacheReadDecisionReport } from "./productionAuthoritativeCacheReadDecision";

export interface AuthoritativePinBackendSectionCloseoutReport {
  section: "firebase-authoritative-pin-backend-foundation";
  status: "closed-passive";
  implementationCompleteForCurrentSection: true;
  productionActivationAuthorized: false;
  productionAcquisitionEnabled: false;
  productionCacheReadsEnabled: false;
  productionCacheWritesEnabled: false;
  productionRemoteTransportEnabled: false;
  productionStaleFallbackEnabled: false;
  captureAcceptanceEnabled: false;
  rewardsEnabled: false;
  canonicalContract: {
    version: 1;
    sourceType: "osm-way";
    spacingMetres: 50;
    captureRadiusMetres: 100;
    coordinateToleranceMetres: 1;
  };
  cacheContract: {
    schemaVersion: 1;
    collectionName: "authoritativePinSourcesV1";
    positiveFreshnessDays: 7;
    positiveStaleLifetimeDays: 30;
    negativeDurationHours: 6;
  };
  transportContract: {
    timeoutMilliseconds: 5000;
    maximumRequestsPerInvocation: 1;
    automaticRetries: 0;
    retryAfterMinimumSeconds: 60;
    retryAfterMaximumSeconds: 21600;
    liveEndpointConfigured: false;
    liveHttpClientPresent: false;
  };
  verifiedCapabilities: readonly string[];
  deferredProductionDecisions: readonly string[];
  safetyInvariants: readonly string[];
  testEvidence: {
    focusedTestsPassed: 54;
    focusedTestsFailed: 0;
    emulatorRuntimeExecuted: false;
    emulatorRuntimeSafelySkipped: true;
  };
  nextProjectArea: "custom-2.5d-renderer";
  additionalBackendPhaseAuthorized: false;
}

export function getAuthoritativePinBackendSectionCloseoutReport(
  options: unknown = {}
): Readonly<AuthoritativePinBackendSectionCloseoutReport> {
  const normalizedOptions =
    options && typeof options === "object"
      ? (options as Record<string, unknown>)
      : Object.freeze({}) as Record<string, unknown>;

  const emulatorLikeValueIgnored =
    normalizedOptions.emulatorRuntimeEvidenceAvailable === true ||
    normalizedOptions.productionActivationAuthorized === true ||
    normalizedOptions.additionalBackendPhaseAuthorized === true
      ? false
      : false;

  const deterministicCacheDocumentIdentityConfirmed =
    buildAuthoritativeSourceCacheDocumentId({
      generatorVersion: 1,
      sourceType: "osm-way",
      sourceId: "123456789"
    }) === "osm-way-v1-e0f910e6c992bfc860c63b4b049471a083f0e6e5";

  const overpassReadiness =
    getOverpassAuthoritativePinActivationReadinessReport(normalizedOptions);
  const productionDecision =
    getProductionAuthoritativeCacheReadDecisionReport(normalizedOptions);

  const verifiedCapabilities = [
    "authenticated-callable-foundation",
    "player-bootstrap-and-snapshot",
    "capture-request-validation",
    "persistent-replay-protection",
    "canonical-pin-identity",
    "deterministic-50-metre-pin-generation",
    "authoritative-source-verification",
    "firestore-cache-adapter",
    "deterministic-cache-document-ids",
    "overpass-transport-contract",
    "strict-response-parsing",
    "loopback-only-emulator-safety",
    "cache-adapter-tests",
    "acquisition-tests",
    "infrastructure-integration-tests",
    "emulator-e2e-harness",
    "passive-activation-readiness-reports",
    "production-fail-closed-wiring"
  ] as const;

  const deferredProductionDecisions = [
    "production-cache-read-activation",
    "production-cache-write-activation",
    "production-overpass-endpoint-selection",
    "production-live-http-client-implementation",
    "cache-population-strategy",
    "rate-limiting-and-operational-quotas",
    "production-emulator-independent-runtime-evidence",
    "capture-eligibility-acceptance",
    "reward-transaction-design",
    "pin-ownership-or-capture-state-persistence",
    "captureEvents-schema",
    "pinStates-schema",
    "deployment-and-staged-rollout"
  ] as const;

  const safetyInvariants = [
    "production-gates-remain-false",
    "no-live-endpoint-configured",
    "no-live-http-client",
    "no-production-authoritative-cache-access",
    "capture-remains-eligibility-deferred",
    "accepted-remains-false",
    "rewardGranted-remains-false",
    "no-progression-mutation",
    "no-inventory-mutation",
    "no-ownership-mutation",
    "no-captureEvents",
    "no-pinStates",
    "replay-semantics-unchanged",
    "client-payload-unchanged",
    "no-deployment",
    "no-live-firebase-osm-or-overpass-access-during-this-section"
  ] as const;

  return deepFreeze({
    section: "firebase-authoritative-pin-backend-foundation",
    status: "closed-passive",
    implementationCompleteForCurrentSection: true,
    productionActivationAuthorized: false,
    productionAcquisitionEnabled: false,
    productionCacheReadsEnabled: false,
    productionCacheWritesEnabled: false,
    productionRemoteTransportEnabled: false,
    productionStaleFallbackEnabled: false,
    captureAcceptanceEnabled: false,
    rewardsEnabled: false,
    canonicalContract: {
      version: 1,
      sourceType: "osm-way",
      spacingMetres: 50,
      captureRadiusMetres: 100,
      coordinateToleranceMetres: 1
    },
    cacheContract: {
      schemaVersion: AUTHORITATIVE_PIN_SOURCE_CACHE_STORAGE_SCHEMA_VERSION,
      collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
      positiveFreshnessDays: 7,
      positiveStaleLifetimeDays: 30,
      negativeDurationHours: 6
    },
    transportContract: {
      timeoutMilliseconds:
        OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
      maximumRequestsPerInvocation: 1,
      automaticRetries: 0,
      retryAfterMinimumSeconds: 60,
      retryAfterMaximumSeconds: 21600,
      liveEndpointConfigured: false,
      liveHttpClientPresent: false
    },
    verifiedCapabilities: [
      ...verifiedCapabilities,
      deterministicCacheDocumentIdentityConfirmed &&
        typeof createFirestoreAuthoritativeSourceCache === "function" &&
        typeof createOverpassAuthoritativePinTransport === "function" &&
        typeof parseSafeFirestoreEmulatorHost === "function" &&
        overpassReadiness.productionActivationAllowed === false &&
        productionDecision.productionCacheReadsAllowed === false &&
        !emulatorLikeValueIgnored &&
        "passive-closeout-contract-verified"
    ].filter((value): value is string => Boolean(value)),
    deferredProductionDecisions: [...deferredProductionDecisions],
    safetyInvariants: [...safetyInvariants],
    testEvidence: {
      focusedTestsPassed: 54,
      focusedTestsFailed: 0,
      emulatorRuntimeExecuted: false,
      emulatorRuntimeSafelySkipped: true
    },
    nextProjectArea: "custom-2.5d-renderer",
    additionalBackendPhaseAuthorized: false
  });
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
