import type {
  AuthoritativeSourceAcquisitionReference,
  AuthoritativeSourceCache,
  AuthoritativeSourceCacheRecord,
  AuthoritativeTransportedPinSource
} from "./authoritativePinAcquisitionTypes";
import {
  CANONICAL_BASE_PIN_SOURCE_TYPE,
  CANONICAL_V1_BASE_PIN_SPACING_METRES,
  GROWGO_BASE_PIN_GENERATOR_VERSION,
  type CanonicalCoordinate
} from "./basePinTypes";

export function createNoopAuthoritativeSourceCache():
  AuthoritativeSourceCache {
  return {
    async read(): Promise<AuthoritativeSourceCacheRecord | null> {
      return null;
    },
    async write(): Promise<void> {}
  };
}

export function buildPositiveAuthoritativeSourceCacheRecord(params: {
  source: AuthoritativeTransportedPinSource;
  cachedAt: Date;
  expiresAt: Date;
}): AuthoritativeSourceCacheRecord {
  return {
    kind: "positive",
    source: params.source,
    cachedAt: params.cachedAt.toISOString(),
    expiresAt: params.expiresAt.toISOString()
  };
}

export function buildNegativeAuthoritativeSourceCacheRecord(params: {
  code: Extract<AuthoritativeSourceCacheRecord, { kind: "negative" }>["code"];
  retryable: boolean;
  retryAfterSeconds?: number;
  cachedAt: Date;
  expiresAt: Date;
}): AuthoritativeSourceCacheRecord {
  const record: Extract<AuthoritativeSourceCacheRecord, { kind: "negative" }> = {
    kind: "negative",
    code: params.code,
    retryable: params.retryable,
    cachedAt: params.cachedAt.toISOString(),
    expiresAt: params.expiresAt.toISOString()
  };

  if (params.retryAfterSeconds !== undefined) {
    return {
      ...record,
      retryAfterSeconds: params.retryAfterSeconds
    };
  }

  return record;
}

export function validateAuthoritativeSourceCacheRecord(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  record: AuthoritativeSourceCacheRecord;
}):
  | {
      ok: true;
      record: AuthoritativeSourceCacheRecord;
    }
  | {
      ok: false;
      reason: string;
    } {
  const cachedAt = parseIsoTimestamp(params.record.cachedAt);
  const expiresAt = parseIsoTimestamp(params.record.expiresAt);

  if (!cachedAt || !expiresAt || expiresAt.getTime() <= cachedAt.getTime()) {
    return {
      ok: false,
      reason: "invalid-cache-timestamps"
    };
  }

  if (params.record.kind === "positive") {
    const sourceValidation = validateTransportedPinSource({
      reference: params.reference,
      source: params.record.source
    });
    if (!sourceValidation.ok) {
      return {
        ok: false,
        reason: sourceValidation.reason
      };
    }
  }

  if (
    params.record.kind === "negative" &&
    params.record.retryAfterSeconds !== undefined &&
    (!Number.isFinite(params.record.retryAfterSeconds) ||
      params.record.retryAfterSeconds <= 0)
  ) {
    return {
      ok: false,
      reason: "invalid-negative-retry-after"
    };
  }

  return {
    ok: true,
    record: params.record
  };
}

export function isAuthoritativeSourceCacheRecordFresh(params: {
  record: AuthoritativeSourceCacheRecord;
  now: Date;
  positiveFreshDurationSeconds: number;
}): boolean {
  if (params.record.kind !== "positive") {
    const expiresAt = parseIsoTimestamp(params.record.expiresAt);
    return expiresAt !== null && expiresAt.getTime() > params.now.getTime();
  }

  const cachedAt = parseIsoTimestamp(params.record.cachedAt);
  if (cachedAt === null) {
    return false;
  }

  return (
    cachedAt.getTime() + params.positiveFreshDurationSeconds * 1000 >
    params.now.getTime()
  );
}

export function isAuthoritativeSourceCacheRecordUsableAsStale(params: {
  record: AuthoritativeSourceCacheRecord;
  now: Date;
}): boolean {
  if (params.record.kind !== "positive") {
    return false;
  }

  const expiresAt = parseIsoTimestamp(params.record.expiresAt);
  return expiresAt !== null && expiresAt.getTime() > params.now.getTime();
}

export function validateTransportedPinSource(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  source: AuthoritativeTransportedPinSource;
}):
  | {
      ok: true;
      source: AuthoritativeTransportedPinSource;
    }
  | {
      ok: false;
      code: "invalid-response" | "source-incomplete";
      reason: string;
    } {
  const { source, reference } = params;

  if (source.generatorVersion !== GROWGO_BASE_PIN_GENERATOR_VERSION) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "generator-version-mismatch"
    };
  }

  if (source.sourceType !== CANONICAL_BASE_PIN_SOURCE_TYPE) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "source-type-mismatch"
    };
  }

  if (source.sourceId !== reference.sourceId) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "source-id-mismatch"
    };
  }

  if (source.spacingMetres !== CANONICAL_V1_BASE_PIN_SPACING_METRES) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "spacing-mismatch"
    };
  }

  if (!Array.isArray(source.orderedCoordinates)) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "ordered-coordinates-not-array"
    };
  }

  if (parseIsoTimestamp(source.fetchedAt) === null) {
    return {
      ok: false,
      code: "invalid-response",
      reason: "invalid-fetched-at"
    };
  }

  const distinctCoordinates: CanonicalCoordinate[] = [];
  for (const coordinate of source.orderedCoordinates) {
    if (!coordinate || typeof coordinate !== "object") {
      return {
        ok: false,
        code: "invalid-response",
        reason: "coordinate-not-object"
      };
    }

    if (
      !Number.isFinite(coordinate.latitude) ||
      !Number.isFinite(coordinate.longitude) ||
      coordinate.latitude < -90 ||
      coordinate.latitude > 90 ||
      coordinate.longitude < -180 ||
      coordinate.longitude > 180
    ) {
      return {
        ok: false,
        code: "invalid-response",
        reason: "coordinate-out-of-range"
      };
    }

    const normalizedCoordinate = {
      latitude: Number(coordinate.latitude.toFixed(7)),
      longitude: Number(coordinate.longitude.toFixed(7))
    };
    const previous = distinctCoordinates[distinctCoordinates.length - 1];
    if (
      previous &&
      previous.latitude === normalizedCoordinate.latitude &&
      previous.longitude === normalizedCoordinate.longitude
    ) {
      continue;
    }

    distinctCoordinates.push(normalizedCoordinate);
  }

  if (distinctCoordinates.length < 2) {
    return {
      ok: false,
      code: "source-incomplete",
      reason: "fewer-than-two-distinct-coordinates"
    };
  }

  return {
    ok: true,
    source
  };
}

function parseIsoTimestamp(value: string): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed;
}
