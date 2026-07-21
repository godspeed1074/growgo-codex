import type {
  AuthoritativeSourceAcquisitionGates,
  AuthoritativeSourceAcquisitionPolicy,
  AuthoritativeSourceAcquisitionReference,
  AuthoritativeSourceAcquisitionResult,
  AuthoritativeSourceCache,
  AuthoritativeSourceClock,
  AuthoritativeSourceTransport
} from "./authoritativePinAcquisitionTypes";
import {
  buildNegativeAuthoritativeSourceCacheRecord,
  buildPositiveAuthoritativeSourceCacheRecord,
  isAuthoritativeSourceCacheRecordFresh,
  isAuthoritativeSourceCacheRecordUsableAsStale,
  validateAuthoritativeSourceCacheRecord,
  validateTransportedPinSource
} from "./authoritativePinCache";

export async function acquireAuthoritativePinSource(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  transport: AuthoritativeSourceTransport;
  cache: AuthoritativeSourceCache;
  clock: AuthoritativeSourceClock;
  policy: AuthoritativeSourceAcquisitionPolicy;
  gates: AuthoritativeSourceAcquisitionGates;
}): Promise<AuthoritativeSourceAcquisitionResult> {
  if (!params.gates.enabled) {
    return {
      ok: false,
      code: "transport-failed",
      retryable: true,
      cacheStatus: "budget-blocked"
    };
  }

  const now = params.clock.now();
  const cachedRecord = params.gates.cacheReadsEnabled
    ? await params.cache.read(params.reference)
    : null;

  if (cachedRecord) {
    const validatedCachedRecord = validateAuthoritativeSourceCacheRecord({
      reference: params.reference,
      record: cachedRecord
    });

    if (
      validatedCachedRecord.ok &&
      isAuthoritativeSourceCacheRecordFresh({
        record: validatedCachedRecord.record,
        now,
        positiveFreshDurationSeconds:
          params.policy.positiveFreshDurationSeconds
      })
    ) {
      if (validatedCachedRecord.record.kind === "positive") {
        return {
          ok: true,
          source: {
            generatorVersion: validatedCachedRecord.record.source.generatorVersion,
            sourceType: validatedCachedRecord.record.source.sourceType,
            sourceId: validatedCachedRecord.record.source.sourceId,
            orderedCoordinates:
              validatedCachedRecord.record.source.orderedCoordinates,
            spacingMetres: validatedCachedRecord.record.source.spacingMetres
          },
          fetchedAt: validatedCachedRecord.record.source.fetchedAt,
          cacheStatus: "positive-hit"
        };
      }

      return {
        ok: false,
        code: validatedCachedRecord.record.code,
        retryable: validatedCachedRecord.record.retryable,
        retryAfterSeconds: validatedCachedRecord.record.retryAfterSeconds,
        cacheStatus: "negative-hit"
      };
    }
  }

  if (!params.gates.remoteTransportEnabled) {
    return {
      ok: false,
      code: "transport-failed",
      retryable: true,
      cacheStatus: "budget-blocked"
    };
  }

  if (
    params.policy.maxTransportRequestsPerInvocation !== 1 ||
    params.policy.automaticRetryCount !== 0
  ) {
    return {
      ok: false,
      code: "request-budget-exhausted",
      retryable: true,
      cacheStatus: "budget-blocked"
    };
  }

  const transportResult = await params.transport.fetchSource(params.reference);
  if (!transportResult.ok) {
    const stalePositiveRecord = getUsableStalePositiveRecord({
      reference: params.reference,
      record: cachedRecord,
      now,
      allowStaleFallback:
        params.gates.allowStaleFallback &&
        transportResult.code === "timeout"
    });
    if (stalePositiveRecord) {
      return buildStaleFallbackResult(stalePositiveRecord);
    }

    await maybeWriteNegativeCache({
      reference: params.reference,
      cache: params.cache,
      now,
      policy: params.policy,
      writesEnabled: params.gates.cacheWritesEnabled,
      failure: transportResult
    });

    return {
      ok: false,
      code: transportResult.code,
      retryable: transportResult.retryable,
      retryAfterSeconds: transportResult.retryAfterSeconds,
      cacheStatus: "transport-failed"
    };
  }

  const validatedSource = validateTransportedPinSource({
    reference: params.reference,
    source: transportResult.source
  });
  if (!validatedSource.ok) {
    const stalePositiveRecord = getUsableStalePositiveRecord({
      reference: params.reference,
      record: cachedRecord,
      now,
      allowStaleFallback:
        params.gates.allowStaleFallback &&
        validatedSource.code === "source-incomplete"
    });
    if (stalePositiveRecord) {
      return buildStaleFallbackResult(stalePositiveRecord);
    }

    if (params.gates.cacheWritesEnabled) {
      await params.cache.write(
        params.reference,
        buildNegativeAuthoritativeSourceCacheRecord({
          code: validatedSource.code,
          retryable: validatedSource.code !== "source-incomplete",
          cachedAt: now,
          expiresAt: new Date(
            now.getTime() + params.policy.negativeCacheDurationSeconds * 1000
          )
        })
      );
    }

    return {
      ok: false,
      code: validatedSource.code,
      retryable: validatedSource.code !== "source-incomplete",
      cacheStatus: "transport-failed"
    };
  }

  if (params.gates.cacheWritesEnabled) {
    await params.cache.write(
      params.reference,
      buildPositiveAuthoritativeSourceCacheRecord({
        source: validatedSource.source,
        cachedAt: now,
        expiresAt: new Date(
          now.getTime() + params.policy.positiveStaleLifetimeSeconds * 1000
        )
      })
    );
  }

  return {
    ok: true,
    source: {
      generatorVersion: validatedSource.source.generatorVersion,
      sourceType: validatedSource.source.sourceType,
      sourceId: validatedSource.source.sourceId,
      orderedCoordinates: validatedSource.source.orderedCoordinates,
      spacingMetres: validatedSource.source.spacingMetres
    },
    fetchedAt: validatedSource.source.fetchedAt,
    cacheStatus: "transport-refresh"
  };
}

export function createSystemAuthoritativeSourceClock():
  AuthoritativeSourceClock {
  return {
    now(): Date {
      return new Date();
    }
  };
}

export function createDisabledAuthoritativeSourceTransport():
  AuthoritativeSourceTransport {
  return {
    async fetchSource() {
      return {
        ok: false,
        code: "transport-failed" as const,
        retryable: true
      };
    }
  };
}

async function maybeWriteNegativeCache(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  cache: AuthoritativeSourceCache;
  now: Date;
  policy: AuthoritativeSourceAcquisitionPolicy;
  writesEnabled: boolean;
  failure: Extract<
    Awaited<ReturnType<AuthoritativeSourceTransport["fetchSource"]>>,
    { ok: false }
  >;
}): Promise<void> {
  if (!params.writesEnabled) {
    return;
  }

  const ttlSeconds = resolveNegativeCacheTtlSeconds({
    failure: params.failure,
    policy: params.policy
  });

  await params.cache.write(
    params.reference,
    buildNegativeAuthoritativeSourceCacheRecord({
      code: params.failure.code,
      retryable: params.failure.retryable,
      retryAfterSeconds: params.failure.retryAfterSeconds,
      cachedAt: params.now,
      expiresAt: new Date(params.now.getTime() + ttlSeconds * 1000)
    })
  );
}

function resolveNegativeCacheTtlSeconds(params: {
  failure: Extract<
    Awaited<ReturnType<AuthoritativeSourceTransport["fetchSource"]>>,
    { ok: false }
  >;
  policy: AuthoritativeSourceAcquisitionPolicy;
}): number {
  switch (params.failure.code) {
    case "rate-limited":
      return Math.max(
        params.policy.rateLimitedMinimumRetryAfterSeconds,
        Math.min(
          params.policy.rateLimitedMaximumRetryAfterSeconds,
          Math.ceil(params.failure.retryAfterSeconds ?? 0) ||
            params.policy.rateLimitedMinimumRetryAfterSeconds
        )
      );
    default:
      return params.policy.negativeCacheDurationSeconds;
  }
}

function getUsableStalePositiveRecord(params: {
  reference: AuthoritativeSourceAcquisitionReference;
  record: Awaited<ReturnType<AuthoritativeSourceCache["read"]>>;
  now: Date;
  allowStaleFallback: boolean;
}):
  | Extract<
      NonNullable<Awaited<ReturnType<AuthoritativeSourceCache["read"]>>>,
      { kind: "positive" }
    >
  | null {
  if (!params.allowStaleFallback || params.record === null) {
    return null;
  }

  const validated = validateAuthoritativeSourceCacheRecord({
    reference: params.reference,
    record: params.record
  });

  if (
    validated.ok &&
    validated.record.kind === "positive" &&
    isAuthoritativeSourceCacheRecordUsableAsStale({
      record: validated.record,
      now: params.now
    })
  ) {
    return validated.record;
  }

  return null;
}

function buildStaleFallbackResult(
  cachedRecord: Extract<
    NonNullable<Awaited<ReturnType<AuthoritativeSourceCache["read"]>>>,
    { kind: "positive" }
  >
): AuthoritativeSourceAcquisitionResult {
  return {
    ok: true,
    source: {
      generatorVersion: cachedRecord.source.generatorVersion,
      sourceType: cachedRecord.source.sourceType,
      sourceId: cachedRecord.source.sourceId,
      orderedCoordinates: cachedRecord.source.orderedCoordinates,
      spacingMetres: cachedRecord.source.spacingMetres
    },
    fetchedAt: cachedRecord.source.fetchedAt,
    cacheStatus: "stale-fallback"
  };
}
