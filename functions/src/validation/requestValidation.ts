import { HttpsError } from "firebase-functions/v2/https";

export type JsonObject = Record<string, unknown>;

export function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpsError("invalid-argument", `${label} must be an object.`);
  }

  return value as JsonObject;
}

export function assertAllowedKeys(
  payload: JsonObject,
  allowedKeys: readonly string[],
  label: string
): void {
  const allowed = new Set(allowedKeys);
  const unexpectedKeys = Object.keys(payload).filter((key) => !allowed.has(key));

  if (unexpectedKeys.length > 0) {
    throw new HttpsError(
      "invalid-argument",
      `${label} contains unsupported keys: ${unexpectedKeys.join(", ")}.`
    );
  }
}

export function requireRequestId(value: unknown): string {
  return requireString(value, "requestId", 1, 128);
}

export function requireString(
  value: unknown,
  label: string,
  minLength = 1,
  maxLength = 256
): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${label} must be a string.`);
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new HttpsError(
      "invalid-argument",
      `${label} must be between ${minLength} and ${maxLength} characters.`
    );
  }

  return trimmed;
}

export function optionalNullableString(
  value: unknown,
  label: string,
  maxLength = 256
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return requireString(value, label, 1, maxLength);
}

export function requireFiniteNumber(
  value: unknown,
  label: string,
  min?: number,
  max?: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new HttpsError("invalid-argument", `${label} must be a finite number.`);
  }

  if (min !== undefined && value < min) {
    throw new HttpsError(
      "invalid-argument",
      `${label} must be greater than or equal to ${min}.`
    );
  }

  if (max !== undefined && value > max) {
    throw new HttpsError(
      "invalid-argument",
      `${label} must be less than or equal to ${max}.`
    );
  }

  return value;
}

export function requireIsoTimestamp(value: unknown, label: string): string {
  const iso = requireString(value, label, 10, 64);
  const parsed = Date.parse(iso);

  if (Number.isNaN(parsed)) {
    throw new HttpsError(
      "invalid-argument",
      `${label} must be a valid ISO-8601 timestamp string.`
    );
  }

  return iso;
}
