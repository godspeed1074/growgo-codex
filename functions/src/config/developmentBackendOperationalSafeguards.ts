import { createHash } from "node:crypto";
import { HttpsError } from "firebase-functions/v2/https";

import {
  evaluateDevelopmentBackendCapabilityAccess,
  parseStrictBooleanFlag,
  type DevelopmentBackendCapabilityDecision,
  type DevelopmentBackendCapabilityName,
  type ParsedStrictBooleanFlag
} from "./developmentBackendActivation";
import { runtimeConfig } from "./runtimeConfig";
import { OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS } from "../infrastructure/pins/overpassAuthoritativePinTransport";

export const GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED" as const;
export const GROWGO_DEVELOPMENT_BACKEND_EMERGENCY_DISABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_BACKEND_EMERGENCY_DISABLED" as const;
export const GROWGO_DEVELOPMENT_AUTHENTICATION_EMERGENCY_DISABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_AUTHENTICATION_EMERGENCY_DISABLED" as const;
export const GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED" as const;
export const GROWGO_DEVELOPMENT_PIN_CAPTURE_EMERGENCY_DISABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_PIN_CAPTURE_EMERGENCY_DISABLED" as const;
export const GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_EMERGENCY_DISABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_EMERGENCY_DISABLED" as const;
export const GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE" as const;
export const GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL" as const;

export const developmentBackendOperationIdentifiers = [
  "bootstrap_player",
  "player_snapshot",
  "pin_capture",
  "authoritative_pin_acquisition"
] as const;

export type DevelopmentBackendOperationIdentifier =
  (typeof developmentBackendOperationIdentifiers)[number];

export const developmentBackendObservabilityEventNames = [
  "capability_denied",
  "authentication_rejected",
  "snapshot_allowed",
  "snapshot_denied",
  "capture_deferred",
  "capture_replayed",
  "capture_conflict",
  "rate_limit_denied",
  "authoritative_cache_hit",
  "authoritative_cache_miss",
  "authoritative_transport_blocked",
  "emergency_disable_active",
  "rollback_state_active"
] as const;

export type DevelopmentBackendObservabilityEventName =
  (typeof developmentBackendObservabilityEventNames)[number];

export const developmentBackendLoggingLevels = [
  "off",
  "minimal",
  "redacted"
] as const;

export type DevelopmentBackendLoggingLevel =
  (typeof developmentBackendLoggingLevels)[number];

export const developmentBackendRollbackStates = [
  "normal_fail_closed",
  "development_enabled",
  "emergency_disabled",
  "rollback_in_progress",
  "rolled_back_to_passive_foundation"
] as const;

export type DevelopmentBackendRollbackState =
  (typeof developmentBackendRollbackStates)[number];

export const developmentBackendOperationalSafeguardReasonCodes = [
  "allowed",
  "development_access_denied",
  "operational_safeguards_disabled",
  "emergency_disable_active",
  "rollback_state_active",
  "rate_limit_exceeded",
  "rate_limit_state_unavailable"
] as const;

export type DevelopmentBackendOperationalSafeguardReasonCode =
  (typeof developmentBackendOperationalSafeguardReasonCodes)[number];

export const DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_ERROR_CODE =
  "failed-precondition" as const;
export const DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_CLIENT_MESSAGE =
  "This development backend capability is not available in the current environment." as const;
export const DEVELOPMENT_BACKEND_OPERATIONAL_LOG_EVENT_SCHEMA_VERSION = 1 as const;
export const DEVELOPMENT_BACKEND_OPERATIONAL_LOG_EVENT_MAX_BYTES = 512 as const;
export const DEVELOPMENT_BACKEND_OPERATIONAL_UID_HASH_PREFIX_LENGTH = 12 as const;

export interface DevelopmentBackendPerRequestBudget {
  reads: number;
  writes: number;
  providerCalls: number;
  transportAttempts: number;
}

export interface DevelopmentBackendOperationCostBudget {
  operation: DevelopmentBackendOperationIdentifier;
  deniedPath: DevelopmentBackendPerRequestBudget;
  firstRequest: DevelopmentBackendPerRequestBudget;
  duplicateOrReplayRequest: DevelopmentBackendPerRequestBudget;
  conflictingRequest: DevelopmentBackendPerRequestBudget;
  timeoutMilliseconds: number;
  automaticRetryCount: number;
  resultSizeBound: string;
}

export interface DevelopmentBackendRateLimitPolicy {
  operation: DevelopmentBackendOperationIdentifier;
  maxRequests: number;
  windowSeconds: number;
  scope: "authenticated_uid";
  storageKind: "process_local_secondary_safeguard";
  globallyAuthoritative: false;
}

export interface DevelopmentBackendEmergencyDisableFlags {
  global: ParsedStrictBooleanFlag;
  authentication: ParsedStrictBooleanFlag;
  playerSnapshot: ParsedStrictBooleanFlag;
  pinCapture: ParsedStrictBooleanFlag;
  authoritativePinAcquisition: ParsedStrictBooleanFlag;
}

export interface DevelopmentBackendOperationalSafeguardContract {
  safeguardsEnabled: ParsedStrictBooleanFlag;
  rollbackState: DevelopmentBackendRollbackState;
  rollbackStateSourceValue: string | null;
  loggingLevel: DevelopmentBackendLoggingLevel;
  loggingLevelSourceValue: string | null;
  emergencyDisable: DevelopmentBackendEmergencyDisableFlags;
  rateLimits: Readonly<
    Record<DevelopmentBackendOperationIdentifier, DevelopmentBackendRateLimitPolicy>
  >;
  costBudgets: Readonly<
    Record<DevelopmentBackendOperationIdentifier, DevelopmentBackendOperationCostBudget>
  >;
}

export interface DevelopmentBackendOperationalRateLimitRecord {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export interface DevelopmentBackendOperationalRateLimiter {
  consume(params: {
    operation: DevelopmentBackendOperationIdentifier;
    uid: string;
    now: Date;
    policy: DevelopmentBackendRateLimitPolicy;
  }): DevelopmentBackendOperationalRateLimitRecord | null;
}

export interface DevelopmentBackendOperationalSafeguardDecision {
  allowed: boolean;
  operation: DevelopmentBackendOperationIdentifier;
  reason: DevelopmentBackendOperationalSafeguardReasonCode;
  capability: DevelopmentBackendCapabilityName;
  rollbackState: DevelopmentBackendRollbackState;
  loggingLevel: DevelopmentBackendLoggingLevel;
  eventName: DevelopmentBackendObservabilityEventName;
  clientSafeMessage: typeof DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_CLIENT_MESSAGE;
  callableErrorCode: typeof DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_ERROR_CODE;
  capabilityDecision: Readonly<DevelopmentBackendCapabilityDecision>;
  rateLimitPolicy: Readonly<DevelopmentBackendRateLimitPolicy>;
  rateLimitRecord: Readonly<DevelopmentBackendOperationalRateLimitRecord> | null;
  costBudget: Readonly<DevelopmentBackendOperationCostBudget>;
}

export interface DevelopmentBackendStructuredLogEvent {
  schemaVersion: 1;
  eventName: DevelopmentBackendObservabilityEventName;
  operation: DevelopmentBackendOperationIdentifier;
  reason:
    | DevelopmentBackendOperationalSafeguardReasonCode
    | "allowed"
    | "deferred"
    | "replayed"
    | "conflict";
  loggingLevel: DevelopmentBackendLoggingLevel;
  uidHash: string | null;
}

export interface DevelopmentBackendObservabilityEmissionGate {
  shouldEmit(params: {
    eventName: DevelopmentBackendObservabilityEventName;
    dedupeKey: string | null;
    now: Date;
    minIntervalMilliseconds?: number;
  }): boolean;
}

export const developmentBackendRateLimitStorageDecision = deepFreeze({
  storageKind: "process_local_secondary_safeguard",
  globallyAuthoritative: false,
  firestoreReadsPerCheck: 0,
  firestoreWritesPerCheck: 0,
  globalHotDocumentIntroduced: false,
  cleanupJobRequired: false,
  rationale:
    "Phase 7 keeps rate limiting process-local as a secondary development-only safeguard to avoid introducing a Firestore hot document or new background cleanup requirement before private alpha."
} as const);

export const developmentBackendOperationalCostBudgets = deepFreeze({
  bootstrap_player: {
    operation: "bootstrap_player",
    deniedPath: {
      reads: 0,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    firstRequest: {
      reads: 1,
      writes: 1,
      providerCalls: 0,
      transportAttempts: 0
    },
    duplicateOrReplayRequest: {
      reads: 1,
      writes: 1,
      providerCalls: 0,
      transportAttempts: 0
    },
    conflictingRequest: {
      reads: 1,
      writes: 1,
      providerCalls: 0,
      transportAttempts: 0
    },
    timeoutMilliseconds: 0,
    automaticRetryCount: 0,
    resultSizeBound: "single owner-scoped player scaffold document"
  },
  player_snapshot: {
    operation: "player_snapshot",
    deniedPath: {
      reads: 0,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    firstRequest: {
      reads: 1,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    duplicateOrReplayRequest: {
      reads: 1,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    conflictingRequest: {
      reads: 1,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    timeoutMilliseconds: 0,
    automaticRetryCount: 0,
    resultSizeBound: "single owner-scoped player scaffold snapshot"
  },
  pin_capture: {
    operation: "pin_capture",
    deniedPath: {
      reads: 0,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    firstRequest: {
      reads: 2,
      writes: 2,
      providerCalls: 0,
      transportAttempts: 0
    },
    duplicateOrReplayRequest: {
      reads: 2,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    conflictingRequest: {
      reads: 2,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    timeoutMilliseconds: 0,
    automaticRetryCount: 0,
    resultSizeBound:
      "one deferred capture-response envelope, one reservation document, and one capture request document"
  },
  authoritative_pin_acquisition: {
    operation: "authoritative_pin_acquisition",
    deniedPath: {
      reads: 0,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    firstRequest: {
      reads: 1,
      writes: 1,
      providerCalls: 1,
      transportAttempts: 1
    },
    duplicateOrReplayRequest: {
      reads: 1,
      writes: 0,
      providerCalls: 0,
      transportAttempts: 0
    },
    conflictingRequest: {
      reads: 1,
      writes: 1,
      providerCalls: 1,
      transportAttempts: 1
    },
    timeoutMilliseconds: OVERPASS_AUTHORITATIVE_PIN_TRANSPORT_TIMEOUT_MILLISECONDS,
    automaticRetryCount: runtimeConfig.authoritativeSourceAcquisition.policy.automaticRetryCount,
    resultSizeBound: "one canonical source reference and one ordered way geometry payload"
  }
} as const satisfies Record<
  DevelopmentBackendOperationIdentifier,
  DevelopmentBackendOperationCostBudget
>);

export const developmentBackendOperationalRateLimitDefaults = deepFreeze({
  bootstrap_player: {
    operation: "bootstrap_player",
    maxRequests: 3,
    windowSeconds: 300,
    scope: "authenticated_uid",
    storageKind: "process_local_secondary_safeguard",
    globallyAuthoritative: false
  },
  player_snapshot: {
    operation: "player_snapshot",
    maxRequests: 12,
    windowSeconds: 60,
    scope: "authenticated_uid",
    storageKind: "process_local_secondary_safeguard",
    globallyAuthoritative: false
  },
  pin_capture: {
    operation: "pin_capture",
    maxRequests: 6,
    windowSeconds: 300,
    scope: "authenticated_uid",
    storageKind: "process_local_secondary_safeguard",
    globallyAuthoritative: false
  },
  authoritative_pin_acquisition: {
    operation: "authoritative_pin_acquisition",
    maxRequests: 6,
    windowSeconds: 300,
    scope: "authenticated_uid",
    storageKind: "process_local_secondary_safeguard",
    globallyAuthoritative: false
  }
} as const satisfies Record<
  DevelopmentBackendOperationIdentifier,
  DevelopmentBackendRateLimitPolicy
>);

const defaultDevelopmentBackendOperationalRateLimiter =
  createInMemoryDevelopmentBackendOperationalRateLimiter();

export function buildDevelopmentBackendOperationalSafeguardContract(params: {
  env: Readonly<Record<string, string | undefined>>;
}): Readonly<DevelopmentBackendOperationalSafeguardContract> {
  const env = params.env;

  return deepFreeze({
    safeguardsEnabled: parseStrictBooleanFlag({
      env,
      envVarName: GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED_VARIABLE_NAME
    }),
    rollbackState: parseRollbackState(
      readTrimmedEnvValue(env, GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE_VARIABLE_NAME)
    ),
    rollbackStateSourceValue: readTrimmedEnvValue(
      env,
      GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE_VARIABLE_NAME
    ),
    loggingLevel: parseLoggingLevel(
      readTrimmedEnvValue(env, GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL_VARIABLE_NAME)
    ),
    loggingLevelSourceValue: readTrimmedEnvValue(
      env,
      GROWGO_DEVELOPMENT_BACKEND_LOGGING_LEVEL_VARIABLE_NAME
    ),
    emergencyDisable: {
      global: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_BACKEND_EMERGENCY_DISABLED_VARIABLE_NAME
      }),
      authentication: parseStrictBooleanFlag({
        env,
        envVarName:
          GROWGO_DEVELOPMENT_AUTHENTICATION_EMERGENCY_DISABLED_VARIABLE_NAME
      }),
      playerSnapshot: parseStrictBooleanFlag({
        env,
        envVarName:
          GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_EMERGENCY_DISABLED_VARIABLE_NAME
      }),
      pinCapture: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_PIN_CAPTURE_EMERGENCY_DISABLED_VARIABLE_NAME
      }),
      authoritativePinAcquisition: parseStrictBooleanFlag({
        env,
        envVarName:
          GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_EMERGENCY_DISABLED_VARIABLE_NAME
      })
    },
    rateLimits: developmentBackendOperationalRateLimitDefaults,
    costBudgets: developmentBackendOperationalCostBudgets
  });
}

export function evaluateDevelopmentBackendOperationalSafeguardAccess(params: {
  env?: Readonly<Record<string, string | undefined>>;
  operation: DevelopmentBackendOperationIdentifier;
  uid: string;
  now?: Date;
  limiter?: DevelopmentBackendOperationalRateLimiter;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendOperationalSafeguardDecision> {
  const env = params.env ?? process.env;
  const capability = mapOperationToCapability(params.operation);
  const capabilityDecision = evaluateDevelopmentBackendCapabilityAccess({
    env,
    capability,
    expectedDevelopmentProjectId: params.expectedDevelopmentProjectId
  });
  const contract = buildDevelopmentBackendOperationalSafeguardContract({ env });
  const rateLimitPolicy = contract.rateLimits[params.operation];
  const costBudget = contract.costBudgets[params.operation];
  const limiter = params.limiter ?? defaultDevelopmentBackendOperationalRateLimiter;
  const now = params.now ?? new Date();

  if (!capabilityDecision.allowed) {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason: "development_access_denied",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord: null,
      costBudget
    });
  }

  if (!contract.safeguardsEnabled.enabled) {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason: "operational_safeguards_disabled",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord: null,
      costBudget
    });
  }

  if (contract.rollbackState !== "development_enabled") {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason:
        contract.rollbackState === "emergency_disabled"
          ? "emergency_disable_active"
          : "rollback_state_active",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord: null,
      costBudget
    });
  }

  if (isEmergencyDisableActive(params.operation, contract.emergencyDisable)) {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason: "emergency_disable_active",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord: null,
      costBudget
    });
  }

  const rateLimitRecord = limiter.consume({
    operation: params.operation,
    uid: params.uid,
    now,
    policy: rateLimitPolicy
  });

  if (rateLimitRecord === null) {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason: "rate_limit_state_unavailable",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord: null,
      costBudget
    });
  }

  if (!rateLimitRecord.allowed) {
    return buildDecision({
      allowed: false,
      operation: params.operation,
      capability,
      reason: "rate_limit_exceeded",
      capabilityDecision,
      rollbackState: contract.rollbackState,
      loggingLevel: contract.loggingLevel,
      rateLimitPolicy,
      rateLimitRecord,
      costBudget
    });
  }

  return buildDecision({
    allowed: true,
    operation: params.operation,
    capability,
    reason: "allowed",
    capabilityDecision,
    rollbackState: contract.rollbackState,
    loggingLevel: contract.loggingLevel,
    rateLimitPolicy,
    rateLimitRecord,
    costBudget
  });
}

export function requireDevelopmentBackendOperationalSafeguardAccess(params: {
  env?: Readonly<Record<string, string | undefined>>;
  operation: DevelopmentBackendOperationIdentifier;
  uid: string;
  now?: Date;
  limiter?: DevelopmentBackendOperationalRateLimiter;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendOperationalSafeguardDecision> {
  const decision = evaluateDevelopmentBackendOperationalSafeguardAccess(params);

  if (!decision.allowed) {
    throw new HttpsError(
      DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_ERROR_CODE,
      DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_CLIENT_MESSAGE
    );
  }

  return decision;
}

export function createInMemoryDevelopmentBackendOperationalRateLimiter():
  DevelopmentBackendOperationalRateLimiter {
  const state = new Map<
    string,
    {
      windowStartedAt: number;
      count: number;
    }
  >();

  return {
    consume(params) {
      if (!params.uid || params.uid.trim().length === 0) {
        return null;
      }

      const bucketKey = `${params.operation}:${params.uid}`;
      const nowMs = params.now.getTime();
      const windowMs = params.policy.windowSeconds * 1000;
      const existing =
        state.get(bucketKey) ??
        ({
          windowStartedAt: nowMs,
          count: 0
        } as const);

      const withinWindow = nowMs - existing.windowStartedAt < windowMs;
      const windowStartedAt = withinWindow ? existing.windowStartedAt : nowMs;
      const nextCount = withinWindow ? existing.count + 1 : 1;
      const allowed = nextCount <= params.policy.maxRequests;
      const count = allowed ? nextCount : existing.count;

      state.set(bucketKey, {
        windowStartedAt,
        count
      });

      return deepFreeze({
        allowed,
        remaining: Math.max(0, params.policy.maxRequests - count),
        resetAt: new Date(windowStartedAt + windowMs)
      });
    }
  };
}

export function buildDevelopmentBackendStructuredLogEvent(params: {
  eventName: DevelopmentBackendObservabilityEventName;
  operation: DevelopmentBackendOperationIdentifier;
  reason:
    | DevelopmentBackendOperationalSafeguardReasonCode
    | "allowed"
    | "deferred"
    | "replayed"
    | "conflict";
  loggingLevel: DevelopmentBackendLoggingLevel;
  uid?: string;
  authToken?: string;
  secret?: string;
  rawFingerprint?: string;
  latitude?: number;
  longitude?: number;
  payload?: unknown;
}): Readonly<DevelopmentBackendStructuredLogEvent> {
  void params.authToken;
  void params.secret;
  void params.rawFingerprint;
  void params.latitude;
  void params.longitude;
  void params.payload;

  const event = deepFreeze({
    schemaVersion: DEVELOPMENT_BACKEND_OPERATIONAL_LOG_EVENT_SCHEMA_VERSION,
    eventName: params.eventName,
    operation: params.operation,
    reason: params.reason,
    loggingLevel: params.loggingLevel,
    uidHash:
      params.uid && params.uid.trim().length > 0
        ? hashValue(params.uid).slice(
            0,
            DEVELOPMENT_BACKEND_OPERATIONAL_UID_HASH_PREFIX_LENGTH
          )
        : null
  } satisfies DevelopmentBackendStructuredLogEvent);

  if (
    Buffer.byteLength(JSON.stringify(event), "utf8") >
    DEVELOPMENT_BACKEND_OPERATIONAL_LOG_EVENT_MAX_BYTES
  ) {
    throw new Error(
      "Development backend operational log event exceeded the bounded payload limit."
    );
  }

  return event;
}

export function createInMemoryDevelopmentBackendObservabilityEmissionGate():
  DevelopmentBackendObservabilityEmissionGate {
  const state = new Map<string, number>();

  return {
    shouldEmit(params) {
      if (!params.dedupeKey || params.dedupeKey.trim().length === 0) {
        return true;
      }

      const minIntervalMilliseconds =
        params.minIntervalMilliseconds ?? 60_000;
      const key = `${params.eventName}:${params.dedupeKey}`;
      const nowMs = params.now.getTime();
      const previousMs = state.get(key);

      if (
        previousMs !== undefined &&
        nowMs - previousMs < minIntervalMilliseconds
      ) {
        return false;
      }

      state.set(key, nowMs);
      return true;
    }
  };
}

function buildDecision(params: {
  allowed: boolean;
  operation: DevelopmentBackendOperationIdentifier;
  capability: DevelopmentBackendCapabilityName;
  reason: DevelopmentBackendOperationalSafeguardReasonCode;
  capabilityDecision: Readonly<DevelopmentBackendCapabilityDecision>;
  rollbackState: DevelopmentBackendRollbackState;
  loggingLevel: DevelopmentBackendLoggingLevel;
  rateLimitPolicy: Readonly<DevelopmentBackendRateLimitPolicy>;
  rateLimitRecord: Readonly<DevelopmentBackendOperationalRateLimitRecord> | null;
  costBudget: Readonly<DevelopmentBackendOperationCostBudget>;
}): Readonly<DevelopmentBackendOperationalSafeguardDecision> {
  return deepFreeze({
    allowed: params.allowed,
    operation: params.operation,
    capability: params.capability,
    reason: params.reason,
    rollbackState: params.rollbackState,
    loggingLevel: params.loggingLevel,
    eventName: selectEventName(params.operation, params.reason),
    clientSafeMessage: DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_CLIENT_MESSAGE,
    callableErrorCode: DEVELOPMENT_BACKEND_OPERATIONAL_SAFEGUARD_ERROR_CODE,
    capabilityDecision: params.capabilityDecision,
    rateLimitPolicy: params.rateLimitPolicy,
    rateLimitRecord: params.rateLimitRecord,
    costBudget: params.costBudget
  });
}

function mapOperationToCapability(
  operation: DevelopmentBackendOperationIdentifier
): DevelopmentBackendCapabilityName {
  switch (operation) {
    case "bootstrap_player":
      return "authentication";
    case "player_snapshot":
      return "player_snapshot";
    case "pin_capture":
      return "pin_capture";
    case "authoritative_pin_acquisition":
      return "authoritative_pin_acquisition";
  }
}

function selectEventName(
  operation: DevelopmentBackendOperationIdentifier,
  reason: DevelopmentBackendOperationalSafeguardReasonCode
): DevelopmentBackendObservabilityEventName {
  if (reason === "emergency_disable_active") {
    return "emergency_disable_active";
  }

  if (reason === "rollback_state_active") {
    return "rollback_state_active";
  }

  if (reason === "rate_limit_exceeded") {
    return "rate_limit_denied";
  }

  if (reason !== "allowed") {
    return operation === "player_snapshot" ? "snapshot_denied" : "capability_denied";
  }

  if (operation === "player_snapshot") {
    return "snapshot_allowed";
  }

  if (operation === "authoritative_pin_acquisition") {
    return "authoritative_transport_blocked";
  }

  return "capability_denied";
}

function isEmergencyDisableActive(
  operation: DevelopmentBackendOperationIdentifier,
  flags: DevelopmentBackendEmergencyDisableFlags
): boolean {
  if (flags.global.enabled) {
    return true;
  }

  switch (operation) {
    case "bootstrap_player":
      return flags.authentication.enabled;
    case "player_snapshot":
      return flags.playerSnapshot.enabled;
    case "pin_capture":
      return flags.pinCapture.enabled;
    case "authoritative_pin_acquisition":
      return flags.authoritativePinAcquisition.enabled;
  }
}

function parseRollbackState(value: string | null): DevelopmentBackendRollbackState {
  if (
    value !== null &&
    developmentBackendRollbackStates.includes(value as DevelopmentBackendRollbackState)
  ) {
    return value as DevelopmentBackendRollbackState;
  }

  return "normal_fail_closed";
}

function parseLoggingLevel(value: string | null): DevelopmentBackendLoggingLevel {
  if (
    value !== null &&
    developmentBackendLoggingLevels.includes(value as DevelopmentBackendLoggingLevel)
  ) {
    return value as DevelopmentBackendLoggingLevel;
  }

  return "off";
}

function readTrimmedEnvValue(
  env: Readonly<Record<string, string | undefined>>,
  key: string
): string | null {
  const value = env[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hashValue(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nestedValue of Object.values(value as Record<string, unknown>)) {
      if (nestedValue && typeof nestedValue === "object") {
        deepFreeze(nestedValue);
      }
    }

    Object.freeze(value);
  }

  return value as Readonly<T>;
}
