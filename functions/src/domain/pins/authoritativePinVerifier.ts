import {
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  type CanonicalBasePin,
  type CanonicalCoordinate
} from "./basePinTypes";
import {
  parseCanonicalPinId
} from "./canonicalPinId";
import {
  calculateHaversineDistanceMetres,
  generateCanonicalPinsForWay
} from "./canonicalPinGenerator";
import type {
  AuthoritativePinSourceGeometry,
  AuthoritativePinSourceProvider,
  CanonicalPinSourceReference
} from "./authoritativePinSource";

export const AUTHORITATIVE_PIN_SUBMITTED_COORDINATE_TOLERANCE_METRES = 1 as const;

export interface AuthoritativePinVerificationInput {
  pinId: string;
  submittedLatitude: number;
  submittedLongitude: number;
}

export type AuthoritativePinVerificationFailureCode =
  | "invalid-canonical-pin-id"
  | "unsupported-generator-version"
  | "unsupported-source-type"
  | "authoritative-source-unavailable"
  | "authoritative-source-mismatch"
  | "authoritative-source-invalid"
  | "position-index-out-of-range"
  | "canonical-id-mismatch"
  | "submitted-coordinate-mismatch"
  | "authoritative-provider-failed";

export type AuthoritativePinVerificationResult =
  | {
      ok: true;
      code: "verified";
      canonicalPin: CanonicalBasePin;
      submittedCoordinateErrorMetres: number;
    }
  | {
      ok: false;
      code: AuthoritativePinVerificationFailureCode;
      retryable: boolean;
      details?: {
        sourceId?: string;
        positionIndex?: number;
        submittedCoordinateErrorMetres?: number;
        reason?: string;
      };
    };

export async function verifyAuthoritativeCanonicalPin(params: {
  input: AuthoritativePinVerificationInput;
  provider: AuthoritativePinSourceProvider;
}): Promise<AuthoritativePinVerificationResult> {
  const validatedInput = validateVerificationInput(params.input);
  if (!validatedInput.ok) {
    return validatedInput.result;
  }

  const parsedPinId = parseCanonicalPinIdSafely(validatedInput.input.pinId);
  if (!parsedPinId.ok) {
    return parsedPinId.result;
  }

  const sourceReference: CanonicalPinSourceReference = {
    generatorVersion: parsedPinId.parsedPinId.generatorVersion,
    sourceType: parsedPinId.parsedPinId.sourceType,
    sourceId: parsedPinId.parsedPinId.sourceId
  };

  let sourceGeometry: AuthoritativePinSourceGeometry | null;
  try {
    sourceGeometry = await params.provider.getSourceGeometry(sourceReference);
  } catch {
    return {
      ok: false,
      code: "authoritative-provider-failed",
      retryable: true,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex,
        reason: "provider-threw"
      }
    };
  }

  if (sourceGeometry === null) {
    return {
      ok: false,
      code: "authoritative-source-unavailable",
      retryable: true,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex
      }
    };
  }

  const validatedGeometry = validateSourceGeometry({
    requestedSource: sourceReference,
    geometry: sourceGeometry
  });
  if (!validatedGeometry.ok) {
    return validatedGeometry.result;
  }

  let canonicalPins: CanonicalBasePin[];
  try {
    canonicalPins = generateCanonicalPinsForWay(validatedGeometry.geometry);
  } catch {
    return {
      ok: false,
      code: "authoritative-source-invalid",
      retryable: false,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex,
        reason: "canonical-regeneration-failed"
      }
    };
  }

  const canonicalPin =
    canonicalPins[parsedPinId.parsedPinId.positionIndex] ?? null;
  if (!canonicalPin) {
    return {
      ok: false,
      code: "position-index-out-of-range",
      retryable: false,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex
      }
    };
  }

  if (canonicalPin.pinId !== validatedInput.input.pinId) {
    return {
      ok: false,
      code: "canonical-id-mismatch",
      retryable: false,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex
      }
    };
  }

  const submittedCoordinateErrorMetres = calculateHaversineDistanceMetres(
    {
      latitude: validatedInput.input.submittedLatitude,
      longitude: validatedInput.input.submittedLongitude
    },
    {
      latitude: canonicalPin.latitude,
      longitude: canonicalPin.longitude
    }
  );

  if (
    submittedCoordinateErrorMetres >
    AUTHORITATIVE_PIN_SUBMITTED_COORDINATE_TOLERANCE_METRES
  ) {
    return {
      ok: false,
      code: "submitted-coordinate-mismatch",
      retryable: false,
      details: {
        sourceId: sourceReference.sourceId,
        positionIndex: parsedPinId.parsedPinId.positionIndex,
        submittedCoordinateErrorMetres
      }
    };
  }

  return {
    ok: true,
    code: "verified",
    canonicalPin,
    submittedCoordinateErrorMetres
  };
}

function validateVerificationInput(input: AuthoritativePinVerificationInput):
  | {
      ok: true;
      input: AuthoritativePinVerificationInput;
    }
  | {
      ok: false;
      result: AuthoritativePinVerificationResult;
    } {
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.pinId !== "string" ||
    input.pinId.length === 0
  ) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "invalid-canonical-pin-id",
        retryable: false,
        details: {
          reason: "missing-pin-id"
        }
      }
    };
  }

  const coordinateValidation = [
    validateCoordinateValue(input.submittedLatitude, "submittedLatitude"),
    validateCoordinateValue(input.submittedLongitude, "submittedLongitude")
  ].find((result) => result !== null);

  if (coordinateValidation) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "submitted-coordinate-mismatch",
        retryable: false,
        details: {
          reason: coordinateValidation
        }
      }
    };
  }

  return {
    ok: true,
    input
  };
}

function validateCoordinateValue(
  value: number,
  label: "submittedLatitude" | "submittedLongitude"
): string | null {
  if (!Number.isFinite(value)) {
    return `${label}-non-finite`;
  }

  if (label === "submittedLatitude" && (value < -90 || value > 90)) {
    return `${label}-out-of-range`;
  }

  if (label === "submittedLongitude" && (value < -180 || value > 180)) {
    return `${label}-out-of-range`;
  }

  return null;
}

function parseCanonicalPinIdSafely(pinId: string):
  | {
      ok: true;
      parsedPinId: CanonicalPinSourceReference & { positionIndex: number };
    }
  | {
      ok: false;
      result: AuthoritativePinVerificationResult;
    } {
  try {
    return {
      ok: true,
      parsedPinId: parseCanonicalPinId(pinId)
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown-canonical-pin-id-error";

    if (message.includes("Unsupported canonical pin generator version")) {
      return {
        ok: false,
        result: {
          ok: false,
          code: "unsupported-generator-version",
          retryable: false
        }
      };
    }

    if (message.includes("Unsupported canonical pin source type")) {
      return {
        ok: false,
        result: {
          ok: false,
          code: "unsupported-source-type",
          retryable: false
        }
      };
    }

    return {
      ok: false,
      result: {
        ok: false,
        code: "invalid-canonical-pin-id",
        retryable: false
      }
    };
  }
}

function validateSourceGeometry(params: {
  requestedSource: CanonicalPinSourceReference;
  geometry: AuthoritativePinSourceGeometry;
}):
  | {
      ok: true;
      geometry: AuthoritativePinSourceGeometry;
    }
  | {
      ok: false;
      result: AuthoritativePinVerificationResult;
    } {
  const { requestedSource, geometry } = params;

  if (geometry.generatorVersion !== GROWGO_BASE_PIN_GENERATOR_VERSION) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-mismatch",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "generator-version-mismatch"
        }
      }
    };
  }

  if (geometry.sourceType !== CANONICAL_BASE_PIN_SOURCE_TYPE) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-mismatch",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "source-type-mismatch"
        }
      }
    };
  }

  if (geometry.sourceId !== requestedSource.sourceId) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-mismatch",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "source-id-mismatch"
        }
      }
    };
  }

  if (geometry.spacingMetres !== CANONICAL_V1_BASE_PIN_SPACING_METRES) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-invalid",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "spacing-mismatch"
        }
      }
    };
  }

  if (!Array.isArray(geometry.orderedCoordinates)) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-invalid",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "coordinates-not-array"
        }
      }
    };
  }

  if (geometry.orderedCoordinates.length === 0) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-invalid",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: "coordinates-empty"
        }
      }
    };
  }

  const invalidCoordinate = geometry.orderedCoordinates.find(
    (coordinate) => validateCanonicalCoordinate(coordinate) !== null
  );
  if (invalidCoordinate) {
    return {
      ok: false,
      result: {
        ok: false,
        code: "authoritative-source-invalid",
        retryable: false,
        details: {
          sourceId: requestedSource.sourceId,
          reason: validateCanonicalCoordinate(invalidCoordinate) ?? "coordinate-invalid"
        }
      }
    };
  }

  return {
    ok: true,
    geometry
  };
}

function validateCanonicalCoordinate(coordinate: CanonicalCoordinate): string | null {
  if (!coordinate || typeof coordinate !== "object") {
    return "coordinate-missing";
  }

  if (!Number.isFinite(coordinate.latitude)) {
    return "latitude-non-finite";
  }

  if (!Number.isFinite(coordinate.longitude)) {
    return "longitude-non-finite";
  }

  if (coordinate.latitude < -90 || coordinate.latitude > 90) {
    return "latitude-out-of-range";
  }

  if (coordinate.longitude < -180 || coordinate.longitude > 180) {
    return "longitude-out-of-range";
  }

  return null;
}
