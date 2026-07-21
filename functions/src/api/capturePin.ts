import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";

import { runtimeConfig } from "../config/runtimeConfig";
import {
  type CapturePinRequest,
  type CapturePinDeferredResponse,
  captureRewardBoundary
} from "../domain/captures/captureTypes";
import {
  buildCaptureRequestFingerprint,
  buildCaptureRequestKey,
  buildDeferredCaptureRequestDocument,
  buildInitialDeferredCaptureResponse,
  buildReplayDeferredCaptureResponse,
  getCaptureRequestDocumentRef,
  normalizeCapturePinRequest,
  readStoredCaptureRequestDocument,
  type CaptureRequestDocument
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
  requireAppCheckIfEnabled,
  requireAuthenticated
} from "../security/requireAuthenticated";
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
  getStoredRequest(requestKey: string): Promise<CaptureRequestDocument | null>;
  createDeferredRequest(params: {
    uid: string;
    requestFingerprint: string;
    request: ReturnType<typeof normalizeCapturePinRequest>;
  }): Promise<void>;
}

export interface CapturePinHandlerDependencies {
  authoritativePinSourceProvider: AuthoritativePinSourceProvider;
  persistence: CapturePinPersistence;
}

const defaultCapturePinDependencies: CapturePinHandlerDependencies = {
  authoritativePinSourceProvider: createAuthoritativePinSourceProvider({
    acquisitionGates: {
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
    transport: createDisabledAuthoritativeSourceTransport(),
    cache: createNoopAuthoritativeSourceCache(),
    clock: createSystemAuthoritativeSourceClock(),
    policy: runtimeConfig.authoritativeSourceAcquisition.policy
  }),
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
    async getStoredRequest(
      requestKey: string
    ): Promise<CaptureRequestDocument | null> {
      const requestSnapshot = await getCaptureRequestDocumentRef(requestKey).get();
      if (!requestSnapshot.exists) {
        return null;
      }

      return readStoredCaptureRequestDocument(requestSnapshot.data());
    },
    async createDeferredRequest(params: {
      uid: string;
      requestFingerprint: string;
      request: ReturnType<typeof normalizeCapturePinRequest>;
    }): Promise<void> {
      await getCaptureRequestDocumentRef(
        buildCaptureRequestKey(params.uid, params.request.requestId)
      ).create(
        buildDeferredCaptureRequestDocument({
          uid: params.uid,
          requestFingerprint: params.requestFingerprint,
          request: params.request,
          now: Timestamp.now()
        })
      );
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

    const typedRequest = validateCapturePinRequestPayload(request);
    const normalizedRequest = normalizeCapturePinRequest(typedRequest);

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
  const requestKey = buildCaptureRequestKey(uid, normalizedRequest.requestId);
  const requestFingerprint = buildCaptureRequestFingerprint(uid, normalizedRequest);

  await dependencies.persistence.ensurePlayerExists(uid);

  const existingRequest = await dependencies.persistence.getStoredRequest(requestKey);
  if (existingRequest) {
    return resolveStoredRequestOutcome(existingRequest, uid, requestFingerprint);
  }

  await resolveCapturePinVerificationEvidence({
    normalizedRequest,
    authoritativePinSourceProvider:
      dependencies.authoritativePinSourceProvider
  });

  try {
    await dependencies.persistence.createDeferredRequest({
      uid,
      requestFingerprint,
      request: normalizedRequest
    });
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      const storedAfterConflict =
        await dependencies.persistence.getStoredRequest(requestKey);

      if (!storedAfterConflict) {
        throw new HttpsError(
          "internal",
          "Capture request ledger creation raced with another writer and the stored document could not be reloaded."
        );
      }

      return resolveStoredRequestOutcome(
        storedAfterConflict,
        uid,
        requestFingerprint
      );
    }

    throw error;
  }

  return buildInitialDeferredCaptureResponse(normalizedRequest);
}

function resolveStoredRequestOutcome(
  storedRequest: CaptureRequestDocument,
  uid: string,
  requestFingerprint: string
): CapturePinDeferredResponse {
  if (storedRequest.uid !== uid) {
    throw new HttpsError(
      "internal",
      "Stored capture request uid does not match the authenticated caller."
    );
  }

  if (storedRequest.requestFingerprint !== requestFingerprint) {
    throw new HttpsError(
      "already-exists",
      "A different capture request already used this requestId for the authenticated player."
    );
  }

  return buildReplayDeferredCaptureResponse(storedRequest);
}

function isAlreadyExistsError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return code === "6" || code === "already-exists";
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
