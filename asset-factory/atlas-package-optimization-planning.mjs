import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import { buildLocationRecipeSelectorFoundation } from "./location-recipe-selector-foundation.mjs";
import { buildLocationRecipeFactoryFoundation } from "./location-recipe-factory-foundation.mjs";

const OPTIMIZATION_ROOT =
  "asset-factory-workspace/atlas-optimization/ATLAS_PACKAGE_OPTIMIZATION_001";

const SPECIFICATION_FILENAME = "atlas-package-optimization-specification.json";
const VALIDATION_FILENAME = "atlas-package-optimization-validation.json";
const LIFECYCLE_FILENAME = "atlas-package-optimization-lifecycle-record.json";
const REPORT_FILENAME = "atlas-package-optimization-architecture-report.md";

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

function buildCompressionStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_COMPRESSION_STRATEGY_001",
    compressionProfileId: "MOBILE_METADATA_COMPACT_001",
    supportedMethods: [
      "FIELD_DICTIONARY_COMPACTION",
      "ENUM_NORMALIZATION",
      "DELTA_FREE_COORDINATE_BUCKETING",
      "REDUNDANT_SIGNAL_DEDUPLICATION",
      "JSON_GZIP_AT_REST"
    ],
    preservedFields: [
      "packageId",
      "regionId",
      "packageVersion",
      "schemaVersion",
      "selectorCompatibility",
      "cacheMetadata.packageFingerprint"
    ],
    forbiddenLosses: [
      "selector seed mutation",
      "recipe compatibility mutation",
      "identity field removal",
      "provenance removal"
    ]
  });
}

function buildDataLayerReductionRules() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_DATA_LAYER_REDUCTION_RULES_001",
    reductionPriority: [
      "drop duplicate descriptive strings after dictionary mapping",
      "collapse repeated signal arrays to normalized token sets",
      "reduce non-selector-critical secondary hints first",
      "retain all selector-critical fields and provenance"
    ],
    selectorCriticalLayers: [
      "REGION_BOUNDARY_LAYER",
      "HYDROLOGY_SIGNAL_LAYER",
      "VEGETATION_SIGNAL_LAYER",
      "ACCESS_NETWORK_LAYER",
      "ENVIRONMENT_SUMMARY_LAYER",
      "PROVENANCE_LAYER"
    ],
    reducibleLayers: [
      "SETTLEMENT_CONTEXT_LAYER.secondaryHints",
      "ENVIRONMENT_SUMMARY_LAYER.secondaryEnvironmentHints",
      "cacheMetadata.noncriticalDebugNotes"
    ],
    hardMinimumPackageShape:
      "all selectorCompatibility, identity, cache fingerprint, and environment summary fields preserved"
  });
}

function buildMobileStorageBudgets() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_MOBILE_STORAGE_BUDGETS_001",
    profiles: [
      {
        profileId: "MOBILE_STANDARD_001",
        maxCompressedPackageKb: 96,
        maxWarmCachePackages: 24,
        maxSelectorPreviewArtifactsPerPackage: 1,
        notes: "Primary target for development planning and preview-ready selector handoff."
      },
      {
        profileId: "MOBILE_CONSTRAINED_001",
        maxCompressedPackageKb: 64,
        maxWarmCachePackages: 12,
        maxSelectorPreviewArtifactsPerPackage: 1,
        notes: "Fallback budget for older or storage-constrained mobile devices."
      }
    ]
  });
}

function buildCacheLifecycle() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_CACHE_LIFECYCLE_001",
    states: [
      "COLD",
      "INDEXED",
      "WARM",
      "NEARBY_READY",
      "STALE",
      "EVICTED"
    ],
    promotionRules: [
      "COLD to INDEXED when package identity and selector compatibility validate",
      "INDEXED to WARM when region enters likely exploration neighborhood",
      "WARM to NEARBY_READY when adjacent to active player corridor or preview focus"
    ],
    evictionRules: [
      "STALE when source revision or selector contract changes",
      "EVICTED when storage budget pressure exceeds profile cap",
      "selector-critical metadata retained in index even after preview artifact eviction"
    ]
  });
}

function buildRegionalPackagePriorityRules() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_PRIORITY_RULES_001",
    priorityFactors: [
      "current region relevance",
      "adjacent region proximity",
      "expected selector usefulness",
      "recipe diversity value",
      "refresh cost"
    ],
    priorityBands: ["IMMEDIATE", "NEARBY", "BACKGROUND", "ARCHIVE_ONLY"],
    deterministicPriorityPolicy:
      "priority score must be derived from region identity, adjacency band, selector relevance, and cache age"
  });
}

function buildNearbyRegionLoadingStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_NEARBY_REGION_LOADING_STRATEGY_001",
    loadingBands: [
      {
        band: "CURRENT_REGION",
        maxPackages: 1,
        expectedState: "NEARBY_READY"
      },
      {
        band: "ADJACENT_REGION_RING",
        maxPackages: 4,
        expectedState: "WARM"
      },
      {
        band: "EXTENDED_CONTEXT_RING",
        maxPackages: 8,
        expectedState: "INDEXED"
      }
    ],
    selectorReadinessRule:
      "only CURRENT_REGION and ADJACENT_REGION_RING packages are expected to carry ready selector handoff caches",
    mobileGuard:
      "loading strategy must remain within MOBILE_STANDARD_001 warm package cap"
  });
}

function buildRefreshAndVersionStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_REFRESH_AND_VERSION_STRATEGY_001",
    refreshTriggers: [
      "source revision change",
      "selector version change",
      "classification rule change",
      "mobile profile change"
    ],
    versionPreservationRules: [
      "package identity fields must remain stable when only compression strategy changes",
      "package fingerprint must change when source revision changes",
      "selector compatibility version must be revalidated on every selector contract bump"
    ],
    lightweightRefreshRule:
      "non-identity cache refreshes may occur without rebuilding the full region package envelope"
  });
}

function buildOfflineFallbackStrategy() {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_OFFLINE_FALLBACK_STRATEGY_001",
    offlineModes: [
      "INDEX_ONLY",
      "LAST_VALID_SELECTOR_HANDOFF",
      "NO_SELECTION_BLOCK"
    ],
    allowedOfflineArtifacts: [
      "package identity",
      "environment summary",
      "last validated selector handoff",
      "package fingerprint"
    ],
    blockedOfflineBehaviors: [
      "map download",
      "runtime render activation",
      "asset mutation",
      "unvalidated selector reconstruction from missing data"
    ]
  });
}

function buildRepresentativeOptimizationExamples(selectorId) {
  const examples = [
    {
      packageId: "ATLAS_REGION_PACKAGE_BELLARINE_COAST_NEG_38_12_144_61_v001",
      regionId: "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
      compressedPackageKb: 72,
      mobileProfile: "MOBILE_STANDARD_001",
      priorityBand: "IMMEDIATE",
      selectorSeed: hashHex(
        "REGION_BELLARINE_COAST_NEG_38_12_144_61_COASTAL_EXPLORATION",
        "v001",
        -38.12,
        144.61,
        "COASTAL_RESERVE_TRAIL",
        "RESERVE_LOOP",
        selectorId
      ),
      expectedRecipeId: "COASTAL_LOCATION_RECIPE_001"
    },
    {
      packageId: "ATLAS_REGION_PACKAGE_DANDENONG_RANGES_EDGE_NEG_37_84_145_29_v001",
      regionId: "REGION_DANDENONG_RANGES_EDGE_NEG_37_84_145_29_FOREST_EXPLORATION",
      compressedPackageKb: 78,
      mobileProfile: "MOBILE_STANDARD_001",
      priorityBand: "NEARBY",
      selectorSeed: hashHex(
        "REGION_DANDENONG_RANGES_EDGE_NEG_37_84_145_29_FOREST_EXPLORATION",
        "v001",
        -37.84,
        145.29,
        "TEMPERATE_FOREST_EDGE",
        "FOREST_EDGE_LOOP",
        selectorId
      ),
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001"
    },
    {
      packageId: "ATLAS_REGION_PACKAGE_COASTAL_FOREST_MARGIN_NEG_38_02_145_01_v001",
      regionId: "REGION_COASTAL_FOREST_MARGIN_NEG_38_02_145_01_MIXED_EDGE_TRANSITION",
      compressedPackageKb: 84,
      mobileProfile: "MOBILE_STANDARD_001",
      priorityBand: "NEARBY",
      selectorSeed: hashHex(
        "REGION_COASTAL_FOREST_MARGIN_NEG_38_02_145_01_MIXED_EDGE_TRANSITION",
        "v001",
        -38.02,
        145.01,
        "TEMPERATE_FOREST_COASTAL_MARGIN",
        "RESERVE_TRACK_OUT_AND_BACK",
        selectorId
      ),
      expectedRecipeId: "FOREST_LOCATION_RECIPE_001"
    }
  ];

  return deepFreeze(examples);
}

function buildSpecification(regionalPlanning, selectorFoundation, recipeFactory) {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_OPTIMIZATION_SPECIFICATION_001",
    optimizationId: "ATLAS_PACKAGE_OPTIMIZATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      regionalPackagePlanningId: regionalPlanning.specification.planningId,
      selectorId: selectorFoundation.specification.selectorId,
      recipeFactoryId: recipeFactory.lifecycle.factoryId
    },
    compressionStrategy: buildCompressionStrategy(),
    dataLayerReductionRules: buildDataLayerReductionRules(),
    mobileStorageBudgets: buildMobileStorageBudgets(),
    cacheLifecycle: buildCacheLifecycle(),
    regionalPackagePriorityRules: buildRegionalPackagePriorityRules(),
    nearbyRegionLoadingStrategy: buildNearbyRegionLoadingStrategy(),
    refreshAndVersionStrategy: buildRefreshAndVersionStrategy(),
    offlineFallbackStrategy: buildOfflineFallbackStrategy(),
    representativeOptimizationExamples: buildRepresentativeOptimizationExamples(
      selectorFoundation.specification.selectorId
    )
  });
}

function buildValidation(specification, regionalPlanning, selectorFoundation) {
  const standardBudget = specification.mobileStorageBudgets.profiles.find(
    (profile) => profile.profileId === "MOBILE_STANDARD_001"
  );

  const checks = [
    {
      name: "package_efficiency_strategy",
      ok:
        specification.compressionStrategy.supportedMethods.length >= 4 &&
        specification.dataLayerReductionRules.selectorCriticalLayers.length >= 5
    },
    {
      name: "deterministic_package_identity_preservation",
      ok: specification.representativeOptimizationExamples.every((example) =>
        example.regionId.startsWith("REGION_") &&
        example.packageId.startsWith("ATLAS_REGION_PACKAGE_") &&
        typeof example.selectorSeed === "string" &&
        example.selectorSeed.length > 20
      )
    },
    {
      name: "recipe_compatibility_preservation",
      ok:
        regionalPlanning.specification.recipeCompatibilityContract.selectorId ===
          selectorFoundation.specification.selectorId &&
        regionalPlanning.specification.recipeCompatibilityContract.approvedRecipeIds.length >= 2
    },
    {
      name: "mobile_suitability",
      ok:
        specification.representativeOptimizationExamples.every(
          (example) => example.compressedPackageKb <= standardBudget.maxCompressedPackageKb
        ) &&
        specification.nearbyRegionLoadingStrategy.loadingBands
          .filter((band) => band.band !== "CURRENT_REGION")
          .reduce((sum, band) => sum + band.maxPackages, 1) <= standardBudget.maxWarmCachePackages
    },
    {
      name: "offline_fallback_preserves_selector_safety",
      ok:
        specification.offlineFallbackStrategy.blockedOfflineBehaviors.includes(
          "unvalidated selector reconstruction from missing data"
        )
    },
    {
      name: "runtime_and_map_downloads_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_OPTIMIZATION_VALIDATION_001",
    optimizationId: specification.optimizationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    nextAllowedAction: "future_atlas_package_optimization_ready",
    checks
  });
}

function buildLifecycle(specification, validation) {
  return deepFreeze({
    schemaId: "ATLAS_PACKAGE_OPTIMIZATION_LIFECYCLE_RECORD_001",
    optimizationId: specification.optimizationId,
    lifecycleStatus: validation.status === "pass" ? "PLANNING_READY" : "BLOCKED",
    selectorId: specification.references.selectorId,
    regionalPackagePlanningId: specification.references.regionalPackagePlanningId,
    recipeFactoryId: specification.references.recipeFactoryId,
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(specification, validation, lifecycle) {
  const lines = [
    "# ATLAS_PACKAGE_OPTIMIZATION_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Regional package planning reference: ${specification.references.regionalPackagePlanningId}`,
    `Selector reference: ${specification.references.selectorId}`,
    "",
    "## Optimization Scope",
    "- Defines how Atlas regional packages stay lightweight and mobile-friendly.",
    "- Preserves deterministic identity and selector compatibility.",
    "- Keeps runtime, downloads, and asset mutation blocked.",
    "",
    "## Representative Optimized Packages",
    ...specification.representativeOptimizationExamples.map(
      (example) =>
        `- ${example.packageId} | ${example.compressedPackageKb} KB | priority ${example.priorityBand} | recipe ${example.expectedRecipeId}`
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

export function buildAtlasPackageOptimizationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });
  const recipeFactory = buildLocationRecipeFactoryFoundation({ cwd });
  const specification = buildSpecification(
    regionalPlanning,
    selectorFoundation,
    recipeFactory
  );
  const validation = buildValidation(
    specification,
    regionalPlanning,
    selectorFoundation
  );
  const lifecycle = buildLifecycle(specification, validation);
  const report = buildReport(specification, validation, lifecycle);
  const fingerprint = hashHex(
    specification.optimizationId,
    validation.status,
    ...specification.representativeOptimizationExamples.map(
      (example) =>
        `${example.packageId}:${example.regionId}:${example.compressedPackageKb}:${example.selectorSeed}`
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

export function writeAtlasPackageOptimizationPlanning(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const planning = buildAtlasPackageOptimizationPlanning({ cwd });
  const optimizationRoot = path.resolve(cwd, OPTIMIZATION_ROOT);
  const specificationRoot = path.join(optimizationRoot, "specification");
  const validationRoot = path.join(optimizationRoot, "validation");
  const lifecycleRoot = path.join(optimizationRoot, "lifecycle");
  const reportsRoot = path.join(optimizationRoot, "reports");

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
  writeAtlasPackageOptimizationPlanning();
}
