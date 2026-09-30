export const TEST_CAPTURE_RANGE_ALLOWED_NAME_KEYS = Object.freeze([
  "rubberlips",
  "obi-cal"
] as const);

const allowedNameKeys = new Set<string>(TEST_CAPTURE_RANGE_ALLOWED_NAME_KEYS);

/** Resolve eligible permanent names; callers must verify the reserved UID too. */
export function getTestCaptureRangeAllowedNameKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  return allowedNameKeys.has(key) ? key : null;
}

export function isTestCaptureRangeAccountIdentity(params: {
  displayName: unknown;
  authenticatedUid: string;
  reservedUid: unknown;
}): boolean {
  return getTestCaptureRangeAllowedNameKey(params.displayName) !== null &&
    params.reservedUid === params.authenticatedUid;
}
