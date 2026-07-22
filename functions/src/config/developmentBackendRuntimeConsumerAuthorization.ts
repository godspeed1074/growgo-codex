import {
  developmentBackendCapabilityNames,
  type DevelopmentBackendCapabilityName
} from "./developmentBackendActivation";

export const developmentBackendRuntimeConsumerIdentifiers = [
  "bootstrapPlayerCallable",
  "getPlayerSnapshotCallable",
  "capturePinCallable",
  "authoritativePinAcquisitionService"
] as const;

export type DevelopmentBackendRuntimeConsumerIdentifier =
  (typeof developmentBackendRuntimeConsumerIdentifiers)[number];

export const developmentBackendRuntimeConsumerAuthorizationStatuses = [
  "not_applicable",
  "candidate_identified",
  "authorization_blocked",
  "ready_for_future_wiring"
] as const;

export type DevelopmentBackendRuntimeConsumerAuthorizationStatus =
  (typeof developmentBackendRuntimeConsumerAuthorizationStatuses)[number];

export const developmentBackendRuntimeConsumerAuthorizationReasonCodes = [
  "unknown_capability",
  "unknown_consumer",
  "consumer_capability_mismatch",
  "phase2_contract_incomplete",
  "evaluator_unavailable",
  "environment_scope_not_fail_closed",
  "auth_guard_missing",
  "idempotency_reservation_incomplete",
  "idempotency_emulator_coverage_incomplete",
  "future_implementation_authorization_missing",
  "ready_for_future_wiring"
] as const;

export type DevelopmentBackendRuntimeConsumerAuthorizationReasonCode =
  (typeof developmentBackendRuntimeConsumerAuthorizationReasonCodes)[number];

export interface DevelopmentBackendRuntimeConsumerAuthorizationPrerequisites {
  phase2ContractComplete: boolean;
  evaluatorAvailable: boolean;
  developmentEnvironmentIdentityContractAvailable: boolean;
  betaDenied: boolean;
  productionDenied: boolean;
  authGuardPresent: boolean;
  idempotencyReservationImplemented: boolean;
  idempotencyEmulatorCoverageComplete: boolean;
  futureImplementationAuthorizationRecorded: boolean;
}

export interface DevelopmentBackendRuntimeConsumerDefinition {
  capability: DevelopmentBackendCapabilityName;
  consumer: DevelopmentBackendRuntimeConsumerIdentifier;
  existingServerEntryPoint: string;
  authRequirement: string;
  currentRuntimeBehavior: string;
  proposedFutureEvaluatorCheckLocation: string;
  proposedFutureCheckOrder: readonly string[];
  proposedDeniedClientCode:
    | "unauthenticated"
    | "failed-precondition"
    | "permission-denied"
    | "unavailable";
  clientSafeDeniedMessage: string;
  candidatePhase: "phase-4-or-later";
  additionalPrerequisites: readonly string[];
}

export interface DevelopmentBackendRuntimeConsumerAuthorizationReport {
  status: DevelopmentBackendRuntimeConsumerAuthorizationStatus;
  reason: DevelopmentBackendRuntimeConsumerAuthorizationReasonCode;
  capability: DevelopmentBackendCapabilityName | string;
  consumer: DevelopmentBackendRuntimeConsumerIdentifier | string;
  capabilityContractExists: boolean;
  candidateRuntimeConsumerIdentified: boolean;
  evaluatorAvailable: boolean;
  evaluatorWiringPresent: false;
  runtimeActivationAuthorized: false;
  futureImplementationAuthorizationRecorded: boolean;
  betaEligible: false;
  productionEligible: false;
  mayBeWiredInPhase4OrLater: boolean;
  existingServerEntryPoint: string | null;
  authRequirement: string | null;
  currentRuntimeBehavior: string | null;
  proposedFutureEvaluatorCheckLocation: string | null;
  proposedFutureCheckOrder: readonly string[];
  proposedDeniedClientCode:
    | "unauthenticated"
    | "failed-precondition"
    | "permission-denied"
    | "unavailable"
    | null;
  clientSafeDeniedMessage: string | null;
  additionalPrerequisites: readonly string[];
  blockedPrerequisites: readonly string[];
}

const CALLABLE_EVALUATION_ORDER = [
  "callable-invocation-received",
  "firebase-authentication-validated",
  "development-environment-identity-validated",
  "global-development-backend-flag-evaluated",
  "capability-specific-flag-evaluated",
  "capability-specific-input-validation-performed",
  "existing-domain-logic-invoked",
  "existing-fail-closed-result-returned"
] as const;

const SERVICE_EVALUATION_ORDER = [
  "guarded-server-side-caller-invoked",
  "upstream-firebase-authentication-already-validated",
  "development-environment-identity-validated",
  "global-development-backend-flag-evaluated",
  "capability-specific-flag-evaluated",
  "existing-canonical-input-validation-performed",
  "authoritative-source-domain-logic-invoked",
  "existing-fail-closed-result-returned"
] as const;

const developmentBackendRuntimeConsumerDefinitions = [
  {
    capability: "authentication",
    consumer: "bootstrapPlayerCallable",
    existingServerEntryPoint: "functions/src/api/bootstrapPlayer.ts::bootstrapPlayer",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "authenticated player bootstrap transaction scaffold with requestId validation and server-authoritative field rejection evidence",
    proposedFutureEvaluatorCheckLocation:
      "bootstrapPlayer callable boundary immediately after requireAuthenticated(request) and before request payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: []
  },
  {
    capability: "authentication",
    consumer: "getPlayerSnapshotCallable",
    existingServerEntryPoint:
      "functions/src/api/getPlayerSnapshot.ts::getPlayerSnapshot",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "authenticated owner-only player snapshot read with safe scaffold serialization",
    proposedFutureEvaluatorCheckLocation:
      "getPlayerSnapshot callable boundary immediately after requireAuthenticated(request) and before request payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: []
  },
  {
    capability: "authentication",
    consumer: "capturePinCallable",
    existingServerEntryPoint: "functions/src/api/capturePin.ts::capturePin",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "authenticated deferred capture request recording with canonical pin verification inputs and no reward grant",
    proposedFutureEvaluatorCheckLocation:
      "capturePin callable boundary immediately after requireAuthenticated(request) and before capture payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: [
      "persistent-idempotency-reservation",
      "emulator-verified-idempotency-coverage"
    ]
  },
  {
    capability: "player_snapshot",
    consumer: "bootstrapPlayerCallable",
    existingServerEntryPoint: "functions/src/api/bootstrapPlayer.ts::bootstrapPlayer",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "owner-scoped bootstrap creates or refreshes the baseline player document that getPlayerSnapshot later returns",
    proposedFutureEvaluatorCheckLocation:
      "bootstrapPlayer callable boundary immediately after requireAuthenticated(request) and before request payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: []
  },
  {
    capability: "player_snapshot",
    consumer: "getPlayerSnapshotCallable",
    existingServerEntryPoint:
      "functions/src/api/getPlayerSnapshot.ts::getPlayerSnapshot",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "owner-scoped snapshot read remains scaffold-safe and minimal",
    proposedFutureEvaluatorCheckLocation:
      "getPlayerSnapshot callable boundary immediately after requireAuthenticated(request) and before request payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: []
  },
  {
    capability: "pin_capture",
    consumer: "capturePinCallable",
    existingServerEntryPoint: "functions/src/api/capturePin.ts::capturePin",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "capture remains deferred-only, replay-protected, non-rewarding, and blocked from acceptance",
    proposedFutureEvaluatorCheckLocation:
      "capturePin callable boundary immediately after requireAuthenticated(request) and before capture payload validation",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: [
      "persistent-idempotency-reservation",
      "emulator-verified-idempotency-coverage"
    ]
  },
  {
    capability: "authoritative_pin_acquisition",
    consumer: "capturePinCallable",
    existingServerEntryPoint: "functions/src/api/capturePin.ts::capturePin",
    authRequirement: "requireAuthenticated(request)",
    currentRuntimeBehavior:
      "capturePin invokes canonical pin verification inputs, but authoritative source acquisition remains runtime-disabled by fail-closed gates",
    proposedFutureEvaluatorCheckLocation:
      "capturePin callable boundary first, with the acquisition service remaining secondarily fail-closed beneath it",
    proposedFutureCheckOrder: CALLABLE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: [
      "persistent-idempotency-reservation",
      "emulator-verified-idempotency-coverage"
    ]
  },
  {
    capability: "authoritative_pin_acquisition",
    consumer: "authoritativePinAcquisitionService",
    existingServerEntryPoint:
      "functions/src/domain/pins/authoritativePinAcquisition.ts::acquireAuthoritativePinSource",
    authRequirement: "upstream-callable-authentication-required",
    currentRuntimeBehavior:
      "service remains fail-closed, transport-disabled, single-request bounded, zero-retry, cache-aware, and production-denying",
    proposedFutureEvaluatorCheckLocation:
      "authoritative acquisition service boundary only as a secondary fail-closed layer under a guarded public callable boundary",
    proposedFutureCheckOrder: SERVICE_EVALUATION_ORDER,
    proposedDeniedClientCode: "failed-precondition",
    clientSafeDeniedMessage:
      "This development backend capability is not available in the current environment.",
    candidatePhase: "phase-4-or-later",
    additionalPrerequisites: [
      "guarded-upstream-callable-boundary",
      "persistent-idempotency-reservation",
      "emulator-verified-idempotency-coverage"
    ]
  }
] as const satisfies readonly DevelopmentBackendRuntimeConsumerDefinition[];

export function evaluateDevelopmentBackendRuntimeConsumerAuthorization(params: {
  capability: string;
  consumer: string;
  prerequisites?: Partial<DevelopmentBackendRuntimeConsumerAuthorizationPrerequisites>;
}): Readonly<DevelopmentBackendRuntimeConsumerAuthorizationReport> {
  const capabilityExists = developmentBackendCapabilityNames.includes(
    params.capability as DevelopmentBackendCapabilityName
  );
  const consumerExists = developmentBackendRuntimeConsumerIdentifiers.includes(
    params.consumer as DevelopmentBackendRuntimeConsumerIdentifier
  );

  const definition = developmentBackendRuntimeConsumerDefinitions.find(
    (candidate) =>
      candidate.capability === params.capability &&
      candidate.consumer === params.consumer
  );

  const prerequisites = normalizePrerequisites(params.prerequisites);
  const blockedPrerequisites = collectBlockedPrerequisites(definition, prerequisites);

  let status: DevelopmentBackendRuntimeConsumerAuthorizationStatus;
  let reason: DevelopmentBackendRuntimeConsumerAuthorizationReasonCode;

  if (!capabilityExists) {
    status = "not_applicable";
    reason = "unknown_capability";
  } else if (!consumerExists) {
    status = "not_applicable";
    reason = "unknown_consumer";
  } else if (!definition) {
    status = "not_applicable";
    reason = "consumer_capability_mismatch";
  } else if (blockedPrerequisites.length > 0) {
    status = "authorization_blocked";
    reason = blockedPrerequisites[0] as DevelopmentBackendRuntimeConsumerAuthorizationReasonCode;
  } else if (!prerequisites.futureImplementationAuthorizationRecorded) {
    status = "candidate_identified";
    reason = "future_implementation_authorization_missing";
  } else {
    status = "ready_for_future_wiring";
    reason = "ready_for_future_wiring";
  }

  return deepFreeze({
    status,
    reason,
    capability: params.capability,
    consumer: params.consumer,
    capabilityContractExists: capabilityExists,
    candidateRuntimeConsumerIdentified: Boolean(definition),
    evaluatorAvailable: prerequisites.evaluatorAvailable,
    evaluatorWiringPresent: false,
    runtimeActivationAuthorized: false,
    futureImplementationAuthorizationRecorded:
      prerequisites.futureImplementationAuthorizationRecorded,
    betaEligible: false,
    productionEligible: false,
    mayBeWiredInPhase4OrLater: status === "ready_for_future_wiring",
    existingServerEntryPoint: definition?.existingServerEntryPoint ?? null,
    authRequirement: definition?.authRequirement ?? null,
    currentRuntimeBehavior: definition?.currentRuntimeBehavior ?? null,
    proposedFutureEvaluatorCheckLocation:
      definition?.proposedFutureEvaluatorCheckLocation ?? null,
    proposedFutureCheckOrder: definition?.proposedFutureCheckOrder ?? [],
    proposedDeniedClientCode: definition?.proposedDeniedClientCode ?? null,
    clientSafeDeniedMessage: definition?.clientSafeDeniedMessage ?? null,
    additionalPrerequisites: definition?.additionalPrerequisites ?? [],
    blockedPrerequisites
  });
}

export function listDevelopmentBackendRuntimeConsumerDefinitions(): readonly Readonly<DevelopmentBackendRuntimeConsumerDefinition>[] {
  return developmentBackendRuntimeConsumerDefinitions.map((definition) =>
    deepFreeze({ ...definition })
  );
}

function normalizePrerequisites(
  prerequisites: Partial<DevelopmentBackendRuntimeConsumerAuthorizationPrerequisites> | undefined
): DevelopmentBackendRuntimeConsumerAuthorizationPrerequisites {
  return deepFreeze({
    phase2ContractComplete: prerequisites?.phase2ContractComplete === true,
    evaluatorAvailable: prerequisites?.evaluatorAvailable === true,
    developmentEnvironmentIdentityContractAvailable:
      prerequisites?.developmentEnvironmentIdentityContractAvailable === true,
    betaDenied: prerequisites?.betaDenied === true,
    productionDenied: prerequisites?.productionDenied === true,
    authGuardPresent: prerequisites?.authGuardPresent === true,
    idempotencyReservationImplemented:
      prerequisites?.idempotencyReservationImplemented === true,
    idempotencyEmulatorCoverageComplete:
      prerequisites?.idempotencyEmulatorCoverageComplete === true,
    futureImplementationAuthorizationRecorded:
      prerequisites?.futureImplementationAuthorizationRecorded === true
  });
}

function collectBlockedPrerequisites(
  definition: DevelopmentBackendRuntimeConsumerDefinition | undefined,
  prerequisites: DevelopmentBackendRuntimeConsumerAuthorizationPrerequisites
): readonly string[] {
  const blockers = [
    !prerequisites.phase2ContractComplete && "phase2_contract_incomplete",
    !prerequisites.evaluatorAvailable && "evaluator_unavailable",
    (!prerequisites.developmentEnvironmentIdentityContractAvailable ||
      !prerequisites.betaDenied ||
      !prerequisites.productionDenied) &&
      "environment_scope_not_fail_closed",
    requiresAuthGuard(definition) &&
      !prerequisites.authGuardPresent &&
      "auth_guard_missing",
    requiresIdempotencyReservation(definition) &&
      !prerequisites.idempotencyReservationImplemented &&
      "idempotency_reservation_incomplete",
    requiresIdempotencyReservation(definition) &&
      prerequisites.idempotencyReservationImplemented &&
      !prerequisites.idempotencyEmulatorCoverageComplete &&
      "idempotency_emulator_coverage_incomplete"
  ].filter((value): value is string => Boolean(value));

  return deepFreeze(blockers);
}

function requiresAuthGuard(
  definition: DevelopmentBackendRuntimeConsumerDefinition | undefined
): boolean {
  return definition?.authRequirement === "requireAuthenticated(request)";
}

function requiresIdempotencyReservation(
  definition: DevelopmentBackendRuntimeConsumerDefinition | undefined
): boolean {
  return (
    definition?.additionalPrerequisites.includes(
      "persistent-idempotency-reservation"
    ) ?? false
  );
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
