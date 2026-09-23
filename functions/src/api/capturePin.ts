import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { runtimeConfig } from "../config/runtimeConfig";
import {
  type CapturePinRequest,
  type CapturePinDeferredResponse,
  captureRewardBoundary
} from "../domain/captures/captureTypes";
import {
  buildCaptureRequestFingerprint,
  normalizeCapturePinRequest
} from "../domain/captures/captureRequestStore";
import { getPlayerDocumentRef } from "../domain/players/playerStore";
import {
  createAuthoritativePinSourceProvider,
  type AuthoritativePinSourceProvider
} from "../domain/pins/authoritativePinSource";
import {
  type AuthoritativePinVerificationResult,
  verifyAuthoritativeCanonicalPin
} from "../domain/pins/authoritativePinVerifier";
import {
  createDisabledAuthoritativeSourceTransport,
  createSystemAuthoritativeSourceClock
} from "../domain/pins/authoritativePinAcquisition";
import {
  createNoopAuthoritativeSourceCache
} from "../domain/pins/authoritativePinCache";
import {
  acceptPrivateAlphaCapture,
  isPrivateAlphaCaptureEnabled,
  validateAlphaCaptureEvidence
} from "../domain/captures/privateAlphaCapture";
import {
  requireActiveDeviceSessionIfEnabled
} from "../domain/players/activeDeviceSession";
import { getAdminFirestore } from "../firebaseAdmin";
import { createMapBackedAuthoritativeSourceCache, RECOVERY_MAP_GEOMETRY_COLLECTION } from "../infrastructure/pins/mapBackedAuthoritativeSourceCache";
import type { CanonicalCoordinate } from "../domain/pins/basePinTypes";
import {
  AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
  createFirestoreAuthoritativeSourceCache
} from "../infrastructure/pins/firestoreAuthoritativePinCache";
import {
  createOverpassAuthoritativePinTransport,
  OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
  type AuthoritativeHttpClient
} from "../infrastructure/pins/overpassAuthoritativePinTransport";
import {
  type DeferredCaptureIdempotencyReservationDecision,
  reserveDeferredCaptureIdempotencySlot
} from "../idempotency/idempotency";
import {
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
import { requireInvitedUserAccess } from "../security/requireInvitedUserAccess";
import {
  asObject,
  assertAllowedKeys,
  requireFiniteNumber,
  requireIsoTimestamp,
  requireRequestId,
  requireString
} from "../validation/requestValidation";

export const CAPTURE_PIN_INTERNAL_REASON_VERIFIED_PROXIMITY_NOT_EVALUATED =
  "authoritative-pin-verified-proximity-not-evaluated" as const;

export interface CapturePinVerificationEvidence {
  verification: AuthoritativePinVerificationResult;
  internalReason:
    | typeof CAPTURE_PIN_INTERNAL_REASON_VERIFIED_PROXIMITY_NOT_EVALUATED
    | "authoritative-pin-verification-unavailable";
}

export interface CapturePinPersistence {
  ensurePlayerExists(uid: string): Promise<void>;
  reserveDeferredRequest(params: {
    uid: string;
    requestFingerprint: string;
    request: ReturnType<typeof normalizeCapturePinRequest>;
  }): Promise<DeferredCaptureIdempotencyReservationDecision>;
}

export interface CapturePinHandlerDependencies {
  authoritativePinSourceProvider: AuthoritativePinSourceProvider;
  authoritativePinSourceProviderForLocation?: (location: { pin: CanonicalCoordinate; player: CanonicalCoordinate }) => AuthoritativePinSourceProvider;
  persistence: CapturePinPersistence;
}

export const defaultCapturePinDependencies: CapturePinHandlerDependencies = {
  authoritativePinSourceProvider: createRuntimeAuthoritativePinSourceProvider(),
  authoritativePinSourceProviderForLocation: createRuntimeAuthoritativePinSourceProvider,
  persistence: {
    async ensurePlayerExists(uid: string): Promise<void> {
      const playerSnapshot = await getPlayerDocumentRef(uid).get();

      if (!playerSnapshot.exists) {
        throw new HttpsError(
          "failed-precondition",
          "Player bootstrap is required before capture requests can be recorded."
        );
      }
    },
    async reserveDeferredRequest(params: {
      uid: string;
      requestFingerprint: string;
      request: ReturnType<typeof normalizeCapturePinRequest>;
    }): Promise<DeferredCaptureIdempotencyReservationDecision> {
      return reserveDeferredCaptureIdempotencySlot(params);
    }
  }
};

export function validateCapturePinRequestPayload(
  request: CallableRequest<unknown>
): CapturePinRequest {
  const payload = asObject(request.data, "capturePin payload");
  assertAllowedKeys(
    payload,
    [
      "requestId",
      "deviceId",
      "pinLatitude",
      "pinLongitude",
      "pinId",
      "latitude",
      "longitude",
      "accuracyMetres",
      "clientCapturedAt"
    ],
    "capturePin payload"
  );

  return {
    requestId: requireRequestId(payload.requestId),
    pinId: requireString(payload.pinId, "pinId", 1, 128),
    latitude: requireFiniteNumber(payload.latitude, "latitude", -90, 90),
    longitude: requireFiniteNumber(payload.longitude, "longitude", -180, 180),
    accuracyMetres: requireFiniteNumber(
      payload.accuracyMetres,
      "accuracyMetres",
      0,
      10000
    ),
    clientCapturedAt: requireIsoTimestamp(
      payload.clientCapturedAt,
      "clientCapturedAt"
    )
  };
}

export async function resolveCapturePinVerificationEvidence(params: {
  normalizedRequest: ReturnType<typeof normalizeCapturePinRequest>;
  authoritativePinSourceProvider: AuthoritativePinSourceProvider;
}): Promise<CapturePinVerificationEvidence> {
  const verification = await verifyAuthoritativeCanonicalPin({
    input: {
      pinId: params.normalizedRequest.pinId,
      submittedLatitude: params.normalizedRequest.latitude,
      submittedLongitude: params.normalizedRequest.longitude
    },
    provider: params.authoritativePinSourceProvider
  });

  return {
    verification,
    internalReason:
      verification.ok === true
        ? CAPTURE_PIN_INTERNAL_REASON_VERIFIED_PROXIMITY_NOT_EVALUATED
        : "authoritative-pin-verification-unavailable"
  };
}

export function createCapturePinHandler(
  dependencies: CapturePinHandlerDependencies
) {
  return async (
    request: CallableRequest<unknown>
  ): Promise<ReturnType<typeof buildCapturePinResponse>> => {
    const authContext = requireAuthenticated(request);
    requireAppCheckIfEnabled(request);
    requireInvitedUserAccess(request);

    const typedRequest = validateCapturePinRequestPayload(request);
    const rawPayload = asObject(request.data, "capturePin payload");
    await requireActiveDeviceSessionIfEnabled({
      uid: authContext.uid,
      deviceId:
        typeof (request.data as Record<string, unknown> | undefined)?.deviceId === "string"
          ? (request.data as Record<string, unknown>).deviceId as string
          : undefined
    });
    const normalizedRequest = normalizeCapturePinRequest(typedRequest);

    if (isPrivateAlphaCaptureEnabled()) {
      const evidence = validateAlphaCaptureEvidence(rawPayload);
      const verification = await verifyAuthoritativeCanonicalPin({
        input: {
          pinId: normalizedRequest.pinId,
          submittedLatitude: evidence.pinLatitude,
          submittedLongitude: evidence.pinLongitude
        },
        provider: dependencies.authoritativePinSourceProviderForLocation?.({
          pin: { latitude: evidence.pinLatitude, longitude: evidence.pinLongitude },
          player: { latitude: normalizedRequest.latitude, longitude: normalizedRequest.longitude }
        }) ?? dependencies.authoritativePinSourceProvider
      });

      if (!verification.ok) {
        console.warn(JSON.stringify({ component: "capture_verification", reason: verification.code }));
        // A cached map copy can disagree with the validated canonical road.
        // Return only server-derived public geometry so the client can repair
        // its marker and retry once. This attempt still awards nothing; the
        // retry must pass the original coordinate, GPS and daily-lock checks.
        if (verification.code === "submitted-coordinate-mismatch" && verification.details?.canonicalPin) {
          throw new HttpsError("failed-precondition", "This pin's map position has changed. Refresh the map and try again.", {
            reason: "pin-location-updated",
            pin: verification.details.canonicalPin
          });
        }
        throw new HttpsError(
          "unavailable",
          "This pin could not be verified right now. Please refresh the map and try again."
        );
      }

      return acceptPrivateAlphaCapture({
        uid: authContext.uid,
        request: normalizedRequest,
        canonicalPin: verification.canonicalPin,
        evidence
      });
    }

    const response = await processValidatedCapturePinRequest({
      uid: authContext.uid,
      normalizedRequest,
      dependencies
    });

    return buildCapturePinResponse({
      transactionResult: response,
      appCheckVerified: authContext.appCheckVerified
    });
  };
}

export async function processValidatedCapturePinRequest(params: {
  uid: string;
  normalizedRequest: ReturnType<typeof normalizeCapturePinRequest>;
  dependencies: CapturePinHandlerDependencies;
}): Promise<CapturePinDeferredResponse> {
  const { uid, normalizedRequest, dependencies } = params;
  await dependencies.persistence.ensurePlayerExists(uid);

  await resolveCapturePinVerificationEvidence({
    normalizedRequest,
    authoritativePinSourceProvider:
      dependencies.authoritativePinSourceProvider
  });

  const requestFingerprint = buildCaptureRequestFingerprint(uid, normalizedRequest);
  const reservation = await dependencies.persistence.reserveDeferredRequest({
    uid,
    requestFingerprint,
    request: normalizedRequest
  });

  return reservation.response;
}

function buildCapturePinResponse(params: {
  transactionResult: CapturePinDeferredResponse;
  appCheckVerified: boolean;
}) {
  return {
    ...params.transactionResult,
    rewardBoundary: captureRewardBoundary,
    eligibility: {
      outcome: "deferred" as const,
      code: params.transactionResult.code
    },
    appCheck: {
      prepared: runtimeConfig.appCheck.prepared,
      enforced: runtimeConfig.appCheck.enforceOnCallable,
      verified: params.appCheckVerified
    },
    prohibitedClientAuthorityInputs: [
      "xp",
      "coins",
      "points",
      "level",
      "inventory",
      "captureHistory",
      "rewards",
      "questProgress",
      "cardOwnership",
      "birdProgress",
      "plotOwnership",
      "marketplaceOwnership",
      "collectionOwnership",
      "uid",
      "playerId",
      "value",
      "captureCount",
      "lastCapturedAt",
      "nextValue",
      "eligibility",
      "accepted"
    ],
    rewardAuthority: runtimeConfig.serverAuthority.rewardComputation
  };
}

export const capturePin = onCall(
  {
    region: runtimeConfig.region,
    enforceAppCheck: runtimeConfig.appCheck.enforceOnCallable
  },
  createCapturePinHandler(defaultCapturePinDependencies)
);

function createRuntimeAuthoritativePinSourceProvider(location?: { pin: CanonicalCoordinate; player: CanonicalCoordinate }): AuthoritativePinSourceProvider {
  const privateAlphaEnabled = isPrivateAlphaCaptureEnabled();
  const endpoint = readPrivateAlphaOverpassEndpoint();
  const sourceEnabled = privateAlphaEnabled && endpoint !== null;
  const cache = sourceEnabled
    ? createFirestoreAuthoritativeSourceCache({
        firestore: getAdminFirestore(),
        collectionName: AUTHORITATIVE_PIN_SOURCE_CACHE_COLLECTION_NAME,
        readsEnabled: true, writesEnabled: true
      })
    : createNoopAuthoritativeSourceCache();

  return createAuthoritativePinSourceProvider({
    acquisitionGates: sourceEnabled
      ? {
          enabled: true,
          cacheReadsEnabled: true,
          cacheWritesEnabled: true,
          remoteTransportEnabled: true,
          allowStaleFallback: true,
          // Capture keeps the exact canonical pin and GPS validation, but
          // should not block players on a remote refresh of valid
          // server-written source geometry.
          preferUsableStaleCache: true
        }
      : {
          enabled: runtimeConfig.authoritativeSourceAcquisition.enabled,
          cacheReadsEnabled:
            runtimeConfig.authoritativeSourceAcquisition.cacheReadsEnabled,
          cacheWritesEnabled:
            runtimeConfig.authoritativeSourceAcquisition.cacheWritesEnabled,
          remoteTransportEnabled:
            runtimeConfig.authoritativeSourceAcquisition.remoteTransportEnabled,
          allowStaleFallback:
            runtimeConfig.authoritativeSourceAcquisition.allowStaleFallback
        },
    transport: sourceEnabled && endpoint
      ? createOverpassAuthoritativePinTransport({
          httpClient: createFetchAuthoritativeHttpClient(),
          endpoint,
          enabled: true,
          clock: createSystemAuthoritativeSourceClock(),
          timeoutMilliseconds:
            OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS
        })
      : createDisabledAuthoritativeSourceTransport(),
    cache: sourceEnabled && location
      ? createMapBackedAuthoritativeSourceCache({
          cache, ...location,
          readCells: async (keys) => {
            const db = getAdminFirestore();
            const snapshots = await db.getAll(...keys.map(key => db.collection(RECOVERY_MAP_GEOMETRY_COLLECTION).doc(key)));
            return snapshots.map(snapshot => snapshot.data());
          }
        })
      : cache,
    clock: createSystemAuthoritativeSourceClock(),
    policy: runtimeConfig.authoritativeSourceAcquisition.policy
  });
}

function readPrivateAlphaOverpassEndpoint(): string | null {
  const value = process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function createFetchAuthoritativeHttpClient(): AuthoritativeHttpClient {
  return {
    async request(input) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), input.timeoutMilliseconds);

      try {
        const response = await fetch(input.url, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          signal: controller.signal
        });
        const bodyText = await response.text();
        let body: unknown = null;

        try {
          body = JSON.parse(bodyText);
        } catch {
          body = null;
        }

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body
        };
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
