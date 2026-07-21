import {
  CANONICAL_BASE_PIN_ID_NAMESPACE,
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  LEGACY_COORDINATE_PIN_GENERATOR_VERSION,
  MAX_CANONICAL_PIN_ID_LENGTH,
  MAX_CANONICAL_SOURCE_ID_LENGTH,
  type ParseableCanonicalPinId
} from "./basePinTypes";

const LEGACY_COORDINATE_PIN_ID_PATTERN =
  /^-?\d{1,3}\.\d{6},-?\d{1,3}\.\d{6}$/;
const OSM_NUMERIC_SOURCE_ID_PATTERN = /^[1-9]\d{0,18}$/;

export function formatCanonicalPinId(
  input: ParseableCanonicalPinId
): string {
  validateGeneratorVersion(input.generatorVersion);
  validateSourceType(input.sourceType);
  validateSourceId(input.sourceId);
  validatePositionIndex(input.positionIndex);

  const pinId = [
    CANONICAL_BASE_PIN_ID_NAMESPACE,
    `v${input.generatorVersion}`,
    input.sourceType,
    input.sourceId,
    String(input.positionIndex)
  ].join(":");

  if (pinId.length > MAX_CANONICAL_PIN_ID_LENGTH) {
    throw new RangeError(
      `Canonical pin ID exceeds the maximum supported length of ${MAX_CANONICAL_PIN_ID_LENGTH}.`
    );
  }

  return pinId;
}

export function parseCanonicalPinId(pinId: string): ParseableCanonicalPinId {
  if (typeof pinId !== "string" || pinId.length === 0) {
    throw new TypeError("Canonical pin ID must be a non-empty string.");
  }

  if (pinId.length > MAX_CANONICAL_PIN_ID_LENGTH) {
    throw new RangeError(
      `Canonical pin ID exceeds the maximum supported length of ${MAX_CANONICAL_PIN_ID_LENGTH}.`
    );
  }

  const segments = pinId.split(":");
  if (segments.length !== 5) {
    throw new TypeError("Canonical pin ID must contain exactly five segments.");
  }

  const [namespace, versionToken, sourceType, sourceId, positionIndexToken] =
    segments;

  if (namespace !== CANONICAL_BASE_PIN_ID_NAMESPACE) {
    throw new TypeError("Canonical pin ID namespace is invalid.");
  }

  if (!/^v\d+$/.test(versionToken)) {
    throw new TypeError("Canonical pin ID version segment is invalid.");
  }

  const generatorVersion = Number(versionToken.slice(1));
  validateGeneratorVersion(generatorVersion);
  validateSourceType(sourceType);
  validateSourceId(sourceId);

  if (!/^(0|[1-9]\d*)$/.test(positionIndexToken)) {
    throw new TypeError("Canonical pin ID position index segment is invalid.");
  }

  const positionIndex = Number(positionIndexToken);
  validatePositionIndex(positionIndex);

  return {
    generatorVersion,
    sourceType,
    sourceId,
    positionIndex
  };
}

export function isLegacyCoordinatePinId(pinId: string): boolean {
  return LEGACY_COORDINATE_PIN_ID_PATTERN.test(pinId);
}

export function getLegacyCoordinatePinGeneratorVersion():
  typeof LEGACY_COORDINATE_PIN_GENERATOR_VERSION {
  return LEGACY_COORDINATE_PIN_GENERATOR_VERSION;
}

function validateGeneratorVersion(value: number): asserts value is 1 {
  if (value !== GROWGO_BASE_PIN_GENERATOR_VERSION) {
    throw new RangeError(
      `Unsupported canonical pin generator version: ${String(value)}.`
    );
  }
}

function validateSourceType(
  value: string
): asserts value is typeof CANONICAL_BASE_PIN_SOURCE_TYPE {
  if (value !== CANONICAL_BASE_PIN_SOURCE_TYPE) {
    throw new TypeError(`Unsupported canonical pin source type: ${value}.`);
  }
}

function validateSourceId(value: string): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("Canonical pin sourceId must be a non-empty string.");
  }

  if (value.length > MAX_CANONICAL_SOURCE_ID_LENGTH) {
    throw new RangeError(
      `Canonical pin sourceId exceeds the maximum supported length of ${MAX_CANONICAL_SOURCE_ID_LENGTH}.`
    );
  }

  if (!OSM_NUMERIC_SOURCE_ID_PATTERN.test(value)) {
    throw new TypeError(
      "Canonical pin sourceId must be a positive base-10 OSM identifier string."
    );
  }
}

function validatePositionIndex(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(
      "Canonical pin positionIndex must be a non-negative safe integer."
    );
  }
}
