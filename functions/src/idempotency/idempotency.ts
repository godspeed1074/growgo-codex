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

export function buildIdempotencyEnvelope(
  envelope: IdempotencyEnvelope
): IdempotencyEnvelope {
  return { ...envelope };
}

export async function reserveIdempotencySlot(
  _envelope: IdempotencyEnvelope
): Promise<IdempotencyReservationResult> {
  // TODO: Implement Firestore-backed idempotency reservation inside an Admin SDK
  // transaction once dependencies are installed and later verification passes.
  return {
    supported: false,
    strategy: "firestore-transaction-todo",
    reservationState: "not-attempted",
    duplicateRequestDetected: false
  };
}
