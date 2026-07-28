import { createHash } from "node:crypto";

import {
  createAssetFactoryRegistryLayer,
  validateAssetFactoryRegistryLayer
} from "./asset-registry.mjs";
import {
  createAssetAuditTrailLayer,
  validateAssetAuditTrailLayer
} from "./asset-audit-trail.mjs";
import {
  createAssetGovernanceDashboardLayer,
  validateAssetGovernanceDashboardLayer
} from "./asset-governance-dashboard.mjs";

export const assetAutomationRuleLayerSchemaId = "ASSET_AUTOMATION_RULE_LAYER_001";
export const assetAutomationActionRecordSchemaId = "ASSET_AUTOMATION_ACTION_RECORD_001";
export const assetAutomationValidationSchemaId = "ASSET_AUTOMATION_VALIDATION_001";

export const assetAutomationTriggerEvents = deepFreeze([
  "ASSET_CREATED",
  "ASSET_VALIDATION_FAILED",
  "ASSET_APPROVED",
  "ASSET_PUBLISHED",
  "ASSET_VERSION_CREATED",
  "ASSET_IMPACT_HIGH"
]);

export const assetAutomationTypes = deepFreeze([
  "CREATE_REVIEW_TASK",
  "UPDATE_DISCOVERY_INDEX",
  "GENERATE_IMPACT_REPORT",
  "REQUEST_VARIANT_REVIEW",
  "GENERATE_RELEASE_NOTE"
]);

const executionStatuses = deepFreeze([
  "SUGGESTED",
  "PENDING_APPROVAL",
  "READY_FOR_REVIEW",
  "NOT_EXECUTED"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";

const automationRuleCatalog = deepFreeze([
  ruleDefinition({
    ruleId: "RULE_ASSET_CREATED_REVIEW_001",
    triggerEvent: "ASSET_CREATED",
    actionType: "CREATE_REVIEW_TASK",
    suggestedAction: "Create a review task for the newly registered asset so specification and quality steps can be tracked.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "PENDING_APPROVAL"
  }),
  ruleDefinition({
    ruleId: "RULE_VALIDATION_FAILURE_REVIEW_001",
    triggerEvent: "ASSET_VALIDATION_FAILED",
    actionType: "CREATE_REVIEW_TASK",
    suggestedAction: "Create a focused remediation review task for the validation failure before any promotion continues.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "PENDING_APPROVAL"
  }),
  ruleDefinition({
    ruleId: "RULE_VALIDATION_FAILURE_VARIANT_001",
    triggerEvent: "ASSET_VALIDATION_FAILED",
    actionType: "REQUEST_VARIANT_REVIEW",
    suggestedAction: "Request a variant review when the failure may be caused by context-specific compatibility or presentation expectations.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "PENDING_APPROVAL"
  }),
  ruleDefinition({
    ruleId: "RULE_ASSET_APPROVED_DISCOVERY_001",
    triggerEvent: "ASSET_APPROVED",
    actionType: "UPDATE_DISCOVERY_INDEX",
    suggestedAction: "Queue a discovery index refresh so the approved asset is visible to search and recommendation systems.",
    approvalRequirement: "AUTHORIZATION_REQUIRED",
    executionStatus: "PENDING_APPROVAL"
  }),
  ruleDefinition({
    ruleId: "RULE_ASSET_PUBLISHED_RELEASE_NOTE_001",
    triggerEvent: "ASSET_PUBLISHED",
    actionType: "GENERATE_RELEASE_NOTE",
    suggestedAction: "Generate a release-note draft from the publish event and linked lifecycle records.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "READY_FOR_REVIEW"
  }),
  ruleDefinition({
    ruleId: "RULE_ASSET_PUBLISHED_DISCOVERY_001",
    triggerEvent: "ASSET_PUBLISHED",
    actionType: "UPDATE_DISCOVERY_INDEX",
    suggestedAction: "Queue a discovery index refresh so published assets appear with current lifecycle status.",
    approvalRequirement: "AUTHORIZATION_REQUIRED",
    executionStatus: "PENDING_APPROVAL"
  }),
  ruleDefinition({
    ruleId: "RULE_ASSET_VERSION_CREATED_IMPACT_001",
    triggerEvent: "ASSET_VERSION_CREATED",
    actionType: "GENERATE_IMPACT_REPORT",
    suggestedAction: "Generate an impact report for the new version so downstream recipes, variants, and environments are reviewed.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "READY_FOR_REVIEW"
  }),
  ruleDefinition({
    ruleId: "RULE_ASSET_IMPACT_HIGH_REPORT_001",
    triggerEvent: "ASSET_IMPACT_HIGH",
    actionType: "GENERATE_IMPACT_REPORT",
    suggestedAction: "Generate a high-impact report and hold related promotions until the dependency consequences are reviewed.",
    approvalRequirement: "REVIEW_REQUIRED",
    executionStatus: "READY_FOR_REVIEW"
  })
]);

export function createAssetAutomationRuleLayer(
  rawOptions = {},
  rawRegistry = createAssetFactoryRegistryLayer(),
  rawAuditLayer = createAssetAuditTrailLayer(rawRegistry),
  rawGovernanceLayer = createAssetGovernanceDashboardLayer()
) {
  const options = normalizeOptions(rawOptions);
  const registry = normalizeRegistry(rawRegistry);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);
  const governanceLayer = normalizeGovernanceLayer(rawGovernanceLayer);
  const sourceContext = buildSourceContext(registry, auditLayer, governanceLayer, options);
  const validation = buildAutomationValidation(sourceContext);

  const layer = deepFreeze({
    schemaId: assetAutomationRuleLayerSchemaId,
    layerId: "ASSET_AUTOMATION_RULE_LAYER_001_DEFAULT",
    registryId: registry.registryId,
    auditLayerId: auditLayer.layerId,
    governanceLayerId: governanceLayer.layerId,
    rules: sourceContext.rules,
    validation,
    evaluateEvent(rawEvent = {}) {
      return evaluateAutomationEvent(rawEvent, sourceContext);
    }
  });

  const checked = validateAssetAutomationRuleLayer(layer);
  if (!checked.ok) {
    throw createAutomationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetAutomationRuleLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetAutomationRuleLayerSchemaId) {
      throw createAutomationError(
        "invalid_asset_automation_rule_layer_schema",
        `Expected ${assetAutomationRuleLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (!Array.isArray(rawLayer.rules) || rawLayer.rules.length === 0) {
      throw createAutomationError(
        "invalid_asset_automation_rules",
        "Asset automation rule layer must expose a non-empty rules array."
      );
    }

    if (typeof rawLayer.evaluateEvent !== "function") {
      throw createAutomationError(
        "invalid_asset_automation_rule_api",
        "Asset automation rule layer must expose evaluateEvent."
      );
    }

    if (rawLayer.validation?.schemaId !== assetAutomationValidationSchemaId) {
      throw createAutomationError(
        "invalid_asset_automation_validation_schema",
        `Expected ${assetAutomationValidationSchemaId} but received ${rawLayer.validation?.schemaId}.`
      );
    }

    for (const key of [
      "ruleValid",
      "triggerValid",
      "actionValid",
      "approvalRequirementsPreserved",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawLayer.validation[key] !== true) {
        throw createAutomationError(
          "asset_automation_rule_layer_validation_failed",
          `Asset automation validation flag ${key} must be true.`
        );
      }
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAutomationRuleLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_automation_rule_layer_validation_failed",
      message: error.message,
      assetAutomationRuleLayer: null
    });
  }
}

export function validateAssetAutomationActionRecord(rawRecord, rawRegistry = createAssetFactoryRegistryLayer()) {
  try {
    const registry = normalizeRegistry(rawRegistry);

    if (rawRecord?.schemaId !== assetAutomationActionRecordSchemaId) {
      throw createAutomationError(
        "invalid_asset_automation_action_record_schema",
        `Expected ${assetAutomationActionRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetAutomationValidationSchemaId) {
      throw createAutomationError(
        "invalid_asset_automation_action_validation_schema",
        `Expected ${assetAutomationValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    if (!assetAutomationTriggerEvents.includes(rawRecord.triggerEvent)) {
      throw createAutomationError(
        "invalid_asset_automation_trigger_event",
        `Unsupported automation trigger event ${rawRecord.triggerEvent}.`
      );
    }

    if (!assetAutomationTypes.includes(rawRecord.matchedRule.actionType)) {
      throw createAutomationError(
        "invalid_asset_automation_action_type",
        `Unsupported automation action type ${rawRecord.matchedRule.actionType}.`
      );
    }

    if (!executionStatuses.includes(rawRecord.executionStatus)) {
      throw createAutomationError(
        "invalid_asset_automation_execution_status",
        `Unsupported automation execution status ${rawRecord.executionStatus}.`
      );
    }

    if (!registry.getAssetById(rawRecord.assetId)) {
      throw createAutomationError(
        "invalid_asset_automation_asset_reference",
        `Automation action asset ${rawRecord.assetId} is not registered.`
      );
    }

    for (const key of [
      "ruleValid",
      "triggerValid",
      "actionValid",
      "approvalRequirementsPreserved",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createAutomationError(
          "asset_automation_action_validation_failed",
          `Asset automation validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildActionRecordSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicAutomationHash) {
      throw createAutomationError(
        "asset_automation_hash_mismatch",
        "Asset automation action record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetAutomationActionRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_automation_action_validation_failed",
      message: error.message,
      assetAutomationActionRecord: null
    });
  }
}

function buildSourceContext(registry, auditLayer, governanceLayer, options) {
  const rules = options.rules ?? automationRuleCatalog;
  const assetIds = new Set(registry.records.map((record) => record.assetId));

  return deepFreeze({
    registry,
    auditLayer,
    governanceLayer,
    rules: deepFreeze([...rules].sort((left, right) => left.ruleId.localeCompare(right.ruleId))),
    assetIds
  });
}

function evaluateAutomationEvent(rawEvent, sourceContext) {
  const event = normalizeEvent(rawEvent, sourceContext.registry);
  const matchingRules = sourceContext.rules.filter((rule) => rule.triggerEvent === event.eventType);

  return deepFreeze(
    matchingRules
      .map((rule) => createAutomationActionRecord(rule, event, sourceContext))
      .sort(compareActionRecords)
  );
}

function createAutomationActionRecord(rule, event, sourceContext) {
  const governanceHealth = sourceContext.governanceLayer.report.healthState;
  const executionStatus = deriveExecutionStatus(rule, event, governanceHealth);

  const validation = buildActionValidation(
    rule,
    event,
    executionStatus,
    governanceHealth,
    sourceContext.assetIds
  );
  const record = deepFreeze({
    schemaId: assetAutomationActionRecordSchemaId,
    actionRecordId: [
      "ASSET_AUTOMATION_ACTION",
      normalizeSlug(event.eventType),
      normalizeSlug(rule.ruleId),
      normalizeSlug(event.assetId)
    ].join("_"),
    assetId: event.assetId,
    triggerEvent: event.eventType,
    matchedRule: deepFreeze({
      ruleId: rule.ruleId,
      actionType: rule.actionType,
      suggestedAction: rule.suggestedAction
    }),
    approvalRequirement: rule.approvalRequirement,
    executionStatus,
    contextSummary: deepFreeze({
      eventSeverity: event.severity,
      governanceHealth,
      sourceRecordId: event.sourceRecordId,
      requestedBy: event.actorSource
    }),
    validation
  });

  const checked = validateAssetAutomationActionRecord(record, sourceContext.registry);
  if (!checked.ok) {
    throw createAutomationError(checked.errorCode, checked.message);
  }

  return record;
}

function deriveExecutionStatus(rule, event, governanceHealth) {
  if (rule.approvalRequirement === "AUTHORIZATION_REQUIRED") {
    return "PENDING_APPROVAL";
  }

  if (event.eventType === "ASSET_IMPACT_HIGH" || governanceHealth === "HIGH_RISK") {
    return "READY_FOR_REVIEW";
  }

  if (event.eventType === "ASSET_PUBLISHED" && rule.actionType === "GENERATE_RELEASE_NOTE") {
    return "READY_FOR_REVIEW";
  }

  return rule.executionStatus;
}

function buildAutomationValidation(sourceContext) {
  const probeA = evaluateAutomationEvent(
    {
      eventType: "ASSET_PUBLISHED",
      assetId: defaultAssetId,
      sourceRecordId: "PUBLISH_RECORD_001",
      severity: "MEDIUM",
      actorSource: "asset_factory_system"
    },
    sourceContext
  );
  const probeB = evaluateAutomationEvent(
    {
      eventType: "ASSET_PUBLISHED",
      assetId: defaultAssetId,
      sourceRecordId: "PUBLISH_RECORD_001",
      severity: "MEDIUM",
      actorSource: "asset_factory_system"
    },
    sourceContext
  );

  const ruleValid = sourceContext.rules.every(
    (rule) =>
      typeof rule.ruleId === "string" &&
      assetAutomationTriggerEvents.includes(rule.triggerEvent) &&
      assetAutomationTypes.includes(rule.actionType)
  );
  const triggerValid = sourceContext.rules.every((rule) =>
    assetAutomationTriggerEvents.includes(rule.triggerEvent)
  );
  const actionValid = probeA.every((record) =>
    assetAutomationTypes.includes(record.matchedRule.actionType)
  );
  const approvalRequirementsPreserved = probeA.every((record) =>
    ["REVIEW_REQUIRED", "AUTHORIZATION_REQUIRED"].includes(record.approvalRequirement)
  );
  const deterministicOutput = JSON.stringify(probeA) === JSON.stringify(probeB);
  const validationPassed =
    ruleValid &&
    triggerValid &&
    actionValid &&
    approvalRequirementsPreserved &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetAutomationValidationSchemaId,
    ruleValid,
    triggerValid,
    actionValid,
    approvalRequirementsPreserved,
    deterministicOutput,
    validationPassed,
    deterministicAutomationHash: computeDeterministicHash(
      probeA.map((record) => buildActionRecordSignature(record))
    )
  });
}

function buildActionValidation(rule, event, executionStatus, governanceHealth, assetIds) {
  const ruleValid =
    typeof rule.ruleId === "string" &&
    assetAutomationTriggerEvents.includes(rule.triggerEvent) &&
    assetAutomationTypes.includes(rule.actionType);
  const triggerValid = assetAutomationTriggerEvents.includes(event.eventType);
  const actionValid =
    assetAutomationTypes.includes(rule.actionType) &&
    executionStatuses.includes(executionStatus) &&
    assetIds.has(event.assetId);
  const approvalRequirementsPreserved =
    ["REVIEW_REQUIRED", "AUTHORIZATION_REQUIRED"].includes(rule.approvalRequirement) &&
    executionStatus !== "SUGGESTED";
  const deterministicOutput = true;
  const validationPassed =
    ruleValid &&
    triggerValid &&
    actionValid &&
    approvalRequirementsPreserved &&
    deterministicOutput;

  const validationBase = deepFreeze({
    schemaId: assetAutomationValidationSchemaId,
    ruleValid,
    triggerValid,
    actionValid,
    approvalRequirementsPreserved,
    deterministicOutput,
    validationPassed
  });

  return deepFreeze({
    ...validationBase,
    deterministicAutomationHash: computeDeterministicHash(
      buildActionRecordSignature({
        triggerEvent: event.eventType,
        assetId: event.assetId,
        matchedRule: {
          ruleId: rule.ruleId,
          actionType: rule.actionType,
          suggestedAction: rule.suggestedAction
        },
        approvalRequirement: rule.approvalRequirement,
        executionStatus,
        contextSummary: {
          eventSeverity: event.severity,
          governanceHealth,
          sourceRecordId: event.sourceRecordId,
          requestedBy: event.actorSource
        }
      })
    )
  });
}

function buildActionRecordSignature(record) {
  return [
    record.assetId,
    record.triggerEvent,
    record.matchedRule?.ruleId,
    record.matchedRule?.actionType,
    record.matchedRule?.suggestedAction,
    record.approvalRequirement,
    record.executionStatus,
    record.contextSummary
  ];
}

function normalizeOptions(rawOptions) {
  if (rawOptions == null) {
    return deepFreeze({});
  }
  if (typeof rawOptions !== "object" || Array.isArray(rawOptions)) {
    throw createAutomationError(
      "invalid_asset_automation_options",
      "Asset automation options must be an object when provided."
    );
  }
  return deepFreeze({ ...rawOptions });
}

function normalizeRegistry(rawRegistry) {
  const checked = validateAssetFactoryRegistryLayer(rawRegistry);
  if (!checked.ok) {
    throw createAutomationError(checked.errorCode, checked.message);
  }
  return rawRegistry;
}

function normalizeAuditLayer(rawLayer) {
  const checked = validateAssetAuditTrailLayer(rawLayer);
  if (!checked.ok) {
    throw createAutomationError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeGovernanceLayer(rawLayer) {
  const checked = validateAssetGovernanceDashboardLayer(rawLayer);
  if (!checked.ok) {
    throw createAutomationError(checked.errorCode, checked.message);
  }
  return rawLayer;
}

function normalizeEvent(rawEvent, registry) {
  if (!rawEvent || typeof rawEvent !== "object" || Array.isArray(rawEvent)) {
    throw createAutomationError(
      "invalid_asset_automation_event",
      "Asset automation event must be an object."
    );
  }

  const eventType = normalizeEnum(rawEvent.eventType, assetAutomationTriggerEvents, "eventType");
  const assetId = normalizeString(rawEvent.assetId, "assetId");
  if (!registry.getAssetById(assetId)) {
    throw createAutomationError(
      "invalid_asset_automation_event_asset",
      `Asset automation event references unknown asset ${assetId}.`
    );
  }

  return deepFreeze({
    eventType,
    assetId,
    sourceRecordId:
      typeof rawEvent.sourceRecordId === "string" && rawEvent.sourceRecordId.trim().length > 0
        ? rawEvent.sourceRecordId.trim().toUpperCase()
        : `${eventType}_SOURCE_${assetId}`,
    severity: normalizeSeverity(rawEvent.severity),
    actorSource:
      typeof rawEvent.actorSource === "string" && rawEvent.actorSource.trim().length > 0
        ? rawEvent.actorSource.trim()
        : "asset_factory_system"
  });
}

function normalizeSeverity(value) {
  if (value == null) {
    return "MEDIUM";
  }
  return normalizeEnum(value, ["LOW", "MEDIUM", "HIGH"], "severity");
}

function normalizeEnum(value, allowedValues, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAutomationError(
      `invalid_${label}`,
      `${label} must be a non-empty string.`
    );
  }

  const normalized = value.trim().toUpperCase();
  if (!allowedValues.includes(normalized)) {
    throw createAutomationError(
      `invalid_${label}`,
      `${label} must be one of ${allowedValues.join(", ")}.`
    );
  }

  return normalized;
}

function ruleDefinition({
  ruleId,
  triggerEvent,
  actionType,
  suggestedAction,
  approvalRequirement,
  executionStatus
}) {
  return deepFreeze({
    ruleId: normalizeString(ruleId, "ruleId"),
    triggerEvent: normalizeEnum(triggerEvent, assetAutomationTriggerEvents, "triggerEvent"),
    actionType: normalizeEnum(actionType, assetAutomationTypes, "actionType"),
    suggestedAction: normalizeSuggestedAction(suggestedAction),
    approvalRequirement: normalizeEnum(
      approvalRequirement,
      ["REVIEW_REQUIRED", "AUTHORIZATION_REQUIRED"],
      "approvalRequirement"
    ),
    executionStatus: normalizeEnum(executionStatus, executionStatuses, "executionStatus")
  });
}

function normalizeSuggestedAction(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAutomationError(
      "invalid_suggested_action",
      "suggestedAction must be a non-empty string."
    );
  }
  return value.trim();
}

function compareActionRecords(left, right) {
  return (
    left.matchedRule.ruleId.localeCompare(right.matchedRule.ruleId) ||
    left.assetId.localeCompare(right.assetId)
  );
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createAutomationError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function normalizeSlug(value) {
  return String(value).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createAutomationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}
