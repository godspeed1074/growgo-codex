import { createHash } from "node:crypto";

import {
  createAssetChangeManagementLayer,
  validateAssetChangeRecord
} from "./asset-change-management.mjs";
import {
  createAssetDependencyManagementLayer,
  validateAssetDependencyRecord
} from "./asset-dependency-management.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";

export const assetImpactAnalysisLayerSchemaId = "ASSET_IMPACT_ANALYSIS_LAYER_001";
export const assetImpactReportSchemaId = "ASSET_IMPACT_REPORT_001";
export const assetImpactValidationSchemaId = "ASSET_IMPACT_VALIDATION_001";

export const assetImpactLevels = deepFreeze(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const assetImpactAnalysisTypes = deepFreeze([
  "DIRECT_DEPENDENCY_IMPACT",
  "RECIPE_IMPACT",
  "VARIANT_IMPACT",
  "ENVIRONMENT_IMPACT",
  "ATLAS_IMPACT"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const impactDate = "2026-07-27";

export function createAssetImpactAnalysisLayer(
  rawChangeLayer = createAssetChangeManagementLayer(),
  rawDependencyLayer = createAssetDependencyManagementLayer(),
  rawVersioningLayer = createAssetVersioningLayer()
) {
  const changeLayer = normalizeChangeLayer(rawChangeLayer);
  const dependencyLayer = normalizeDependencyLayer(rawDependencyLayer);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);

  const layer = deepFreeze({
    schemaId: assetImpactAnalysisLayerSchemaId,
    layerId: "ASSET_IMPACT_ANALYSIS_LAYER_001_DEFAULT",
    changeLayerId: changeLayer.layerId,
    dependencyLayerId: dependencyLayer.layerId,
    versioningLayerId: versioningLayer.layerId,
    impactLevels: assetImpactLevels,
    analysisTypes: assetImpactAnalysisTypes,
    createImpactReport(rawInput = {}) {
      return createImpactReport(rawInput, changeLayer, dependencyLayer, versioningLayer);
    }
  });

  const checked = validateAssetImpactAnalysisLayer(layer);
  if (!checked.ok) {
    throw createImpactAnalysisError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetImpactAnalysisLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetImpactAnalysisLayerSchemaId) {
      throw createImpactAnalysisError(
        "invalid_asset_impact_analysis_layer_schema",
        `Expected ${assetImpactAnalysisLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.createImpactReport !== "function") {
      throw createImpactAnalysisError(
        "invalid_asset_impact_analysis_layer_api",
        "Asset impact analysis layer must expose createImpactReport."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetImpactAnalysisLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_impact_analysis_layer_validation_failed",
      message: error.message,
      assetImpactAnalysisLayer: null
    });
  }
}

export function validateAssetImpactReport(rawReport) {
  try {
    if (rawReport?.schemaId !== assetImpactReportSchemaId) {
      throw createImpactAnalysisError(
        "invalid_asset_impact_report_schema",
        `Expected ${assetImpactReportSchemaId} but received ${rawReport?.schemaId}.`
      );
    }

    if (!assetImpactLevels.includes(rawReport.impactSeverity)) {
      throw createImpactAnalysisError(
        "invalid_asset_impact_severity",
        `Unsupported impact severity ${rawReport.impactSeverity}.`
      );
    }

    if (!Array.isArray(rawReport.analysisEntries) || rawReport.analysisEntries.length === 0) {
      throw createImpactAnalysisError(
        "invalid_asset_impact_analysis_entries",
        "Asset impact reports must include at least one analysis entry."
      );
    }

    if (rawReport.validation?.schemaId !== assetImpactValidationSchemaId) {
      throw createImpactAnalysisError(
        "invalid_asset_impact_validation_schema",
        `Expected ${assetImpactValidationSchemaId} but received ${rawReport.validation?.schemaId}.`
      );
    }

    for (const entry of rawReport.analysisEntries) {
      if (!assetImpactAnalysisTypes.includes(entry.analysisType)) {
        throw createImpactAnalysisError(
          "invalid_asset_impact_analysis_type",
          `Unsupported analysis type ${entry.analysisType}.`
        );
      }
      if (!assetImpactLevels.includes(entry.impactLevel)) {
        throw createImpactAnalysisError(
          "invalid_asset_impact_entry_level",
          `Unsupported impact level ${entry.impactLevel}.`
        );
      }
    }

    for (const key of [
      "sourceRecordsExist",
      "dependencyChainValid",
      "severityDeterministic",
      "noSourceMutation",
      "validationPassed"
    ]) {
      if (rawReport.validation[key] !== true) {
        throw createImpactAnalysisError(
          "asset_impact_report_validation_failed",
          `Asset impact validation flag ${key} must be true.`
        );
      }
    }

    const expectedSeverity = deriveImpactSeverity(
      rawReport.analysisEntries,
      rawReport.changeRecord.changeCategory
    );
    if (expectedSeverity !== rawReport.impactSeverity) {
      throw createImpactAnalysisError(
        "asset_impact_severity_mismatch",
        "Asset impact severity does not match generated state."
      );
    }

    const expectedHash = computeDeterministicHash(buildImpactSignature(rawReport));
    if (expectedHash !== rawReport.validation.deterministicImpactHash) {
      throw createImpactAnalysisError(
        "asset_impact_hash_mismatch",
        "Asset impact report hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetImpactReport: rawReport
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_impact_report_validation_failed",
      message: error.message,
      assetImpactReport: null
    });
  }
}

function createImpactReport(rawInput, changeLayer, dependencyLayer, versioningLayer) {
  const input = normalizeImpactInput(rawInput);
  const beforeHash = computeInputHash(input);
  const changeRecord =
    input.changeRecord ??
    changeLayer.createChangeRecord({
      assetId: input.assetId,
      changeCategory: input.changeCategory,
      changeReason: input.changeReason
    });
  const versionRecord =
    input.versionRecord ??
    versioningLayer.createVersionRecord({
      assetId: changeRecord.assetId
    });

  const sourceRecordsExist = validateSourceRecords(changeRecord, versionRecord);
  const relatedDependencies = collectRelatedDependencies(dependencyLayer, changeRecord.assetId);
  const analysisEntries = buildAnalysisEntries(relatedDependencies, changeRecord.assetId);
  const impactSeverity = deriveImpactSeverity(analysisEntries, changeRecord.changeCategory);

  const reportBase = deepFreeze({
    schemaId: assetImpactReportSchemaId,
    reportId: `ASSET_IMPACT_${normalizeSlug(changeRecord.assetId)}_${changeRecord.targetVersion.replace(/\./g, "_")}`,
    changedAsset: deepFreeze({
      assetId: changeRecord.assetId,
      changeRecordId: changeRecord.changeRecordId,
      sourceVersion: changeRecord.sourceVersion,
      targetVersion: changeRecord.targetVersion
    }),
    changeRecord,
    versionRecord,
    affectedAssets: collectUniqueTargets(analysisEntries, "ASSET"),
    affectedRecipes: collectUniqueTargets(analysisEntries, "RECIPE"),
    affectedVariantNodes: collectUniqueTargets(analysisEntries, "VARIANT"),
    affectedEnvironments: collectUniqueTargets(analysisEntries, "ENVIRONMENT"),
    affectedAtlasSystems: collectUniqueTargets(analysisEntries, "ATLAS"),
    impactSeverity,
    analysisEntries,
    createdTimestamp: impactDate,
    validation: null
  });

  const afterHash = computeInputHash(input);
  const validation = buildImpactValidation(
    reportBase,
    relatedDependencies,
    sourceRecordsExist,
    beforeHash === afterHash
  );
  const report = deepFreeze({
    ...reportBase,
    validation
  });

  const checked = validateAssetImpactReport(report);
  if (!checked.ok) {
    throw createImpactAnalysisError(checked.errorCode, checked.message);
  }

  return report;
}

function validateSourceRecords(changeRecord, versionRecord) {
  const checkedChange = validateAssetChangeRecord(changeRecord);
  const checkedVersion = validateAssetVersionRecord(versionRecord);
  return checkedChange.ok && checkedVersion.ok && changeRecord.assetId === versionRecord.assetId;
}

function collectRelatedDependencies(dependencyLayer, assetId) {
  const outgoing = dependencyLayer.listDependenciesFor(assetId);
  const inbound = dependencyLayer.dependencyRecords.filter((record) => record.targetId === assetId);
  const recipeSiblings = [];

  for (const record of outgoing) {
    if (record.dependencyType !== "ASSET_USES_RECIPE") {
      continue;
    }
    for (const sibling of dependencyLayer.listDependenciesFor(record.targetId)) {
      if (sibling.targetId === assetId) {
        continue;
      }
      recipeSiblings.push(sibling);
    }
  }

  return deepFreeze(
    [...outgoing, ...inbound, ...recipeSiblings]
      .slice()
      .sort(compareDependencyRecords)
  );
}

function buildAnalysisEntries(relatedDependencies, changedAssetId) {
  const entries = [];
  const dedupe = new Set();

  for (const record of relatedDependencies) {
    const entry = dependencyToAnalysisEntry(record, changedAssetId);
    const key = JSON.stringify([
      entry.analysisType,
      entry.sourceId,
      entry.targetId,
      entry.impactLevel,
      entry.relationship
    ]);
    if (!dedupe.has(key)) {
      dedupe.add(key);
      entries.push(entry);
    }
  }

  return deepFreeze(entries.sort(compareAnalysisEntries));
}

function dependencyToAnalysisEntry(record, changedAssetId) {
  const relationship = record.sourceId === changedAssetId ? "OUTGOING" : "INCOMING";
  const analysisType = deriveAnalysisType(record, changedAssetId);
  const targetClassification = classifyNode(record, changedAssetId);

  return deepFreeze({
    analysisType,
    dependencyType: record.dependencyType,
    sourceId: record.sourceId,
    targetId: record.targetId,
    relationship,
    impactLevel: normalizeImpactLevel(record.impactLevel),
    targetClassification,
    reason: record.dependencyReason
  });
}

function deriveAnalysisType(record, changedAssetId) {
  if (record.dependencyType === "ASSET_USES_RECIPE") {
    return record.sourceId === changedAssetId
      ? "DIRECT_DEPENDENCY_IMPACT"
      : "RECIPE_IMPACT";
  }

  if (record.dependencyType === "RECIPE_USES_ASSET") {
    return "RECIPE_IMPACT";
  }

  if (record.dependencyType === "VARIANT_DEPENDS_ON_ASSET") {
    return "VARIANT_IMPACT";
  }

  if (record.dependencyType === "ASSET_USED_BY_ENVIRONMENT") {
    return "ENVIRONMENT_IMPACT";
  }

  if (record.dependencyType === "ASSET_USED_BY_ATLAS") {
    return "ATLAS_IMPACT";
  }

  return "DIRECT_DEPENDENCY_IMPACT";
}

function classifyNode(record, changedAssetId) {
  const candidateIds = [record.sourceId, record.targetId].filter((value) => value !== changedAssetId);
  const candidateId = candidateIds[0] ?? record.targetId;

  if (candidateId.startsWith("ENVIRONMENT::")) {
    return "ENVIRONMENT";
  }
  if (candidateId.startsWith("ATLAS::")) {
    return "ATLAS";
  }
  if (candidateId.startsWith("VARIANT::")) {
    return "VARIANT";
  }
  if (candidateId.includes("RECIPE")) {
    return "RECIPE";
  }
  return "ASSET";
}

function collectUniqueTargets(analysisEntries, targetClassification) {
  const values = new Set();

  for (const entry of analysisEntries) {
    if (entry.targetClassification !== targetClassification) {
      continue;
    }
    const candidateId =
      entry.sourceId.startsWith(`${targetClassification}::`) ||
      (targetClassification === "RECIPE" && entry.sourceId.includes("RECIPE"))
        ? entry.sourceId
        : entry.targetId;
    values.add(candidateId);
  }

  return deepFreeze([...values].sort((left, right) => left.localeCompare(right)));
}

function buildImpactValidation(report, relatedDependencies, sourceRecordsExist, noSourceMutation) {
  const dependencyChainValid = relatedDependencies.every(
    (record) => validateAssetDependencyRecord(record).ok
  );
  const severityDeterministic =
    deriveImpactSeverity(report.analysisEntries, report.changeRecord.changeCategory) ===
    report.impactSeverity;
  const validationPassed =
    sourceRecordsExist &&
    dependencyChainValid &&
    severityDeterministic &&
    noSourceMutation;

  return deepFreeze({
    schemaId: assetImpactValidationSchemaId,
    sourceRecordsExist,
    dependencyChainValid,
    severityDeterministic,
    noSourceMutation,
    validationPassed,
    deterministicImpactHash: computeDeterministicHash(buildImpactSignature(report))
  });
}

function deriveImpactSeverity(analysisEntries, changeCategory) {
  let score = baseSeverityScore(changeCategory);
  let hasAtlasImpact = false;
  let hasRecipeImpact = false;
  let hasEnvironmentImpact = false;
  let hasVariantImpact = false;

  for (const entry of analysisEntries) {
    score = Math.max(score, impactLevelToScore(entry.impactLevel));
    hasAtlasImpact ||= entry.analysisType === "ATLAS_IMPACT";
    hasRecipeImpact ||= entry.analysisType === "RECIPE_IMPACT";
    hasEnvironmentImpact ||= entry.analysisType === "ENVIRONMENT_IMPACT";
    hasVariantImpact ||= entry.analysisType === "VARIANT_IMPACT";
  }

  if (hasRecipeImpact) {
    score += 1;
  }
  if (hasAtlasImpact) {
    score += 1;
  }
  if (hasEnvironmentImpact && analysisEntries.length >= 4) {
    score += 1;
  }
  if (hasVariantImpact && analysisEntries.length >= 2) {
    score += 1;
  }

  return severityScoreToLevel(Math.min(score, 4));
}

function baseSeverityScore(changeCategory) {
  switch (changeCategory) {
    case "VISUAL_UPDATE":
      return 1;
    case "VARIANT_ADDITION":
      return 2;
    case "BUG_FIX":
    case "PERFORMANCE_OPTIMIZATION":
    case "COMPATIBILITY_UPDATE":
      return 3;
    default:
      return 2;
  }
}

function impactLevelToScore(impactLevel) {
  switch (impactLevel) {
    case "LOW":
      return 1;
    case "MEDIUM":
      return 2;
    case "HIGH":
      return 3;
    case "CRITICAL":
      return 4;
    default:
      return 1;
  }
}

function severityScoreToLevel(score) {
  if (score >= 4) {
    return "CRITICAL";
  }
  if (score === 3) {
    return "HIGH";
  }
  if (score === 2) {
    return "MEDIUM";
  }
  return "LOW";
}

function buildImpactSignature(report) {
  return [
    report.reportId,
    report.changedAsset,
    report.changeRecord.changeRecordId,
    report.versionRecord.versionRecordId,
    report.affectedAssets,
    report.affectedRecipes,
    report.affectedVariantNodes,
    report.affectedEnvironments,
    report.affectedAtlasSystems,
    report.impactSeverity,
    report.analysisEntries,
    report.createdTimestamp
  ];
}

function normalizeImpactInput(rawInput) {
  const input = asPlainObject(rawInput, "assetImpactInput");
  const assetId =
    input.changeRecord?.assetId ??
    input.versionRecord?.assetId ??
    input.assetId ??
    defaultAssetId;

  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw createImpactAnalysisError(
      "invalid_asset_impact_input",
      "Asset impact analysis requires assetId or linked asset records."
    );
  }

  return deepFreeze({
    assetId: assetId.trim(),
    changeCategory:
      typeof input.changeCategory === "string" && input.changeCategory.trim().length > 0
        ? input.changeCategory.trim().toUpperCase()
        : undefined,
    changeReason:
      typeof input.changeReason === "string" && input.changeReason.trim().length > 0
        ? input.changeReason.trim()
        : undefined,
    changeRecord: input.changeRecord ?? null,
    versionRecord: input.versionRecord ?? null
  });
}

function normalizeChangeLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CHANGE_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.createChangeRecord !== "function"
  ) {
    throw createImpactAnalysisError(
      "invalid_asset_impact_change_layer",
      "Asset impact analysis requires a valid asset change management layer."
    );
  }
  return rawLayer;
}

function normalizeDependencyLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_DEPENDENCY_MANAGEMENT_LAYER_001" ||
    !Array.isArray(rawLayer.dependencyRecords) ||
    typeof rawLayer.listDependenciesFor !== "function"
  ) {
    throw createImpactAnalysisError(
      "invalid_asset_impact_dependency_layer",
      "Asset impact analysis requires a valid asset dependency management layer."
    );
  }
  return rawLayer;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createImpactAnalysisError(
      "invalid_asset_impact_versioning_layer",
      "Asset impact analysis requires a valid asset versioning layer."
    );
  }
  return rawLayer;
}

function normalizeImpactLevel(value) {
  const normalized = normalizeString(value, "impactLevel");
  if (!assetImpactLevels.includes(normalized) && !["LOW", "MEDIUM", "HIGH"].includes(normalized)) {
    throw createImpactAnalysisError(
      "invalid_asset_impact_level",
      `Unsupported impact level ${normalized}.`
    );
  }
  return normalized;
}

function compareDependencyRecords(left, right) {
  return (
    left.sourceId.localeCompare(right.sourceId) ||
    left.dependencyType.localeCompare(right.dependencyType) ||
    left.targetId.localeCompare(right.targetId) ||
    left.impactLevel.localeCompare(right.impactLevel)
  );
}

function compareAnalysisEntries(left, right) {
  return (
    left.analysisType.localeCompare(right.analysisType) ||
    left.relationship.localeCompare(right.relationship) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.targetId.localeCompare(right.targetId) ||
    left.impactLevel.localeCompare(right.impactLevel)
  );
}

function computeInputHash(input) {
  return computeDeterministicHash(input);
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function normalizeString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createImpactAnalysisError(`invalid_${label}`, `${label} must be a non-empty string.`);
  }
  return value.trim().toUpperCase();
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createImpactAnalysisError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function createImpactAnalysisError(code, message) {
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
