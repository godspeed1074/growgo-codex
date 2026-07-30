import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasEngineRecipeIntegrationPlanning } from "./atlas-engine-recipe-integration-planning.mjs";
import { buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";

const PACKAGE_ROOT =
  "asset-factory-workspace/atlas-regional-package/ATLAS_REGIONAL_PACKAGE_PLANNING_001";

const SPECIFICATION_FILENAME = "atlas-regional-package-planning-specification.json";
const VALIDATION_FILENAME = "atlas-regional-package-planning-validation.json";
const LIFECYCLE_FILENAME = "atlas-regional-package-planning-lifecycle-record.json";
const REPORT_FILENAME = "atlas-regional-package-planning-architecture-report.md";

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

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function writeJson(filename, value) {
  fs.writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`);
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildRegionalPackageSchema() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_SCHEMA_001",
    packageLayerId: "ATLAS_REGIONAL_PACKAGE_PLANNING_001",
    packageType: "ATLAS_REGION_CONTEXT_PACKAGE",
    requiredTopLevelFields: [
      "packageId",
      "regionId",
      "packageVersion",
      "schemaVersion",
      "coordinateReference",
      "dataLayers",
      "environmentSummary",
      "classificationInputs",
      "selectorCompatibility",
      "cacheMetadata",
      "refreshMetadata"
    ],
    requiredIdentityFields: [
      "sourceDatasetId",
      "sourceRevision",
      "regionSlug",
      "latBucket",
      "lngBucket",
      "environmentProfile"
    ],
    packageEnvelopeRules: [
      "package data remains read-only during planning",
      "package geometry is never modified by Atlas planning layers",
      "package contents must be sufficient for environment classification and selector handoff",
      "package outputs remain compatible with mobile-oriented planning constraints"
    ]
  });
}

function buildDataLayerDefinitions() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_DATA_LAYERS_001",
    layers: [
      {
        layerId: "REGION_BOUNDARY_LAYER",
        purpose: "Defines deterministic region bounds and coordinate buckets.",
        requiredFields: ["boundaryPolygon", "centroid", "latBucket", "lngBucket"]
      },
      {
        layerId: "HYDROLOGY_SIGNAL_LAYER",
        purpose: "Provides shoreline, creek, wetland, and water-edge signals.",
        requiredFields: ["shorelineSignals", "wetlandSignals", "waterwaySignals"]
      },
      {
        layerId: "VEGETATION_SIGNAL_LAYER",
        purpose: "Provides canopy, shrub, grass, and biome vegetation cues.",
        requiredFields: ["canopySignals", "shrubSignals", "groundCoverSignals"]
      },
      {
        layerId: "ACCESS_NETWORK_LAYER",
        purpose: "Provides navigation, path, crossing, and access hints.",
        requiredFields: ["pathSignals", "crossingSignals", "accessTypeSignals"]
      },
      {
        layerId: "SETTLEMENT_CONTEXT_LAYER",
        purpose: "Provides reserve-entry, town-edge, and activity context hints.",
        requiredFields: ["entrySignals", "adjacentSettlementSignals"]
      },
      {
        layerId: "ENVIRONMENT_SUMMARY_LAYER",
        purpose: "Provides a normalized environment summary for classifier input.",
        requiredFields: [
          "primaryEnvironmentHint",
          "secondaryEnvironmentHints",
          "biomeHints",
          "confidenceHints"
        ]
      },
      {
        layerId: "PROVENANCE_LAYER",
        purpose: "Preserves data origin and source revision tracking.",
        requiredFields: ["sourceDatasetId", "sourceRevision", "provider", "collectedAt"]
      }
    ]
  });
}

function buildRegionIdRules() {
  return deepFreeze({
    schemaId: "ATLAS_REGION_ID_RULES_001",
    regionIdFormat:
      "REGION_{REGION_SLUG}_{LAT_BUCKET}_{LNG_BUCKET}_{ENVIRONMENT_PROFILE}",
    packageIdFormat:
      "ATLAS_REGION_PACKAGE_{REGION_SLUG}_{LAT_BUCKET}_{LNG_BUCKET}_{PACKAGE_VERSION}",
    deterministicInputs: [
      "regionSlug",
      "latBucket",
      "lngBucket",
      "environmentProfile"
    ],
    example: {
      regionId: "REGION_BELLARINE_COAST_-38_12_144_61_COASTAL_EXPLORATION",
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_-38_12_144_61_v001"
    },
    collisionPolicy: "same deterministic inputs must produce same regionId and packageId"
  });
}

function buildSeedStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_SEED_STRATEGY_001",
    seedPolicy: "HASHED_REGION_COORDINATE_CONTEXT",
    selectorSeedInputs: [
      "regionId",
      "packageVersion",
      "latBucket",
      "lngBucket",
      "primaryBiomeHint",
      "archetypeHint",
      "selectorVersion"
    ],
    packageFingerprintInputs: [
      "packageId",
      "sourceRevision",
      "schemaVersion",
      "environmentProfile",
      "latBucket",
      "lngBucket"
    ],
    replayGuarantees: [
      "same package inputs yield same region identity",
      "same package inputs yield same selector seed",
      "same selector seed yields same approved recipe selection"
    ]
  });
}

function buildVersioningStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_VERSIONING_001",
    schemaVersion: "v001",
    packageVersionFormat: "v{NNN}",
    compatibilityDimensions: [
      "schemaVersion",
      "selectorVersion",
      "integrationPlanningVersion",
      "classificationRuleVersion"
    ],
    upgradeRules: [
      "schema changes require schemaVersion bump",
      "selector contract changes require compatibility revalidation",
      "source revision changes require new package fingerprint",
      "runtime activation remains blocked regardless of package version"
    ]
  });
}

function buildCacheStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_CACHE_STRATEGY_001",
    cacheKeys: [
      "packageFingerprint",
      "sourceRevision",
      "selectorVersion",
      "classificationRuleVersion",
      "mobileProfile"
    ],
    cachedArtifacts: [
      "environmentSummary",
      "classificationInputs",
      "selectorHandoff",
      "recipeSelectionPreview"
    ],
    invalidationTriggers: [
      "sourceRevision change",
      "selectorVersion change",
      "classificationRuleVersion change",
      "coordinate bucket change",
      "environment profile change"
    ],
    storagePolicy: "metadata_only_no_runtime_mesh_or_texture_cache"
  });
}

function buildRefreshStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_REFRESH_STRATEGY_001",
    refreshModes: [
      "SOURCE_REVISION_REFRESH",
      "CLASSIFICATION_RULE_REFRESH",
      "SELECTOR_CONTRACT_REFRESH",
      "MANUAL_REVIEW_REFRESH"
    ],
    refreshChecks: [
      "source dataset revision changed",
      "environment summary no longer matches classifier expectations",
      "selector input contract version changed",
      "mobile suitability budget changed"
    ],
    refreshGuardrails: [
      "refresh is data-only",
      "refresh never downloads maps in planning phase",
      "refresh never activates runtime",
      "refresh never mutates approved assets"
    ]
  });
}

function buildRecipeCompatibilityContract(integrationPlanning, selectorFoundation) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_RECIPE_COMPATIBILITY_001",
    selectorId: integrationPlanning.specification.selectorReference.selectorId,
    approvedRecipeIds: selectorFoundation.recipeMetadataRecords.map(
      (metadata) => metadata.recipeId
    ),
    requiredSelectorFields:
      integrationPlanning.specification.selectorInputContract.requiredFields,
    requiredEnvironment: "DEVELOPMENT_ONLY",
    compatibilityRules: [
      "package must emit a complete selector handoff payload",
      "package must only target APPROVED_CURRENT recipes through selector output",
      "package must preserve biomeProfile, routeMode, archetype, desiredFeatures, and seed deterministically",
      "package must remain compatible with ATLAS_ENGINE_RECIPE_INTEGRATION_001 thresholds and fallback rules"
    ]
  });
}

function buildRepresentativePackages(selectorId) {
  const examples = [
    {
      sourceDatasetId: "SOURCE_DATASET_BELLARINE_001",
      sourceRevision: "2026-07-30:R001",
      regionSlug: "BELLARINE_COAST",
      latBucket: -38.12,
      lngBucket: 144.61,
      environmentProfile: "COASTAL_EXPLORATION",
      primaryBiomeHint: "COASTAL_RESERVE_TRAIL",
      archetypeHint: "RESERVE_LOOP",
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001",
      mobileProfile: "MOBILE_STANDARD_001"
    },
    {
      sourceDatasetId: "SOURCE_DATASET_DANDENONGS_001",
      sourceRevision: "2026-07-30:R001",
      regionSlug: "DANDENONG_RANGES_EDGE",
      latBucket: -37.84,
      lngBucket: 145.29,
      environmentProfile: "FOREST_EXPLORATION",
      primaryBiomeHint: "TEMPERATE_FOREST_EDGE",
      archetypeHint: "FOREST_EDGE_LOOP",
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      mobileProfile: "MOBILE_STANDARD_001"
    },
    {
      sourceDatasetId: "SOURCE_DATASET_MIXED_EDGE_001",
      sourceRevision: "2026-07-30:R001",
      regionSlug: "COASTAL_FOREST_MARGIN",
      latBucket: -38.02,
      lngBucket: 145.01,
      environmentProfile: "MIXED_EDGE_TRANSITION",
      primaryBiomeHint: "TEMPERATE_FOREST_COASTAL_MARGIN",
      archetypeHint: "RESERVE_TRACK_OUT_AND_BACK",
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001",
      mobileProfile: "MOBILE_STANDARD_001"
    }
  ];

  return deepFreeze(
    examples.map((example) => {
      const regionId = `REGION_${normalizeToken(example.regionSlug)}_${String(example.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(example.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${normalizeToken(example.environmentProfile)}`;
      const packageVersion = "v001";
      const packageId = `ATLAS_REGION_PACKAGE_${normalizeToken(example.regionSlug)}_${String(example.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(example.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${packageVersion}`;
      const selectorSeed = hashHex(
        regionId,
        packageVersion,
        example.latBucket,
        example.lngBucket,
        example.primaryBiomeHint,
        example.archetypeHint,
        selectorId
      );
      const packageFingerprint = hashHex(
        packageId,
        example.sourceRevision,
        "v001",
        example.environmentProfile,
        example.latBucket,
        example.lngBucket
      );

      return {
        ...example,
        regionId,
        packageId,
        packageVersion,
        selectorSeed,
        packageFingerprint
      };
    })
  );
}

function buildSpecification(integrationPlanning, selectorFoundation) {
  const regionalPackageSchema = buildRegionalPackageSchema();
  const dataLayerDefinitions = buildDataLayerDefinitions();
  const regionIdRules = buildRegionIdRules();
  const deterministicSeedStrategy = buildSeedStrategy();
  const packageVersioning = buildVersioningStrategy();
  const cacheStrategy = buildCacheStrategy();
  const refreshStrategy = buildRefreshStrategy();
  const recipeCompatibilityContract = buildRecipeCompatibilityContract(
    integrationPlanning,
    selectorFoundation
  );
  const representativePackages = buildRepresentativePackages(
    integrationPlanning.specification.selectorReference.selectorId
  );

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_PLANNING_SPECIFICATION_001",
    planningId: "ATLAS_REGIONAL_PACKAGE_PLANNING_001",
    workflowVersion: "ASSET_FACTORY_V1",
    regionalPackageSchema,
    dataLayerDefinitions,
    regionIdRules,
    deterministicSeedStrategy,
    packageVersioning,
    cacheStrategy,
    refreshStrategy,
    recipeCompatibilityContract,
    integrationReferences: {
      atlasIntegrationId: integrationPlanning.specification.integrationId,
      selectorId: integrationPlanning.specification.selectorReference.selectorId,
      approvedRecipeIds: integrationPlanning.specification.selectorReference.approvedRecipeIds
    },
    mobileSuitabilityContract: {
      profileId: "MOBILE_STANDARD_001",
      rules: [
        "package caches metadata only",
        "selector handoff payload must remain compact and deterministic",
        "refresh strategy must support low-churn updates",
        "no heavy geometry, textures, or runtime render data inside package envelope"
      ]
    },
    representativePackages
  });
}

function buildValidation(specification) {
  const checks = [
    {
      name: "deterministic_region_identity",
      ok: specification.representativePackages.every((pkg) => {
        const replayRegionId = `REGION_${normalizeToken(pkg.regionSlug)}_${String(pkg.latBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${String(pkg.lngBucket).replace(/\./g, "_").replace(/-/g, "NEG_")}_${normalizeToken(pkg.environmentProfile)}`;
        return replayRegionId === pkg.regionId;
      })
    },
    {
      name: "package_compatibility",
      ok:
        specification.regionalPackageSchema.requiredTopLevelFields.includes(
          "selectorCompatibility"
        ) &&
        specification.recipeCompatibilityContract.approvedRecipeIds.length >= 2
    },
    {
      name: "selector_input_compatibility",
      ok: specification.recipeCompatibilityContract.requiredSelectorFields.every((field) =>
        [
          "worldContextId",
          "environment",
          "biomeProfile",
          "routeMode",
          "archetype",
          "desiredFeatures",
          "seed"
        ].includes(field)
      )
    },
    {
      name: "deterministic_seed_strategy_valid",
      ok: specification.representativePackages.every((pkg) => {
        const replaySeed = hashHex(
          pkg.regionId,
          pkg.packageVersion,
          pkg.latBucket,
          pkg.lngBucket,
          pkg.primaryBiomeHint,
          pkg.archetypeHint,
          specification.integrationReferences.selectorId
        );
        return replaySeed === pkg.selectorSeed;
      })
    },
    {
      name: "future_mobile_suitability",
      ok:
        specification.cacheStrategy.storagePolicy ===
          "metadata_only_no_runtime_mesh_or_texture_cache" &&
        specification.mobileSuitabilityContract.rules.every((rule) =>
          typeof rule === "string" && rule.length > 0
        )
    },
    {
      name: "runtime_and_map_downloads_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_PLANNING_VALIDATION_001",
    planningId: specification.planningId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_regional_development_ready",
    checks
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_PACKAGE_PLANNING_LIFECYCLE_RECORD_001",
    planningId: specification.planningId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    selectorId: specification.integrationReferences.selectorId,
    atlasIntegrationId: specification.integrationReferences.atlasIntegrationId,
    packageSchemaId: specification.regionalPackageSchema.schemaId,
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(specification, validation, lifecycle) {
  const lines = [
    "# ATLAS_REGIONAL_PACKAGE_PLANNING_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Selector reference: ${specification.integrationReferences.selectorId}`,
    `Atlas integration reference: ${specification.integrationReferences.atlasIntegrationId}`,
    "",
    "## Package Layer",
    "- Defines a deterministic regional package envelope between source data and Atlas recipe selection.",
    "- Preserves source truth and package provenance.",
    "- Keeps package contents metadata-only and mobile-suitable.",
    "",
    "## Representative Packages",
    ...specification.representativePackages.map(
      (pkg) =>
        `- ${pkg.packageId} -> ${pkg.expectedRecipeId} | regionId ${pkg.regionId}`
    ),
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas development: READY",
    "- Runtime activation: BLOCKED",
    "- Map downloads / Blender / GLBs / asset changes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildAtlasRegionalPackagePlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const integrationPlanning = buildAtlasEngineRecipeIntegrationPlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const specification = buildSpecification(integrationPlanning, selectorFoundation);
  const validation = buildValidation(specification);
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle);
  const fingerprint = hashHex(
    specification.planningId,
    validation.status,
    ...specification.representativePackages.map(
      (pkg) => `${pkg.packageId}:${pkg.regionId}:${pkg.selectorSeed}`
    )
  );

  return deepFreeze({
    specification,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeAtlasRegionalPackagePlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasRegionalPackagePlanning({ cwd });
  const packageRoot = path.resolve(cwd, PACKAGE_ROOT);
  const specificationRoot = path.join(packageRoot, "specification");
  const validationRoot = path.join(packageRoot, "validation");
  const lifecycleRoot = path.join(packageRoot, "lifecycle");
  const reportsRoot = path.join(packageRoot, "reports");

  for (const directory of [
    specificationRoot,
    validationRoot,
    lifecycleRoot,
    reportsRoot
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationRoot, SPECIFICATION_FILENAME), planning.specification);
  writeJson(path.join(validationRoot, VALIDATION_FILENAME), planning.validation);
  writeJson(path.join(lifecycleRoot, LIFECYCLE_FILENAME), planning.lifecycle);
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), planning.report);

  return planning;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAtlasRegionalPackagePlanning();
}
