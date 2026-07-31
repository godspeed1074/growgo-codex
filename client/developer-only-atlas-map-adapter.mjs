import fs from "node:fs";
import path from "node:path";
import { createDeveloperOnlyAtlasMapAdapterCore } from "./developer-only-atlas-map-adapter-core.mjs";

const OPERATOR_DECISION_RECORD_PATH =
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001/record/atlas-developer-alpha-runtime-enablement-operator-decision-record.json";
const OPERATOR_DECISION_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-runtime-enablement-operator-decision/ATLAS_DEVELOPER_ALPHA_RUNTIME_ENABLEMENT_OPERATOR_DECISION_001/validation/atlas-developer-alpha-runtime-enablement-operator-decision-validation.json";
const CONTROLLED_RUNTIME_VALIDATION_PATH =
  "asset-factory-workspace/atlas-developer-alpha-controlled-runtime/ATLAS_DEVELOPER_ALPHA_CONTROLLED_RUNTIME_EXECUTION_001/validation/atlas-developer-alpha-controlled-runtime-validation.json";
const REGIONAL_PACKAGE_SPECIFICATION_PATH =
  "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001/specification/atlas-regional-package-planning-specification.json";
const SELECTOR_SPECIFICATION_PATH =
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/specification/location-recipe-selector-specification.json";
const COASTAL_SELECTOR_METADATA_PATH =
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/metadata/coastal-location-recipe-001-selector-metadata.json";
const FOREST_SELECTOR_METADATA_PATH =
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001/metadata/forest-location-recipe-001-selector-metadata.json";

const DEFAULT_CWD = path.resolve(import.meta.dirname, "..");

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") {
      deepFreeze(nested);
    }
  }
  return Object.freeze(value);
}

function readJson(cwd, relativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(cwd, relativePath), "utf8"));
}

function loadApprovedScopeBundle(cwd) {
  const operatorDecisionRecord = readJson(cwd, OPERATOR_DECISION_RECORD_PATH);
  const operatorDecisionValidation = readJson(cwd, OPERATOR_DECISION_VALIDATION_PATH);
  const controlledRuntimeValidation = readJson(cwd, CONTROLLED_RUNTIME_VALIDATION_PATH);

  return deepFreeze({
    decisionRecord: operatorDecisionRecord,
    decisionValidation: operatorDecisionValidation,
    controlledRuntimeValidation,
    approvedScope: {
      regionId: operatorDecisionRecord.scopeConfirmation.regionId,
      packageId: operatorDecisionRecord.scopeConfirmation.packageId,
      recipeId: operatorDecisionRecord.scopeConfirmation.recipeId,
      internalDeveloperOnly:
        operatorDecisionRecord.scopeConfirmation.internalDeveloperOnly
    },
    safetyFlags: {
      runtimeExecutionEnabled: controlledRuntimeValidation.runtimeExecutionEnabled,
      mapAttachmentAllowed: controlledRuntimeValidation.mapAttachmentAllowed,
      automaticRendererExecutionAllowed:
        controlledRuntimeValidation.automaticRendererExecutionAllowed,
      lifecycleExecutionEnabled: false
    }
  });
}

function loadRepresentativePackage(cwd, packageId) {
  const specification = readJson(cwd, REGIONAL_PACKAGE_SPECIFICATION_PATH);
  return (
    specification.representativePackages.find(
      (entry) => entry.packageId === packageId
    ) ?? null
  );
}

function loadSelectorFoundation(cwd) {
  return deepFreeze({
    specification: readJson(cwd, SELECTOR_SPECIFICATION_PATH),
    recipeMetadataRecords: [
      readJson(cwd, COASTAL_SELECTOR_METADATA_PATH),
      readJson(cwd, FOREST_SELECTOR_METADATA_PATH)
    ]
  });
}

export function createDeveloperOnlyAtlasMapAdapter(options = {}) {
  const cwd = options.cwd ?? DEFAULT_CWD;
  const scopeBundle = options.scopeBundle ?? loadApprovedScopeBundle(cwd);
  const approvedScope = options.approvedScopeOverride ?? scopeBundle.approvedScope;
  const approvedRepresentativePackage =
    options.approvedRepresentativePackageOverride ??
    loadRepresentativePackage(cwd, approvedScope.packageId);
  const selectorFoundation =
    options.selectorFoundationOverride ?? loadSelectorFoundation(cwd);

  return createDeveloperOnlyAtlasMapAdapterCore({
    approvedScope,
    safetyFlags: {
      ...scopeBundle.safetyFlags,
      ...(options.safetyFlagsOverride ?? {})
    },
    approvedRepresentativePackage,
    selectorFoundation,
    bridgeStateOverride: options.bridgeStateOverride
  });
}

export function getAtlasMapDiagnostic(input, options = {}) {
  return createDeveloperOnlyAtlasMapAdapter(options).getAtlasMapDiagnostic(input);
}
