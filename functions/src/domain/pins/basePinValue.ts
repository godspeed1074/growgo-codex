import { Timestamp, type DocumentData } from "firebase-admin/firestore";

/** Every ordinary base pin begins at five points. */
export const BASE_PIN_STARTING_POINTS = 5 as const;
/** A pin gains one point for each full seven-day period without a capture. */
export const BASE_PIN_VALUE_GROWTH_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000;
export const SHARED_BASE_PIN_CAPTURE_VALUES_COLLECTION =
  "sharedBasePinCaptureValues" as const;

export interface BasePinCaptureValueState {
  pinId: string;
  lastCapturedAt: Date;
  updatedAt: Date;
}

export function getBasePinPointValue(params: {
  lastCapturedAt: Date | null | undefined;
  now: Date;
}): number {
  const lastCapturedAt = params.lastCapturedAt?.getTime();
  if (!Number.isFinite(lastCapturedAt)) return BASE_PIN_STARTING_POINTS;

  const elapsedMilliseconds = Math.max(0, params.now.getTime() - lastCapturedAt!);
  const growthSteps = Math.floor(
    elapsedMilliseconds / BASE_PIN_VALUE_GROWTH_MILLISECONDS
  );

  return BASE_PIN_STARTING_POINTS + growthSteps;
}

export function readBasePinCaptureValueState(
  data: DocumentData | undefined
): BasePinCaptureValueState | null {
  if (
    !data ||
    typeof data.pinId !== "string" ||
    !(data.lastCapturedAt instanceof Timestamp) ||
    !(data.updatedAt instanceof Timestamp)
  ) {
    return null;
  }

  return {
    pinId: data.pinId,
    lastCapturedAt: data.lastCapturedAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  };
}

export function buildBasePinCaptureValueState(params: {
  pinId: string;
  capturedAt: Date;
}) {
  const capturedAt = Timestamp.fromDate(params.capturedAt);
  return {
    schemaVersion: 1,
    pinId: params.pinId,
    lastCapturedAt: capturedAt,
    updatedAt: capturedAt
  };
}
