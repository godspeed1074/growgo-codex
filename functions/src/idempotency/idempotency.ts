import { createHash } from "node:crypto";

import { HttpsError } from "firebase-functions/v2/https";
import {
  Timestamp,
  type DocumentData,
  type DocumentReference
} from "firebase-admin/firestore";

import { getAdminFirestore } from "../firebaseAdmin";
import type {
  CapturePinDeferredResponse,
  NormalizedCapturePinRequest
} from "../domain/captures/captureTypes";
import {
  buildCaptureRequestKey,
  buildDeferredCaptureRequestDocument,
  buildInitialDeferredCaptureResponse
} from "../domain/captures/captureRequestStore";

export interface IdempotencyEnvelope {
  requestId: string;
  operation: "bootstrapPlayer" | "getPlayerSnapshot" | "capturePin";
  uid: string;
}

export interface IdempotencyReservationResult {
  supported: false;
  strategy: "firestore-transaction-todo";
  reservationState: "not-attempted";
  duplicateRequestDetected: false;
}

export const IDEMPOTENCY_RESERVATION_SCHEMA_VERSION = 1 as const;
export const IDEMPOTENCY_RESERVATION_COLLECTION_ID = "idempotency" as const;
export const CAPTURE_IDEMPOTENCY_RESERVATION_STATE = "capture-deferred" as const;
export const CAPTURE_IDEMPOTENCY_RETENTION_DAYS = 30 as const;

export interface DeferredCaptureIdempotencyReservationResponse {
  ok: false;
  accepted: false;
  rewardGranted: false;
  status: "eligibility-deferred";
  code: CapturePinDeferredResponse["code"];
  requestId: string;
  pinId: string;
}

export interface DeferredCaptureIdempotencyReservationDocument {
  schemaVersion: 1;
  uid: string;
  operation: "capturePin";
  idempotencyKey: string;
  requestFingerprint: string;
  reservationState: typeof CAPTURE_IDEMPOTENCY_RESERVATION_STATE;
  captureRequestKey: string;
  retentionDays: typeof CAPTURE_IDEMPOTENCY_RETENTION_DAYS;
  createdAt: Date;
  updatedAt: Date;
  response: DeferredCaptureIdempotencyReservationResponse;
}

export interface DeferredCaptureIdempotencyReservationDecision {
  classification: "first-request" | "exact-replay";
  reservationKey: string;
  captureRequestKey: string;
  requestFingerprint: string;
  response: CapturePinDeferredResponse;
}

export function buildIdempotencyEnvelope(
  envelope: IdempotencyEnvelope
): IdempotencyEnvelope {
  return { ...envelope };
}

export function buildIdempotencyReservationKey(
  envelope: IdempotencyEnvelope
): string {
  validateIdempotencyEnvelope(envelope);

  return `idempotency-${hashValue(
    JSON.stringify({
      uid: envelope.uid,
      operation: envelope.operation,
      requestId: envelope.requestId
    })
  )}`;
}

export function getIdempotencyReservationDocumentRef(
  reservationKey: string
): DocumentReference<DocumentData> {
  if (!isNonEmptyString(reservationKey)) {
    throw new HttpsError(
      "invalid-argument",
      "Idempotency reservation key must be a non-empty string."
    );
  }

  return getAdminFirestore()
    .collection(IDEMPOTENCY_RESERVATION_COLLECTION_ID)
    .doc(reservationKey);
}

export function readDeferredCaptureIdempotencyReservationDocument(
  data: DocumentData | undefined
): DeferredCaptureIdempotencyReservationDocument {
  if (!data || typeof data !== "object") {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation document is missing."
    );
  }

  if (data.schemaVersion !== IDEMPOTENCY_RESERVATION_SCHEMA_VERSION) {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation schemaVersion is invalid."
    );
  }

  if (
    data.operation !== "capturePin" ||
    data.reservationState !== CAPTURE_IDEMPOTENCY_RESERVATION_STATE ||
    data.retentionDays !== CAPTURE_IDEMPOTENCY_RETENTION_DAYS
  ) {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation state is invalid."
    );
  }

  return {
    schemaVersion: IDEMPOTENCY_RESERVATION_SCHEMA_VERSION,
    uid: requireStringField(data.uid, "uid"),
    operation: "capturePin",
    idempotencyKey: requireStringField(data.idempotencyKey, "idempotencyKey"),
    requestFingerprint: requireHexSha256Field(
      data.requestFingerprint,
      "requestFingerprint"
    ),
    reservationState: CAPTURE_IDEMPOTENCY_RESERVATION_STATE,
    captureRequestKey: requireStringField(data.captureRequestKey, "captureRequestKey"),
    retentionDays: CAPTURE_IDEMPOTENCY_RETENTION_DAYS,
    createdAt: asDate(data.createdAt, "createdAt"),
    updatedAt: asDate(data.updatedAt, "updatedAt"),
    response: readDeferredCaptureReservationResponse(data.response)
  };
}

export function buildDeferredCaptureIdempotencyReservationDocument(params: {
  envelope: IdempotencyEnvelope;
  requestFingerprint: string;
  captureRequestKey: string;
  response: CapturePinDeferredResponse;
  now: Timestamp;
}): DeferredCaptureIdempotencyReservationDocument {
  validateIdempotencyEnvelope(params.envelope);
  validateRequestFingerprint(params.requestFingerprint);

  if (params.envelope.operation !== "capturePin") {
    throw new HttpsError(
      "invalid-argument",
      "Deferred capture reservations require the capturePin operation scope."
    );
  }

  return {
    schemaVersion: IDEMPOTENCY_RESERVATION_SCHEMA_VERSION,
    uid: params.envelope.uid,
    operation: "capturePin",
    idempotencyKey: params.envelope.requestId,
    requestFingerprint: params.requestFingerprint,
    reservationState: CAPTURE_IDEMPOTENCY_RESERVATION_STATE,
    captureRequestKey: params.captureRequestKey,
    retentionDays: CAPTURE_IDEMPOTENCY_RETENTION_DAYS,
    createdAt: params.now.toDate(),
    updatedAt: params.now.toDate(),
    response: {
      ok: false,
      accepted: false,
      rewardGranted: false,
      status: "eligibility-deferred",
      code: params.response.code,
      requestId: params.response.requestId,
      pinId: params.response.pinId
    }
  };
}

export function classifyDeferredCaptureIdempotencyReservation(params: {
  storedReservation: DeferredCaptureIdempotencyReservationDocument;
  envelope: IdempotencyEnvelope;
  requestFingerprint: string;
}): DeferredCaptureIdempotencyReservationDecision {
  validateIdempotencyEnvelope(params.envelope);
  validateRequestFingerprint(params.requestFingerprint);

  if (
    params.storedReservation.uid !== params.envelope.uid ||
    params.storedReservation.operation !== params.envelope.operation ||
    params.storedReservation.idempotencyKey !== params.envelope.requestId
  ) {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation scope does not match the authenticated request."
    );
  }

  if (params.storedReservation.requestFingerprint !== params.requestFingerprint) {
    throw new HttpsError(
      "already-exists",
      "A different capture request already used this requestId for the authenticated player."
    );
  }

  return {
    classification: "exact-replay",
    reservationKey: buildIdempotencyReservationKey(params.envelope),
    captureRequestKey: params.storedReservation.captureRequestKey,
    requestFingerprint: params.requestFingerprint,
    response: buildReplayDeferredCaptureResponseFromReservation(
      params.storedReservation
    )
  };
}

export async function reserveDeferredCaptureIdempotencySlot(params: {
  uid: string;
  request: NormalizedCapturePinRequest;
  requestFingerprint: string;
}): Promise<DeferredCaptureIdempotencyReservationDecision> {
  const envelope = buildIdempotencyEnvelope({
    requestId: params.request.requestId,
    operation: "capturePin",
    uid: params.uid
  });
  validateRequestFingerprint(params.requestFingerprint);

  const reservationKey = buildIdempotencyReservationKey(envelope);
  const captureRequestKey = buildCaptureRequestKey(
    params.uid,
    params.request.requestId
  );
  const reservationRef = getIdempotencyReservationDocumentRef(reservationKey);
  const captureRequestRef = getAdminFirestore()
    .collection("captureRequests")
    .doc(captureRequestKey);

  try {
    return await getAdminFirestore().runTransaction(async (transaction) => {
      const reservationSnapshot = await transaction.get(reservationRef);

      if (reservationSnapshot.exists) {
        return classifyDeferredCaptureIdempotencyReservation({
          storedReservation: readDeferredCaptureIdempotencyReservationDocument(
            reservationSnapshot.data()
          ),
          envelope,
          requestFingerprint: params.requestFingerprint
        });
      }

      const now = Timestamp.now();
      const response = buildInitialDeferredCaptureResponse(params.request);

      transaction.create(
        captureRequestRef,
        buildDeferredCaptureRequestDocument({
          uid: params.uid,
          requestFingerprint: params.requestFingerprint,
          request: params.request,
          now
        })
      );
      transaction.create(
        reservationRef,
        buildDeferredCaptureIdempotencyReservationDocument({
          envelope,
          requestFingerprint: params.requestFingerprint,
          captureRequestKey,
          response,
          now
        })
      );

      return {
        classification: "first-request" as const,
        reservationKey,
        captureRequestKey,
        requestFingerprint: params.requestFingerprint,
        response
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "Capture request idempotency reservation could not be completed safely."
    );
  }
}

export async function reserveIdempotencySlot(
  _envelope: IdempotencyEnvelope
): Promise<IdempotencyReservationResult> {
  // Phase 5A intentionally keeps non-capture idempotency behavior unchanged.
  return {
    supported: false,
    strategy: "firestore-transaction-todo",
    reservationState: "not-attempted",
    duplicateRequestDetected: false
  };
}

function buildReplayDeferredCaptureResponseFromReservation(
  storedReservation: DeferredCaptureIdempotencyReservationDocument
): CapturePinDeferredResponse {
  return {
    ok: false,
    accepted: false,
    replayed: true,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: storedReservation.response.code,
    message:
      "The original deferred result was returned without applying any additional write or reward.",
    requestId: storedReservation.response.requestId,
    pinId: storedReservation.response.pinId
  };
}

function readDeferredCaptureReservationResponse(
  value: unknown
): DeferredCaptureIdempotencyReservationResponse {
  if (!value || typeof value !== "object") {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation response is invalid."
    );
  }

  const candidate = value as Record<string, unknown>;

  if (
    candidate.ok !== false ||
    candidate.accepted !== false ||
    candidate.rewardGranted !== false ||
    candidate.status !== "eligibility-deferred" ||
    candidate.code !== "authoritative-pin-verification-unavailable"
  ) {
    throw new HttpsError(
      "internal",
      "Stored idempotency reservation response is outside the deferred scaffold contract."
    );
  }

  return {
    ok: false,
    accepted: false,
    rewardGranted: false,
    status: "eligibility-deferred",
    code: "authoritative-pin-verification-unavailable",
    requestId: requireStringField(candidate.requestId, "response.requestId"),
    pinId: requireStringField(candidate.pinId, "response.pinId")
  };
}

function validateIdempotencyEnvelope(envelope: IdempotencyEnvelope): void {
  if (!isNonEmptyString(envelope.uid)) {
    throw new HttpsError(
      "invalid-argument",
      "Idempotency envelope uid must be a non-empty string."
    );
  }

  if (!isNonEmptyString(envelope.requestId)) {
    throw new HttpsError(
      "invalid-argument",
      "Idempotency requestId must be a non-empty string."
    );
  }

  if (
    envelope.operation !== "bootstrapPlayer" &&
    envelope.operation !== "getPlayerSnapshot" &&
    envelope.operation !== "capturePin"
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Idempotency operation scope is invalid."
    );
  }
}

function validateRequestFingerprint(value: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new HttpsError(
      "invalid-argument",
      "Capture request fingerprint must be a lowercase SHA-256 hex string."
    );
  }
}

function requireStringField(value: unknown, label: string): string {
  if (!isNonEmptyString(value)) {
    throw new HttpsError(
      "internal",
      `Stored idempotency reservation ${label} is invalid.`
    );
  }

  return value;
}

function requireHexSha256Field(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new HttpsError(
      "internal",
      `Stored idempotency reservation ${label} is invalid.`
    );
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

  throw new HttpsError(
    "internal",
    `Stored idempotency reservation ${label} is invalid.`
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function hashValue(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
