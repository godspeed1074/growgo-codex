import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const FACTORY_ROOT =
  "asset-factory-workspace/recipe-factory/LOCATION_RECIPE_FACTORY_001";
const RECIPE_ROOT =
  "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001";

const FACTORY_SPECIFICATION_FILENAME =
  "location-recipe-factory-specification.json";
const FACTORY_VALIDATION_FILENAME = "location-recipe-factory-validation.json";

const SPECIFICATION_FILENAME = "forest-location-recipe-001-specification.json";
const VALIDATION_FILENAME = "forest-location-recipe-001-validation.json";
const LIFECYCLE_FILENAME = "forest-location-recipe-001-lifecycle.json";
const REPORT_FILENAME = "forest-location-recipe-001-report.md";

const APPROVED_DEPENDENCY_RECORDS = Object.freeze([
  {
    role: "primary_path_surface",
    placementTags: ["trail_spine", "reserve_loop", "forest_walk"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export/coastal-gravel-path-development-catalog-entry.json"
  },
  {
    role: "understory_ground_blend",
    placementTags: ["leaf_litter_margin", "trail_edge_fill", "forest_floor_blend"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-development-catalog-entry.json"
  },
  {
    role: "terrain_detail_cluster",
    placementTags: ["trailside_rock", "forest_outcrop", "clearing_margin"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-rock-cluster-development-catalog-entry.json"
  },
  {
    role: "native_grass_breakup",
    placementTags: ["forest_edge_grass", "light_gap_ground", "track_margin"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-grass-tussock-development-catalog-entry.json"
  },
  {
    role: "forest_shrub_mass",
    placementTags: ["midstory_cluster", "track_bend_screen", "forest_edge_shrub"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-development-catalog-entry.json"
  },
  {
    role: "accent_native_tree",
    placementTags: ["trail_marker_tree", "clearing_anchor", "transition_tree"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-development-catalog-entry.json"
  }
]);

const DEFERRED_DEPENDENCY_RECORDS = Object.freeze([
  {
    plannedRole: "forest_canopy_tree",
    reason:
      "TREE_EUCALYPTUS_001 is validated and registered for development use, but has not yet reached an approved lifecycle state required by LOCATION_RECIPE_FACTORY_001 intake rules.",
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-eucalyptus-development-catalog-entry.json"
  }
]);

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

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function hashHex(...parts) {
  const hash = createHash("sha256");
  for (const part of parts) {
    hash.update(String(part));
    hash.update("|");
  }
  return hash.digest("hex");
}

function isApprovedLocationRecipeDependency(entry, factorySpecification) {
  return (
    entry &&
    entry.environment ===
      factorySpecification.dependencyValidation.requiredDependencyStatuses.environment &&
    entry.publishStatus === "not_published" &&
    entry.releaseStatus === "not_released" &&
    entry.validationStatus ===
      factorySpecification.dependencyValidation.requiredDependencyStatuses.validationStatus &&
    factorySpecification.dependencyValidation.allowedDependencyLifecycleStates.includes(
      entry.lifecycleStatus
    )
  );
}

function loadDependencyRecord(cwd, descriptor) {
  const absolutePath = path.resolve(cwd, descriptor.sourceRecord);
  const catalogEntry = readJson(absolutePath);
  return deepFreeze({
    role: descriptor.role,
    placementTags: descriptor.placementTags,
    sourceRecord: descriptor.sourceRecord,
    catalogEntry
  });
}

function loadDeferredDependencyRecord(cwd, descriptor) {
  const absolutePath = path.resolve(cwd, descriptor.sourceRecord);
  const catalogEntry = readJson(absolutePath);
  return deepFreeze({
    plannedRole: descriptor.plannedRole,
    reason: descriptor.reason,
    sourceRecord: descriptor.sourceRecord,
    catalogEntry
  });
}

function summarizeDependency(record) {
  const { catalogEntry } = record;
  return deepFreeze({
    assetId: catalogEntry.assetId,
    version: catalogEntry.version,
    role: record.role,
    familyId: catalogEntry.familyId,
    category: catalogEntry.category,
    recipeId: catalogEntry.recipeId,
    environment: catalogEntry.environment,
    lifecycleStatus: catalogEntry.lifecycleStatus,
    validationStatus: catalogEntry.validationStatus,
    visualApprovalStatus: catalogEntry.visualApprovalStatus ?? null,
    placementTags: record.placementTags,
    availableLods: {
      close: catalogEntry.availableLods.close.filename,
      gameplay: catalogEntry.availableLods.gameplay.filename,
      map: catalogEntry.availableLods.map.filename
    },
    metrics: {
      closeTriangles: catalogEntry.availableLods.close.triangleCount,
      gameplayTriangles: catalogEntry.availableLods.gameplay.triangleCount,
      mapTriangles: catalogEntry.availableLods.map.triangleCount,
      closeMaterials: catalogEntry.availableLods.close.materialCount
    },
    atlasCompatibility: catalogEntry.atlasCompatibility,
    sourceCatalogRecord: record.sourceRecord
  });
}

function summarizeDeferredDependency(record) {
  const { catalogEntry } = record;
  return deepFreeze({
    assetId: catalogEntry.assetId,
    version: catalogEntry.version,
    plannedRole: record.plannedRole,
    lifecycleStatus: catalogEntry.lifecycleStatus,
    validationStatus: catalogEntry.validationStatus,
    sourceCatalogRecord: record.sourceRecord,
    reason: record.reason
  });
}

function loadFactoryReference(cwd) {
  const factoryRoot = path.resolve(cwd, FACTORY_ROOT);
  return {
    specification: readJson(
      path.join(factoryRoot, "specification", FACTORY_SPECIFICATION_FILENAME)
    ),
    validation: readJson(
      path.join(factoryRoot, "validation", FACTORY_VALIDATION_FILENAME)
    )
  };
}

export function buildForestLocationRecipeSpecification(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const factory = loadFactoryReference(cwd);

  if (factory.validation.status !== "pass") {
    throw new Error(
      "Forest location recipe intake blocked: LOCATION_RECIPE_FACTORY_001 validation must pass first."
    );
  }

  const approvedDependencies = APPROVED_DEPENDENCY_RECORDS.map((descriptor) =>
    loadDependencyRecord(cwd, descriptor)
  );
  const deferredDependencies = DEFERRED_DEPENDENCY_RECORDS.map((descriptor) =>
    loadDeferredDependencyRecord(cwd, descriptor)
  );

  const dependencyEligibility = approvedDependencies.map((record) => ({
    assetId: record.catalogEntry.assetId,
    approved: isApprovedLocationRecipeDependency(
      record.catalogEntry,
      factory.specification
    )
  }));
  const invalidDependency = dependencyEligibility.find((entry) => !entry.approved);
  if (invalidDependency) {
    throw new Error(
      `Forest location recipe intake blocked: ${invalidDependency.assetId} is not in an approved factory dependency state.`
    );
  }

  const specification = {
    schemaId: "LOCATION_RECIPE_FACTORY_V1_INTAKE_001",
    recipePackageId: "FOREST_LOCATION_RECIPE_001_PACKAGE",
    factoryId: factory.specification.factoryId,
    workflowVersion: factory.specification.workflowVersion,
    createdOn: options.createdOn ?? "2026-07-30",
    status: "recipe_intake_complete_generation_not_started",
    recipeIdentity: {
      recipeId: "FOREST_LOCATION_RECIPE_001",
      recipeType: "WORLD_ASSEMBLY_FOREST_EXPLORATION_LOCATION",
      version: "v001",
      variantId: "DEFAULT",
      paletteId: "AU_TEMPERATE_FOREST_EXPLORATION_001",
      lodProfile: "WORLD_ASSEMBLY_REFERENCED_ASSETS_ONLY",
      category: "WORLD_ASSEMBLY_LOCATION",
      identityPolicy: "DEPENDENCY_REFERENCED_ONLY"
    },
    biomeClassification: {
      primaryBiome: "TEMPERATE_FOREST",
      supportedBiomeProfiles: [
        "TEMPERATE_FOREST_EDGE",
        "FOREST_TRACK_CLEARING",
        "WOODLAND_RESERVE_LOOP"
      ],
      biomeIntent:
        "Reusable forest-edge and reserve-walk compositions using approved development-catalog assets plus deferred canopy uplift."
    },
    assetDependencies: {
      requiredCoreAssets: approvedDependencies
        .slice(0, 3)
        .map((record) => summarizeDependency(record)),
      approvedVegetationAssets: approvedDependencies
        .slice(3)
        .map((record) => summarizeDependency(record)),
      deferredAssets: deferredDependencies.map((record) =>
        summarizeDeferredDependency(record)
      )
    },
    placementRules: {
      zoneDefinitions: [
        {
          zoneId: "ENTRY_TRACK_ZONE",
          purpose: "forest arrival, track legibility, and movement orientation",
          allowedAssetRoles: ["primary_path_surface", "understory_ground_blend"],
          placementRule:
            "A readable walking surface must anchor the arrival track, with low ground-cover support allowed on edges but not across the standing corridor."
        },
        {
          zoneId: "FOREST_EDGE_TRANSITION_ZONE",
          purpose: "transition from open approach into denser vegetation character",
          allowedAssetRoles: [
            "native_grass_breakup",
            "forest_shrub_mass",
            "understory_ground_blend",
            "terrain_detail_cluster"
          ],
          placementRule:
            "Edge-transition zones should step up vegetation density gradually while preserving sight-line breaks and occasional stone or root-like terrain accents."
        },
        {
          zoneId: "CANOPY_TRACK_ZONE",
          purpose: "main forest walking lane under stronger vegetation cover",
          allowedAssetRoles: [
            "primary_path_surface",
            "understory_ground_blend",
            "forest_shrub_mass",
            "accent_native_tree"
          ],
          placementRule:
            "The main forest track remains traversable and readable while the surrounding vegetation mass increases in depth and enclosure."
        },
        {
          zoneId: "CLEARING_OR_REST_ZONE",
          purpose: "pause point, small clearing, or scenic turn-out within the forest walk",
          allowedAssetRoles: [
            "primary_path_surface",
            "terrain_detail_cluster",
            "accent_native_tree",
            "understory_ground_blend"
          ],
          placementRule:
            "Clearings need one readable standing area plus one or more anchoring accents to create a sense of destination or rest."
        },
        {
          zoneId: "DEEP_FOREST_MARGIN_ZONE",
          purpose: "dense backdrop and future canopy-support zone",
          allowedAssetRoles: [
            "forest_shrub_mass",
            "native_grass_breakup",
            "accent_native_tree"
          ],
          placementRule:
            "The deep forest margin builds the impression of thicker growth behind the main route and reserves space for later canopy-tree promotion."
        }
      ],
      deterministicPlacementIntent: [
        "keep primary walking corridor legible from entry to clearing",
        "increase vegetation mass gradually from edge to deep forest margin",
        "reserve canopy-support composition space for future eucalyptus promotion"
      ]
    },
    deterministicSeedRules: {
      seedStrategy:
        "hash(recipeId, locationId, variantId, biomeProfile, placementZoneId)",
      requiredSeedFields:
        factory.specification.deterministicGenerationRules.requiredSeedFields,
      sameSeedMustProduceSameFingerprint:
        factory.specification.deterministicGenerationRules.sameSeedMustProduceSameFingerprint
    },
    navigationRules: {
      supportedArchetypes: [
        "FOREST_EDGE_LOOP",
        "CLEARING_SPUR",
        "RESERVE_TRACK_OUT_AND_BACK"
      ],
      routeIntent:
        "Forest navigation should prioritize readable walking routes, low obstruction, and a clear destination or return logic.",
      standingZoneRule:
        "At least one clearing or pause zone must preserve a readable standing area free of dense vegetation overlap."
    },
    previewRequirements: {
      mode: factory.specification.previewWorkflow.mode,
      requiredArtifacts: factory.specification.previewWorkflow.requiredArtifacts,
      requiredReviewChecks: [
        "player_journey",
        ...factory.specification.previewWorkflow.requiredReviewChecks,
        "forest_density_gradient"
      ]
    },
    validationRequirements: {
      requiredChecks: [
        "factory_reference_ready",
        "approved_dependencies_exist",
        "unsupported_assets_blocked",
        "deterministic_seed_rules_defined",
        "preview_requirements_defined",
        "approval_workflow_defined"
      ],
      nextAllowedAction: "recipe_generation_only"
    },
    approvalWorkflow: {
      prerequisites: factory.specification.approvalWorkflow.prerequisites,
      producedRecords: factory.specification.approvalWorkflow.producedRecords,
      publishBlockedByDefault:
        factory.specification.approvalWorkflow.publishBlockedByDefault
    },
    versioningRules: factory.specification.versioningRules,
    deterministicFingerprint: ""
  };

  specification.deterministicFingerprint = hashHex(
    specification.recipeIdentity.recipeId,
    JSON.stringify(specification.biomeClassification),
    JSON.stringify(specification.assetDependencies),
    JSON.stringify(specification.placementRules.zoneDefinitions),
    JSON.stringify(specification.navigationRules.supportedArchetypes)
  );

  return deepFreeze(specification);
}

export function buildForestLocationRecipeValidation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const factory = loadFactoryReference(cwd);
  const specification = buildForestLocationRecipeSpecification(options);

  const approvedIds = [
    ...specification.assetDependencies.requiredCoreAssets.map((entry) => entry.assetId),
    ...specification.assetDependencies.approvedVegetationAssets.map((entry) => entry.assetId)
  ];

  const checks = [
    ["factory_reference_ready", factory.validation.status === "pass"],
    [
      "approved_dependencies_exist",
      approvedIds.length >= 5 &&
        approvedIds.every((assetId) => typeof assetId === "string")
    ],
    [
      "unsupported_assets_blocked",
      specification.assetDependencies.deferredAssets.some(
        (entry) => entry.assetId === "TREE_EUCALYPTUS_001"
      )
    ],
    [
      "deterministic_seed_rules_defined",
      specification.deterministicSeedRules.sameSeedMustProduceSameFingerprint ===
        true
    ],
    [
      "preview_requirements_defined",
      specification.previewRequirements.requiredArtifacts.length === 4 &&
        specification.previewRequirements.requiredReviewChecks.includes(
          "forest_density_gradient"
        )
    ],
    [
      "approval_workflow_defined",
      specification.approvalWorkflow.producedRecords.length === 3
    ],
    ["no_blender_usage", true],
    ["no_glb_generation", true],
    ["no_asset_modification", true],
    ["no_runtime_activation", true]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_VALIDATION_001",
    recipeId: specification.recipeIdentity.recipeId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: specification.deterministicFingerprint,
    nextAllowedAction: "recipe_generation_only"
  });
}

export function buildForestLocationRecipeLifecycle(options = {}) {
  const specification = buildForestLocationRecipeSpecification(options);
  const validation = buildForestLocationRecipeValidation(options);

  return deepFreeze({
    schemaId: "FOREST_LOCATION_RECIPE_001_LIFECYCLE_001",
    recipeId: specification.recipeIdentity.recipeId,
    lifecycleState:
      validation.status === "pass" ? "GENERATION_READY" : "INTAKE_DEFINED",
    currentVersion: specification.recipeIdentity.version,
    factoryReference: "LOCATION_RECIPE_FACTORY_001",
    deterministicFingerprint: specification.deterministicFingerprint,
    safety: {
      blenderUsed: false,
      glbsCreated: false,
      assetsModified: false,
      runtimeActivated: false
    }
  });
}

export function renderForestLocationRecipeReport(options = {}) {
  const specification = buildForestLocationRecipeSpecification(options);
  const validation = buildForestLocationRecipeValidation(options);
  const lifecycle = buildForestLocationRecipeLifecycle(options);

  return `# FOREST_LOCATION_RECIPE_001 Intake Report

Status: Recipe intake complete, generation not started

## Identity

- recipe ID: ${specification.recipeIdentity.recipeId}
- recipe type: ${specification.recipeIdentity.recipeType}
- version: ${specification.recipeIdentity.version}
- factory reference: LOCATION_RECIPE_FACTORY_001

## Approved starter dependencies

${[
  ...specification.assetDependencies.requiredCoreAssets,
  ...specification.assetDependencies.approvedVegetationAssets
]
  .map((entry) => `- ${entry.assetId} (${entry.role})`)
  .join("\n")}

## Deferred forest uplift

${specification.assetDependencies.deferredAssets
  .map((entry) => `- ${entry.assetId} (${entry.plannedRole}) - ${entry.reason}`)
  .join("\n")}

## Lifecycle

- current state: ${lifecycle.lifecycleState}
- next allowed action: ${validation.nextAllowedAction}

## Safety

No Blender, GLBs, asset modification, or runtime activation were performed.

## Outcome

\`FOREST_LOCATION_RECIPE_001\` is ready for recipe generation using LOCATION_RECIPE_FACTORY_001.
`;
}

export function writeForestLocationRecipeIntake(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const specificationRoot = path.join(recipeRoot, "specification");
  const validationRoot = path.join(recipeRoot, "validation");
  const lifecycleRoot = path.join(recipeRoot, "lifecycle");
  const reportsRoot = path.join(recipeRoot, "reports");

  ensureDirectory(specificationRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(lifecycleRoot);
  ensureDirectory(reportsRoot);

  const specification = buildForestLocationRecipeSpecification(options);
  const validation = buildForestLocationRecipeValidation(options);
  const lifecycle = buildForestLocationRecipeLifecycle(options);
  const report = renderForestLocationRecipeReport(options);

  fs.writeFileSync(
    path.join(specificationRoot, SPECIFICATION_FILENAME),
    `${JSON.stringify(specification, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(validationRoot, VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(lifecycleRoot, LIFECYCLE_FILENAME),
    `${JSON.stringify(lifecycle, null, 2)}\n`
  );
  fs.writeFileSync(path.join(reportsRoot, REPORT_FILENAME), `${report}\n`);

  return deepFreeze({
    recipeRoot,
    specification,
    validation,
    lifecycle,
    report
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  writeForestLocationRecipeIntake();
}
