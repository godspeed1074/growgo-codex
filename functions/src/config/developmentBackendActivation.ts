import { runtimeConfig } from "./runtimeConfig";
import {
  parseSafeFirestoreEmulatorHost,
  type SafeFirestoreEmulatorHost
} from "../infrastructure/pins/firestoreEmulatorHost";

export const GROWGO_BACKEND_ENVIRONMENT_VARIABLE_NAME =
  "GROWGO_BACKEND_ENVIRONMENT" as const;
export const GROWGO_BACKEND_PROJECT_ID_VARIABLE_NAME =
  "GROWGO_BACKEND_PROJECT_ID" as const;
export const GROWGO_DEVELOPMENT_BACKEND_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_BACKEND_ENABLED" as const;
export const GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED" as const;
export const GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED" as const;
export const GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED" as const;
export const GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED" as const;

export const developmentBackendEnvironmentNames = [
  "development",
  "beta",
  "production"
] as const;

export type DevelopmentBackendEnvironmentName =
  (typeof developmentBackendEnvironmentNames)[number];

export const developmentBackendCapabilityNames = [
  "authentication",
  "authoritative_pin_acquisition",
  "pin_capture",
  "player_snapshot"
] as const;

export type DevelopmentBackendCapabilityName =
  (typeof developmentBackendCapabilityNames)[number];

export const developmentBackendDecisionReasonCodes = [
  "environment_missing",
  "environment_unknown",
  "project_missing",
  "project_mismatch",
  "emulator_host_invalid",
  "environment_not_development",
  "backend_flag_disabled",
  "capability_flag_disabled",
  "allowed"
] as const;

export type DevelopmentBackendDecisionReasonCode =
  (typeof developmentBackendDecisionReasonCodes)[number];

export interface ParsedStrictBooleanFlag {
  envVarName: string;
  sourceValue: string | null;
  enabled: boolean;
  parseState: "enabled" | "disabled" | "missing" | "invalid";
}

export interface DevelopmentBackendEnvironmentContract {
  declaredEnvironmentName: string | null;
  environmentName: DevelopmentBackendEnvironmentName | null;
  expectedProjectId: string;
  declaredProjectId: string | null;
  emulatorMode: boolean;
  emulatorHost: SafeFirestoreEmulatorHost | null;
  environmentValid: boolean;
  projectIdentityValid: boolean;
  emulatorIdentityValid: boolean;
  runtimeActivationPermitted: boolean;
}

export interface DevelopmentBackendFeatureFlags {
  developmentBackendEnabled: ParsedStrictBooleanFlag;
  developmentAuthenticationEnabled: ParsedStrictBooleanFlag;
  developmentAuthoritativePinAcquisitionEnabled: ParsedStrictBooleanFlag;
  developmentPinCaptureEnabled: ParsedStrictBooleanFlag;
  developmentPlayerSnapshotEnabled: ParsedStrictBooleanFlag;
}

export interface DevelopmentBackendActivationContract {
  environment: DevelopmentBackendEnvironmentContract;
  flags: DevelopmentBackendFeatureFlags;
}

export interface DevelopmentBackendCapabilityDecision {
  allowed: boolean;
  capability: DevelopmentBackendCapabilityName;
  reason: DevelopmentBackendDecisionReasonCode;
  environment: DevelopmentBackendEnvironmentContract;
  flags: {
    developmentBackendEnabled: boolean;
    capabilityEnabled: boolean;
  };
}

export function buildDevelopmentBackendActivationContract(params: {
  env: Readonly<Record<string, string | undefined>>;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendActivationContract> {
  const env = params.env;
  const expectedProjectId =
    params.expectedDevelopmentProjectId ?? runtimeConfig.projectId;
  const declaredEnvironmentName = readTrimmedEnvValue(
    env,
    GROWGO_BACKEND_ENVIRONMENT_VARIABLE_NAME
  );
  const environmentName =
    parseDevelopmentBackendEnvironmentName(declaredEnvironmentName);
  const declaredProjectId = readTrimmedEnvValue(
    env,
    GROWGO_BACKEND_PROJECT_ID_VARIABLE_NAME
  );
  const rawEmulatorHost = readTrimmedEnvValue(env, "FIRESTORE_EMULATOR_HOST");
  const emulatorHost =
    rawEmulatorHost === null
      ? null
      : parseSafeFirestoreEmulatorHost(rawEmulatorHost);
  const emulatorMode = rawEmulatorHost !== null;

  const environmentValid = environmentName !== null;
  const projectIdentityValid =
    declaredProjectId !== null && declaredProjectId === expectedProjectId;
  const emulatorIdentityValid =
    !emulatorMode ||
    (environmentName === "development" && emulatorHost !== null);

  return deepFreeze({
    environment: {
      declaredEnvironmentName,
      environmentName,
      expectedProjectId,
      declaredProjectId,
      emulatorMode,
      emulatorHost,
      environmentValid,
      projectIdentityValid,
      emulatorIdentityValid,
      runtimeActivationPermitted:
        environmentName === "development" &&
        projectIdentityValid &&
        emulatorIdentityValid
    },
    flags: {
      developmentBackendEnabled: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_BACKEND_ENABLED_VARIABLE_NAME
      }),
      developmentAuthenticationEnabled: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_AUTHENTICATION_ENABLED_VARIABLE_NAME
      }),
      developmentAuthoritativePinAcquisitionEnabled: parseStrictBooleanFlag({
        env,
        envVarName:
          GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED_VARIABLE_NAME
      }),
      developmentPinCaptureEnabled: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_PIN_CAPTURE_ENABLED_VARIABLE_NAME
      }),
      developmentPlayerSnapshotEnabled: parseStrictBooleanFlag({
        env,
        envVarName: GROWGO_DEVELOPMENT_PLAYER_SNAPSHOT_ENABLED_VARIABLE_NAME
      })
    }
  });
}

export function evaluateDevelopmentBackendCapabilityAccess(params: {
  env: Readonly<Record<string, string | undefined>>;
  capability: DevelopmentBackendCapabilityName;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendCapabilityDecision> {
  const contract = buildDevelopmentBackendActivationContract({
    env: params.env,
    expectedDevelopmentProjectId: params.expectedDevelopmentProjectId
  });
  const reason = resolveDecisionReason(contract, params.capability);
  const capabilityFlag = selectCapabilityFlag(contract.flags, params.capability);

  return deepFreeze({
    allowed: reason === "allowed",
    capability: params.capability,
    reason,
    environment: contract.environment,
    flags: {
      developmentBackendEnabled:
        contract.flags.developmentBackendEnabled.enabled,
      capabilityEnabled: capabilityFlag.enabled
    }
  });
}

export function parseDevelopmentBackendEnvironmentName(
  value: string | null
): DevelopmentBackendEnvironmentName | null {
  if (value == null) {
    return null;
  }

  return developmentBackendEnvironmentNames.includes(
    value as DevelopmentBackendEnvironmentName
  )
    ? (value as DevelopmentBackendEnvironmentName)
    : null;
}

export function parseStrictBooleanFlag(params: {
  env: Readonly<Record<string, string | undefined>>;
  envVarName: string;
}): ParsedStrictBooleanFlag {
  const sourceValue = readTrimmedEnvValue(params.env, params.envVarName);

  if (sourceValue === null) {
    return deepFreeze({
      envVarName: params.envVarName,
      sourceValue: null,
      enabled: false,
      parseState: "missing"
    });
  }

  if (sourceValue === "true") {
    return deepFreeze({
      envVarName: params.envVarName,
      sourceValue,
      enabled: true,
      parseState: "enabled"
    });
  }

  if (sourceValue === "false") {
    return deepFreeze({
      envVarName: params.envVarName,
      sourceValue,
      enabled: false,
      parseState: "disabled"
    });
  }

  return deepFreeze({
    envVarName: params.envVarName,
    sourceValue,
    enabled: false,
    parseState: "invalid"
  });
}

function resolveDecisionReason(
  contract: DevelopmentBackendActivationContract,
  capability: DevelopmentBackendCapabilityName
): DevelopmentBackendDecisionReasonCode {
  if (contract.environment.declaredEnvironmentName === null) {
    return "environment_missing";
  }

  if (!contract.environment.environmentValid) {
    return "environment_unknown";
  }

  if (contract.environment.declaredProjectId === null) {
    return "project_missing";
  }

  if (!contract.environment.projectIdentityValid) {
    return "project_mismatch";
  }

  if (!contract.environment.emulatorIdentityValid) {
    return "emulator_host_invalid";
  }

  if (
    contract.environment.environmentName !== "development" ||
    !contract.environment.runtimeActivationPermitted
  ) {
    return "environment_not_development";
  }

  if (!contract.flags.developmentBackendEnabled.enabled) {
    return "backend_flag_disabled";
  }

  if (!selectCapabilityFlag(contract.flags, capability).enabled) {
    return "capability_flag_disabled";
  }

  return "allowed";
}

function selectCapabilityFlag(
  flags: DevelopmentBackendFeatureFlags,
  capability: DevelopmentBackendCapabilityName
): ParsedStrictBooleanFlag {
  switch (capability) {
    case "authentication":
      return flags.developmentAuthenticationEnabled;
    case "authoritative_pin_acquisition":
      return flags.developmentAuthoritativePinAcquisitionEnabled;
    case "pin_capture":
      return flags.developmentPinCaptureEnabled;
    case "player_snapshot":
      return flags.developmentPlayerSnapshotEnabled;
  }
}

function readTrimmedEnvValue(
  env: Readonly<Record<string, string | undefined>>,
  key: string
): string | null {
  const value = env[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
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
