import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../../firebaseAdmin";
import type {
  CaptureEligibilityDecision,
  CapturePinDeferredResponse,
  CaptureEligibilityDeferredCode,
  NormalizedCapturePinRequest
} from "./captureTypes";

export const CAPTURE_REQUEST_SCHEMA_VERSION = 1 as const;
export const CAPTURE_ELIGIBILITY_DEFERRED_CODE =
  "authoritative-pin-verification-unavailable" as const;

export interface StoredCaptureResponse {
  ok: false;
  accepted: false;
  status: "eligibility-deferred";
  code: CaptureEligibilityDeferredCode;
}

export interface CaptureRequestDocument {
  schemaVersion: 1;
  uid: string;
  requestId: string;
  operation: "capturePin";
  requestFingerprint: string;
  pinId: string;
  clientLatitude: number;
  clientLongitude: number;
  accuracyMetres: number;
  clientCapturedAt: Date;
  receivedAt: Date;
  updatedAt: Date;
  status: "eligibility-deferred";
  eligibilityCode: CaptureEligibilityDeferredCode;
  accepted: false;
  rewardGranted: false;
  response: StoredCaptureResponse;
}

export function normalizeCapturePinRequest(
  request: NormalizedCapturePinRequest
): NormalizedCapturePinRequest {
  return {
    requestId: request.requestId,
    pinId: request.pinId,
    latitude: Number(request.latitude.toFixed(6)),
    longitude: Number(request.longitude.toFixed(6)),
    accuracyMetres: Number(request.accuracyMetres.toFixed(3)),
    clientCapturedAt: new Date(request.clientCapturedAt).toISOString()
  };
}

export function buildCaptureRequestKey(uid: string, requestId: string): string {
  return `capture-pin-${hashValue(JSON.stringify({ uid, requestId }))}`;
}

export function buildCaptureRequestFingerprint(
  uid: string,
  request: NormalizedCapturePinRequest
): string {
  return hashValue(
    JSON.stringify({
      uid,
      requestId: request.requestId,
      pinId: request.pinId,
      latitude: request.latitude.toFixed(6),
      longitude: request.longitude.toFixed(6),
      accuracyMetres: request.accuracyMetres.toFixed(3),
      clientCapturedAt: request.clientCapturedAt
    })
  );
}

export function getCaptureRequestDocumentRef(
  requestKey: string
): DocumentReference<DocumentData> {
  return getAdminFirestore().collection("captureRequests").doc(requestKey);
}

export function buildDeferredEligibilityDecision(): CaptureEligibilityDecision {
  return {
    outcome: "deferred",
    code: CAPTURE_ELIGIBILITY_DEFERRED_CODE,
    message:
      "The capture request was recorded safely, but GrowGo cannot accept or reward it until authoritative pin identity and proximity verification are available."
  };
}

export function buildDeferredCaptureRequestDocument(params: {
  uid: string;
  requestFingerprint: string;
  request: NormalizedCapturePinRequest;
  now: Timestamp;
}): CaptureRequestDocument {
  const eligibility = buildDeferredEligibilityDecision();

  return {
    schemaVersion: CAPTURE_REQUEST_SCHEMA_VERSION,
    uid: params.uid,
    requestId: params.request.requestId,
    operation: "capturePin",
    requestFingerprint: params.requestFingerprint,
    pinId: params.request.pinId,
    clientLatitude: params.request.latitude,
    clientLongitude: params.request.longitude,
    accuracyMetres: params.request.accuracyMetres,
    clientCapturedAt: new Date(params.request.clientCapturedAt),
    receivedAt: params.now.toDate(),
    updatedAt: params.now.toDate(),
    status: "eligibility-deferred",
    eligibilityCode: eligibility.code,
    accepted: false,
    rewardGranted: false,
    response: {
      ok: false,
      accepted: false,
      status: "eligibility-deferred",
      code: eligibility.code
    }
  };
}

export function readStoredCaptureRequestDocument(
  data: DocumentData | undefined
): CaptureRequestDocument {
  if (!data || typeof data !== "object") {
    throw new HttpsError("internal", "Stored capture request document is missing.");
  }

  if (data.schemaVersion !== CAPTURE_REQUEST_SCHEMA_VERSION) {
    throw new HttpsError(
      "internal",
      "Stored capture request schemaVersion is invalid."
    );
  }

  if (
    data.operation !== "capturePin" ||
    data.status !== "eligibility-deferred" ||
    data.eligibilityCode !== CAPTURE_ELIGIBILITY_DEFERRED_CODE ||
    data.accepted !== false ||
    data.rewardGranted !== false
  ) {
    throw new HttpsError(
      "internal",
      "Stored capture request state is outside the deferred scaffold contract."
    );
  }

  return {
    schemaVersion: CAPTURE_REQUEST_SCHEMA_VERSION,
    uid: requireStringField(data.uid, "uid"),
    requestId: requireStringField(data.requestId, "requestId"),
    operation: "capturePin",
    requestFingerprint: requireStringField(
      data.requestFingerprint,
      "requestFingerprint"
    ),
    pinId: requireStringField(data.pinId, "pinId"),
    clientLatitude: requireNumberField(data.clientLatitude, "clientLatitude"),
    clientLongitude: requireNumberField(data.clientLongitude, "clientLongitude"),
    accuracyMetres: requireNumberField(data.accuracyMetres, "accuracyMetres"),
    clientCapturedAt: asDate(data.clientCapturedAt, "clientCapturedAt"),
    receivedAt: asDate(data.receivedAt, "receivedAt"),
    updatedAt: asDate(data.updatedAt, "updatedAt"),
    status: "eligibility-deferred",
    eligibilityCode: CAPTURE_ELIGIBILITY_DEFERRED_CODE,
    accepted: false,
    rewardGranted: false,
    response: {
      ok: false,
      accepted: false,
      status: "eligibility-deferred",
      code: CAPTURE_ELIGIBILITY_DEFERRED_CODE
    }
  };
}

export function buildInitialDeferredCaptureResponse(
  request: NormalizedCapturePinRequest
): CapturePinDeferredResponse {
  const eligibility = buildDeferredEligibilityDecision();

  return {
    ok: false,
    accepted: false,
    replayed: false,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: eligibility.code,
    message: eligibility.message,
    requestId: request.requestId,
    pinId: request.pinId
  };
}

export function buildReplayDeferredCaptureResponse(
  storedRequest: CaptureRequestDocument
): CapturePinDeferredResponse {
  return {
    ok: false,
    accepted: false,
    replayed: true,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: storedRequest.response.code,
    message:
      "The original deferred result was returned without applying any additional write or reward.",
    requestId: storedRequest.requestId,
    pinId: storedRequest.pinId
  };
}

function hashValue(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function requireStringField(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpsError("internal", `Stored capture request ${label} is invalid.`);
  }

  return value;
}

function requireNumberField(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpsError("internal", `Stored capture request ${label} is invalid.`);
  }

  return value;
}

function asDate(value: unknown, label: string): Date {
  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  throw new HttpsError("internal", `Stored capture request ${label} is invalid.`);
}
