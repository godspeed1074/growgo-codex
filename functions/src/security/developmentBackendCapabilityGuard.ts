import { HttpsError } from "firebase-functions/v2/https";

import {
  evaluateDevelopmentBackendCapabilityAccess,
  type DevelopmentBackendCapabilityDecision,
  type DevelopmentBackendCapabilityName,
  type DevelopmentBackendDecisionReasonCode
} from "../config/developmentBackendActivation";

export const DEVELOPMENT_BACKEND_CAPABILITY_GUARD_ERROR_CODE =
  "failed-precondition" as const;
export const DEVELOPMENT_BACKEND_CAPABILITY_GUARD_CLIENT_MESSAGE =
  "This development backend capability is not available in the current environment." as const;

export interface DevelopmentBackendCapabilityGuardDecision {
  allowed: boolean;
  capability: DevelopmentBackendCapabilityName;
  callableErrorCode: typeof DEVELOPMENT_BACKEND_CAPABILITY_GUARD_ERROR_CODE;
  clientSafeMessage: typeof DEVELOPMENT_BACKEND_CAPABILITY_GUARD_CLIENT_MESSAGE;
  internalReason: DevelopmentBackendDecisionReasonCode;
  evaluatorDecision: Readonly<DevelopmentBackendCapabilityDecision>;
}

export function evaluateDevelopmentBackendCapabilityGuardDecision(params: {
  capability: DevelopmentBackendCapabilityName;
  env?: Readonly<Record<string, string | undefined>>;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendCapabilityGuardDecision> {
  const evaluatorDecision = evaluateDevelopmentBackendCapabilityAccess({
    env: params.env ?? process.env,
    capability: params.capability,
    expectedDevelopmentProjectId: params.expectedDevelopmentProjectId
  });

  return deepFreeze({
    allowed: evaluatorDecision.allowed,
    capability: params.capability,
    callableErrorCode: DEVELOPMENT_BACKEND_CAPABILITY_GUARD_ERROR_CODE,
    clientSafeMessage: DEVELOPMENT_BACKEND_CAPABILITY_GUARD_CLIENT_MESSAGE,
    internalReason: evaluatorDecision.reason,
    evaluatorDecision
  });
}

export function requireDevelopmentBackendCapabilityAccess(params: {
  capability: DevelopmentBackendCapabilityName;
  env?: Readonly<Record<string, string | undefined>>;
  expectedDevelopmentProjectId?: string;
}): Readonly<DevelopmentBackendCapabilityGuardDecision> {
  const decision = evaluateDevelopmentBackendCapabilityGuardDecision(params);

  if (!decision.allowed) {
    throw new HttpsError(
      decision.callableErrorCode,
      decision.clientSafeMessage
    );
  }

  return decision;
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
