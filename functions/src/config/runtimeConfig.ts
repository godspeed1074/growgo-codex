const AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS = deepFreeze({
  enabled: false,
  cacheReadsEnabled: false,
  cacheWritesEnabled: false,
  remoteTransportEnabled: false,
  allowStaleFallback: false,
  policy: {
    positiveFreshDurationSeconds: 7 * 24 * 60 * 60,
    positiveStaleLifetimeSeconds: 30 * 24 * 60 * 60,
    negativeCacheDurationSeconds: 6 * 60 * 60,
    rateLimitedMinimumRetryAfterSeconds: 60,
    rateLimitedMaximumRetryAfterSeconds: 6 * 60 * 60,
    maxTransportRequestsPerInvocation: 1,
    automaticRetryCount: 0
  }
} as const);

export function validateAuthoritativeSourceAcquisitionConfig(value: unknown) {
  const candidate = value as {
    enabled?: unknown;
    cacheReadsEnabled?: unknown;
    cacheWritesEnabled?: unknown;
    remoteTransportEnabled?: unknown;
    allowStaleFallback?: unknown;
    policy?: {
      positiveFreshDurationSeconds?: unknown;
      positiveStaleLifetimeSeconds?: unknown;
      negativeCacheDurationSeconds?: unknown;
      rateLimitedMinimumRetryAfterSeconds?: unknown;
      rateLimitedMaximumRetryAfterSeconds?: unknown;
      maxTransportRequestsPerInvocation?: unknown;
      automaticRetryCount?: unknown;
    };
  } | null;

  const normalized = {
    enabled: candidate?.enabled === true,
    cacheReadsEnabled: candidate?.cacheReadsEnabled === true,
    cacheWritesEnabled: candidate?.cacheWritesEnabled === true,
    remoteTransportEnabled: candidate?.remoteTransportEnabled === true,
    allowStaleFallback: candidate?.allowStaleFallback === true,
    policy: {
      positiveFreshDurationSeconds:
        candidate?.policy?.positiveFreshDurationSeconds ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .positiveFreshDurationSeconds
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .positiveFreshDurationSeconds
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .positiveFreshDurationSeconds,
      positiveStaleLifetimeSeconds:
        candidate?.policy?.positiveStaleLifetimeSeconds ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .positiveStaleLifetimeSeconds
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .positiveStaleLifetimeSeconds
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .positiveStaleLifetimeSeconds,
      negativeCacheDurationSeconds:
        candidate?.policy?.negativeCacheDurationSeconds ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .negativeCacheDurationSeconds
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .negativeCacheDurationSeconds
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .negativeCacheDurationSeconds,
      rateLimitedMinimumRetryAfterSeconds:
        candidate?.policy?.rateLimitedMinimumRetryAfterSeconds ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .rateLimitedMinimumRetryAfterSeconds
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .rateLimitedMinimumRetryAfterSeconds
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .rateLimitedMinimumRetryAfterSeconds,
      rateLimitedMaximumRetryAfterSeconds:
        candidate?.policy?.rateLimitedMaximumRetryAfterSeconds ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .rateLimitedMaximumRetryAfterSeconds
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .rateLimitedMaximumRetryAfterSeconds
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .rateLimitedMaximumRetryAfterSeconds,
      maxTransportRequestsPerInvocation:
        candidate?.policy?.maxTransportRequestsPerInvocation ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
          .maxTransportRequestsPerInvocation
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .maxTransportRequestsPerInvocation
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .maxTransportRequestsPerInvocation,
      automaticRetryCount:
        candidate?.policy?.automaticRetryCount ===
        AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy.automaticRetryCount
          ? AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .automaticRetryCount
          : AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS.policy
              .automaticRetryCount
    }
  } as const;

  if (!normalized.enabled) {
    return deepFreeze({
      ...normalized,
      cacheReadsEnabled: false,
      cacheWritesEnabled: false,
      remoteTransportEnabled: false,
      allowStaleFallback: false
    });
  }

  return deepFreeze(normalized);
}

export const runtimeConfig = deepFreeze({
  firebaseAlias: "dev",
  projectId: "growgo-development",
  firestoreDatabaseId: "(default)",
  region: "australia-southeast1",
  appCheck: {
    prepared: true,
    enforceOnCallable: false
  },
  authoritativeSourceAcquisition:
    validateAuthoritativeSourceAcquisitionConfig(
      AUTHORITATIVE_SOURCE_ACQUISITION_DEFAULTS
    ),
  serverAuthority: {
    rewardComputation: "server-only",
    progressionWrites: "server-only",
    inventoryWrites: "server-only",
    captureHistoryWrites: "server-only",
    marketplaceWrites: "server-only"
  }
} as const);

export type RuntimeConfig = typeof runtimeConfig;

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      if (nestedValue && typeof nestedValue === "object") {
        deepFreeze(nestedValue);
      }
    }

    Object.freeze(value);
  }

  return value;
}
