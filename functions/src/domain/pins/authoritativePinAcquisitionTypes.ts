import type {
  AuthoritativePinSourceGeometry,
  CanonicalPinSourceReference
} from "./authoritativePinSource";

export type AuthoritativeSourceAcquisitionReference =
  CanonicalPinSourceReference;

export type AuthoritativeTransportedPinSource =
  AuthoritativePinSourceGeometry & {
    fetchedAt: string;
  };

export type AuthoritativeSourceTransportResult =
  | {
      ok: true;
      source: AuthoritativeTransportedPinSource;
    }
  | {
      ok: false;
      code:
        | "not-found"
        | "rate-limited"
        | "timeout"
        | "transport-failed"
        | "invalid-response"
        | "source-incomplete";
      retryable: boolean;
      retryAfterSeconds?: number;
    };

export interface AuthoritativeSourceTransport {
  fetchSource(
    reference: AuthoritativeSourceAcquisitionReference
  ): Promise<AuthoritativeSourceTransportResult>;
}

export type AuthoritativeSourceCacheRecord =
  | {
      kind: "positive";
      source: AuthoritativeTransportedPinSource;
      cachedAt: string;
      expiresAt: string;
    }
  | {
      kind: "negative";
      code: Extract<
        AuthoritativeSourceTransportResult,
        { ok: false }
      >["code"];
      retryable: boolean;
      retryAfterSeconds?: number;
      cachedAt: string;
      expiresAt: string;
    };

export interface AuthoritativeSourceCache {
  read(
    reference: AuthoritativeSourceAcquisitionReference
  ): Promise<AuthoritativeSourceCacheRecord | null>;

  write(
    reference: AuthoritativeSourceAcquisitionReference,
    record: AuthoritativeSourceCacheRecord
  ): Promise<void>;
}

export interface AuthoritativeSourceClock {
  now(): Date;
}

export interface AuthoritativeSourceAcquisitionPolicy {
  positiveFreshDurationSeconds: number;
  positiveStaleLifetimeSeconds: number;
  negativeCacheDurationSeconds: number;
  rateLimitedMinimumRetryAfterSeconds: number;
  rateLimitedMaximumRetryAfterSeconds: number;
  maxTransportRequestsPerInvocation: number;
  automaticRetryCount: number;
}

export interface AuthoritativeSourceAcquisitionGates {
  enabled: boolean;
  cacheReadsEnabled: boolean;
  cacheWritesEnabled: boolean;
  remoteTransportEnabled: boolean;
  allowStaleFallback: boolean;
}

export type AuthoritativeSourceAcquisitionResult =
  | {
      ok: true;
      source: AuthoritativePinSourceGeometry;
      fetchedAt: string;
      cacheStatus: "positive-hit" | "transport-refresh" | "stale-fallback";
    }
  | {
      ok: false;
      code:
        | Extract<AuthoritativeSourceTransportResult, { ok: false }>["code"]
        | "request-budget-exhausted";
      retryable: boolean;
      retryAfterSeconds?: number;
      cacheStatus: "negative-hit" | "transport-failed" | "budget-blocked";
    };
