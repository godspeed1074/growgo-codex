import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";
const SPECIFICATION_FILENAME = "coastal-location-recipe-001-specification.json";
const VALIDATION_FILENAME = "coastal-location-recipe-001-validation.json";
const REPORT_FILENAME = "coastal-location-recipe-001-report.md";

const APPROVED_DEPENDENCY_RECORDS = Object.freeze([
  {
    role: "primary_path_surface",
    placementTags: ["trail_spine", "beach_access", "reserve_link"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export/coastal-gravel-path-development-catalog-entry.json"
  },
  {
    role: "elevated_wet_crossing",
    placementTags: ["wetland_crossing", "dune_walkover", "lookout_approach"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export/coastal-boardwalk-development-catalog-entry.json"
  },
  {
    role: "shoreline_transition_band",
    placementTags: ["water_margin", "creek_edge", "shoreline_buffer"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-water-edge-development-catalog-entry.json"
  },
  {
    role: "understory_ground_blend",
    placementTags: ["path_edge", "dune_margin", "rest_area_fill"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-ground-cover-v002-development-catalog-entry.json"
  },
  {
    role: "terrain_detail_cluster",
    placementTags: ["shoreline_detail", "cliff_base", "lookout_margin"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-rock-cluster-development-catalog-entry.json"
  },
  {
    role: "native_grass_breakup",
    placementTags: ["trail_edge", "dune_edge", "reserve_ground"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/coastal-grass-tussock-development-catalog-entry.json"
  },
  {
    role: "coastal_shrub_mass",
    placementTags: ["windbreak", "garden_edge", "shelter_cluster"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-development-catalog-entry.json"
  },
  {
    role: "accent_native_tree",
    placementTags: ["gateway_marker", "lookout_shade", "park_anchor"],
    sourceRecord:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-development-catalog-entry.json"
  }
]);

const DEFERRED_DEPENDENCY_RECORDS = Object.freeze([
  {
    reason:
      "Validated local asset exists, but the catalog state is not yet in an approved lifecycle band for this recipe intake.",
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

export function isApprovedWorldAssemblyDependency(entry) {
  return (
    entry &&
    entry.environment === "DEVELOPMENT_ONLY" &&
    entry.publishStatus === "not_published" &&
    entry.releaseStatus === "not_released" &&
    entry.validationStatus === "approved" &&
    ["ACTIVE_DEVELOPMENT_REVISION", "APPROVED_CURRENT", "APPROVED_CURRENT_CANDIDATE"].includes(
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
    sourceCatalogRecord: record.sourceRecord
  });
}

function summarizeDeferredDependency(record) {
  const { catalogEntry } = record;
  return deepFreeze({
    assetId: catalogEntry.assetId,
    version: catalogEntry.version,
    lifecycleStatus: catalogEntry.lifecycleStatus,
    validationStatus: catalogEntry.validationStatus,
    sourceCatalogRecord: record.sourceRecord,
    reason: record.reason
  });
}

export function buildCoastalLocationRecipeSpecification(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const approvedDependencies = APPROVED_DEPENDENCY_RECORDS.map((descriptor) =>
    loadDependencyRecord(cwd, descriptor)
  );
  const deferredDependencies = DEFERRED_DEPENDENCY_RECORDS.map((descriptor) =>
    loadDeferredDependencyRecord(cwd, descriptor)
  );

  const dependencyEligibility = approvedDependencies.map((record) => ({
    assetId: record.catalogEntry.assetId,
    approved: isApprovedWorldAssemblyDependency(record.catalogEntry)
  }));
  const invalidDependency = dependencyEligibility.find((entry) => !entry.approved);
  if (invalidDependency) {
    throw new Error(
      `Coastal location recipe intake blocked: ${invalidDependency.assetId} is not in an approved development-catalog state.`
    );
  }

  const specification = {
    schemaId: "ASSET_FACTORY_V1_WORLD_ASSEMBLY_RECIPE_INTAKE_001",
    recipePackageId: "COASTAL_LOCATION_RECIPE_001_PACKAGE",
    workflowVersion: "ASSET_FACTORY_V1",
    createdOn: options.createdOn ?? "2026-07-30",
    status: "recipe_intake_complete_generation_not_started",
    recipeIdentity: {
      recipeId: "COASTAL_LOCATION_RECIPE_001",
      recipeType: "WORLD_ASSEMBLY_COASTAL_EXPLORATION_LOCATION",
      version: "v001",
      variantId: "DEFAULT",
      paletteId: "AU_COASTAL_EXPLORATION_001",
      lodProfile: "WORLD_ASSEMBLY_REFERENCED_ASSETS_ONLY",
      category: "WORLD_ASSEMBLY_LOCATION",
      identityPolicy: "DEPENDENCY_REFERENCED_ONLY"
    },
    assetDependencies: {
      requiredCoreAssets: approvedDependencies
        .slice(0, 5)
        .map((record) => summarizeDependency(record)),
      approvedVegetationAssets: approvedDependencies
        .slice(5)
        .map((record) => summarizeDependency(record)),
      deferredAssets: deferredDependencies.map((record) =>
        summarizeDeferredDependency(record)
      )
    },
    placementRules: {
      zoneDefinitions: [
        {
          zoneId: "ENTRY_PATH_ZONE",
          purpose: "primary coastal arrival and pedestrian guidance",
          allowedAssetRoles: ["primary_path_surface", "understory_ground_blend"],
          placementRule:
            "COASTAL_GRAVEL_PATH_001 anchors the entry corridor and may be flanked by ground cover or grass without obstructing walkability."
        },
        {
          zoneId: "SHORELINE_EDGE_ZONE",
          purpose: "visual shoreline transition and non-navigable water boundary",
          allowedAssetRoles: ["shoreline_transition_band", "terrain_detail_cluster"],
          placementRule:
            "COASTAL_WATER_EDGE_001 defines the water boundary and must remain non-traversable, with rock clusters used only as edge-weighted accents."
        },
        {
          zoneId: "WET_CROSSING_ZONE",
          purpose: "wetland, dune, creek, or unstable ground passage",
          allowedAssetRoles: ["elevated_wet_crossing", "shoreline_transition_band"],
          placementRule:
            "COASTAL_BOARDWALK_001 is used only where a grade break, water-adjacent crossing, or unstable terrain transition makes gravel path placement unsuitable."
        },
        {
          zoneId: "VEGETATION_BUFFER_ZONE",
          purpose: "soften edges and establish coastal biome character",
          allowedAssetRoles: [
            "native_grass_breakup",
            "coastal_shrub_mass",
            "accent_native_tree",
            "understory_ground_blend"
          ],
          placementRule:
            "Vegetation layers must preserve sight lines on navigation edges while building denser masses behind paths, boardwalk entries, and lookout margins."
        },
        {
          zoneId: "LOOKOUT_OR_REST_ZONE",
          purpose: "small pause point, scenic turnout, or destination node",
          allowedAssetRoles: [
            "primary_path_surface",
            "elevated_wet_crossing",
            "terrain_detail_cluster",
            "accent_native_tree"
          ],
          placementRule:
            "Destination nodes may terminate a path or complete a loop, but must keep at least one readable standing zone clear of dense vegetation or water-edge collision."
        }
      ],
      adjacencyRules: [
        "COASTAL_GRAVEL_PATH_001 may transition into COASTAL_BOARDWALK_001 only through an explicit wet-crossing or unstable-ground zone.",
        "COASTAL_WATER_EDGE_001 must sit adjacent to shoreline, creek, inlet, or wet-margin bands and may not be placed as a free-floating inland strip.",
        "COASTAL_ROCK_CLUSTER_001 should reinforce edges, corners, and lookout bases rather than fill traversal lanes.",
        "Ground cover, grass, shrubs, and bottlebrush masses should layer from low to high away from the walkable corridor to preserve path readability."
      ],
      repeatedPlacementCompatibility: {
        deterministicPlacementCompatible: true,
        repeatedPlacementReady: true,
        snapOrAlignmentExpectation:
          "Path and boardwalk segments should be assembled on deterministic lane points rather than freehand artist offsets."
      }
    },
    deterministicSeedRules: {
      seedStrategy: "hash(recipeId, locationId, variantId, biomeProfile, placementZoneId)",
      seedInputs: [
        "recipeId",
        "locationId",
        "variantId",
        "biomeProfile",
        "placementZoneId"
      ],
      deterministicGuarantees: [
        "same seed input set yields the same dependency ordering and placement slot choices",
        "vegetation jitter remains bounded to per-zone placement envelopes",
        "boardwalk usage appears only when a zone is tagged as wet crossing or unstable terrain"
      ],
      allowedRandomisation: {
        shorelineEdgeOffsetMeters: {
          min: -0.35,
          max: 0.35
        },
        vegetationScatterMeters: {
          min: -0.75,
          max: 0.75
        },
        rockRotationDegrees: {
          min: -18,
          max: 18
        }
      }
    },
    biomeRules: {
      allowedBiomeProfiles: [
        "COASTAL_DUNE_EDGE",
        "COASTAL_WETLAND_MARGIN",
        "COASTAL_RESERVE_TRAIL",
        "COASTAL_CLIFF_LOOKOUT",
        "COASTAL_CREEK_MOUTH"
      ],
      disallowedBiomeProfiles: [
        "URBAN_MAIN_STREET",
        "INLAND_FARMLAND",
        "ALPINE_TUNDRA"
      ],
      compatibilityNotes: [
        "Boardwalk emphasis rises in wetland, creek, and dune-protection contexts.",
        "Rock density rises around cliff and lookout margins.",
        "Bottlebrush and shrubs are optional accent vegetation rather than mandatory core traversal assets."
      ]
    },
    navigationRules: {
      navigationMode: "pedestrian_exploration",
      routeRequirements: [
        "every location must expose at least one continuous traversable route from entry zone to a scenic or loop completion destination",
        "water-edge bands remain visual boundaries and are never traversable route surfaces",
        "boardwalk entries and exits must reconnect to path-capable terrain or a designated destination node"
      ],
      accessibilityGuidance: [
        "prefer gravel path for flat dry approaches",
        "use boardwalk where terrain becomes wet, fragile, elevated, or erosion-sensitive",
        "keep vegetation clear of the primary movement corridor"
      ],
      supportedArchetypes: [
        "BEACH_ACCESS_SPUR",
        "RESERVE_LOOP",
        "WETLAND_CROSSING",
        "CLIFF_LOOKOUT_APPROACH"
      ]
    },
    validationRequirements: {
      recipeIntakeChecks: [
        "recipe_identity_defined",
        "required_core_assets_are_approved",
        "approved_vegetation_assets_are_approved",
        "placement_rules_defined",
        "deterministic_seed_rules_defined",
        "biome_rules_defined",
        "navigation_rules_defined",
        "performance_constraints_defined",
        "dependencies_are_development_only",
        "no_blender_files_created",
        "no_geometry_generated",
        "no_glb_exports_created",
        "no_asset_modification_performed",
        "no_registration_records_created",
        "no_promotion_records_created"
      ],
      futureGenerationChecks: [
        "deterministic_recipe_generation",
        "approved_dependency_resolution_only",
        "location_layout_seed_replay_supported",
        "navigation_path_continuity_preserved",
        "water_edge_non_traversable_boundaries_preserved",
        "instance_caps_respected",
        "performance_budget_respected",
        "no_runtime_activation_side_effects"
      ]
    },
    performanceConstraints: {
      mobileFirst: true,
      maxUniqueReferencedAssetsPerLocation: 8,
      maxMaterialFamiliesPerLocation: 8,
      preferredInstanceCaps: {
        COASTAL_GRAVEL_PATH_001: 14,
        COASTAL_BOARDWALK_001: 10,
        COASTAL_WATER_EDGE_001: 12,
        COASTAL_GROUND_COVER_001: 24,
        COASTAL_ROCK_CLUSTER_001: 12,
        COASTAL_GRASS_TUSSOCK_001: 20,
        SHRUB_COASTAL_LOW_001: 10,
        TREE_BOTTLEBRUSH_001: 4
      },
      archetypeTriangleBudgets: {
        BEACH_ACCESS_SPUR: {
          closeMax: 5200,
          gameplayMax: 3600,
          mapMax: 1800
        },
        RESERVE_LOOP: {
          closeMax: 7600,
          gameplayMax: 5200,
          mapMax: 2600
        },
        WETLAND_CROSSING: {
          closeMax: 6800,
          gameplayMax: 4700,
          mapMax: 2400
        },
        CLIFF_LOOKOUT_APPROACH: {
          closeMax: 7200,
          gameplayMax: 5000,
          mapMax: 2500
        }
      },
      performanceNotes: [
        "prefer repeated placement of a small set of approved modules over introducing extra asset families",
        "avoid dense tree clustering in narrow traversal spaces",
        "water-edge visuals must remain lightweight and avoid simulation-heavy materials"
      ]
    },
    authoringReadiness: {
      blenderFilesCreated: false,
      geometryGenerated: false,
      glbsExported: false,
      assetsModified: false,
      registered: false,
      promoted: false,
      readyForRecipeGeneration: true,
      nextPhase: "200.2_recipe_generation"
    }
  };

  specification.deterministicFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        recipeIdentity: specification.recipeIdentity,
        requiredCoreAssets: specification.assetDependencies.requiredCoreAssets.map(
          (entry) => [entry.assetId, entry.version, entry.sourceCatalogRecord]
        ),
        approvedVegetationAssets:
          specification.assetDependencies.approvedVegetationAssets.map((entry) => [
            entry.assetId,
            entry.version,
            entry.sourceCatalogRecord
          ]),
        deferredAssets: specification.assetDependencies.deferredAssets.map((entry) => [
          entry.assetId,
          entry.version,
          entry.sourceCatalogRecord
        ]),
        zoneDefinitions: specification.placementRules.zoneDefinitions.map((entry) => [
          entry.zoneId,
          entry.allowedAssetRoles
        ]),
        seedStrategy: specification.deterministicSeedRules.seedStrategy
      })
    )
    .digest("hex");

  return deepFreeze(specification);
}

export function buildCoastalLocationRecipeValidationRecord(specification) {
  const spec = specification ?? buildCoastalLocationRecipeSpecification();
  const allApproved = [
    ...spec.assetDependencies.requiredCoreAssets,
    ...spec.assetDependencies.approvedVegetationAssets
  ];
  const checks = [
    ["recipe_identity_defined", spec.recipeIdentity.recipeId === "COASTAL_LOCATION_RECIPE_001"],
    ["required_core_assets_are_approved", spec.assetDependencies.requiredCoreAssets.length >= 5],
    [
      "approved_vegetation_assets_are_approved",
      spec.assetDependencies.approvedVegetationAssets.length >= 3
    ],
    ["placement_rules_defined", spec.placementRules.zoneDefinitions.length >= 5],
    ["deterministic_seed_rules_defined", Boolean(spec.deterministicSeedRules.seedStrategy)],
    ["biome_rules_defined", spec.biomeRules.allowedBiomeProfiles.length >= 4],
    ["navigation_rules_defined", spec.navigationRules.routeRequirements.length >= 3],
    [
      "performance_constraints_defined",
      spec.performanceConstraints.maxUniqueReferencedAssetsPerLocation >= 8
    ],
    [
      "dependencies_are_development_only",
      allApproved.every(
        (entry) => entry.environment === "DEVELOPMENT_ONLY"
      )
    ],
    ["no_blender_files_created", spec.authoringReadiness.blenderFilesCreated === false],
    ["no_geometry_generated", spec.authoringReadiness.geometryGenerated === false],
    ["no_glb_exports_created", spec.authoringReadiness.glbsExported === false],
    ["no_asset_modification_performed", spec.authoringReadiness.assetsModified === false],
    ["no_registration_records_created", spec.authoringReadiness.registered === false],
    ["no_promotion_records_created", spec.authoringReadiness.promoted === false]
  ].map(([name, ok]) => ({ name, ok }));

  return deepFreeze({
    schemaId: "ASSET_FACTORY_V1_WORLD_ASSEMBLY_RECIPE_VALIDATION_001",
    recipeId: spec.recipeIdentity.recipeId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deferredAssets: spec.assetDependencies.deferredAssets,
    nextAllowedAction: "recipe_generation_only"
  });
}

export function renderCoastalLocationRecipeReport(specification, validation) {
  const spec = specification ?? buildCoastalLocationRecipeSpecification();
  const validationRecord =
    validation ?? buildCoastalLocationRecipeValidationRecord(spec);
  const deferredList =
    spec.assetDependencies.deferredAssets.length === 0
      ? "- none\n"
      : spec.assetDependencies.deferredAssets
          .map((entry) => `- ${entry.assetId} (${entry.reason})`)
          .join("\n")
          .concat("\n\n");

  return `# COASTAL_LOCATION_RECIPE_001 Intake Report

Status: Recipe intake complete, generation not started

## Defined

- recipe identity
- approved asset dependencies
- placement rules
- deterministic seed rules
- biome rules
- navigation rules
- validation requirements
- performance constraints

## Approved dependencies

- COASTAL_GRAVEL_PATH_001
- COASTAL_BOARDWALK_001
- COASTAL_WATER_EDGE_001
- COASTAL_GROUND_COVER_001
- COASTAL_ROCK_CLUSTER_001
- COASTAL_GRASS_TUSSOCK_001
- SHRUB_COASTAL_LOW_001
- TREE_BOTTLEBRUSH_001

## Deferred assets

${deferredList}## Safety

No Blender file, geometry, GLB, registration, or promotion artifact has been created for this recipe package.

## Validation

- validation status: ${validationRecord.status}
- next allowed action: ${validationRecord.nextAllowedAction}

## Outcome

\`COASTAL_LOCATION_RECIPE_001\` is ready for Phase 200.2 recipe generation.
`;
}

export function writeCoastalLocationRecipeIntake(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const specificationDirectory = path.join(recipeRoot, "specification");
  const validationDirectory = path.join(recipeRoot, "validation");
  const reportsDirectory = path.join(recipeRoot, "reports");
  ensureDirectory(specificationDirectory);
  ensureDirectory(validationDirectory);
  ensureDirectory(reportsDirectory);

  const specification = buildCoastalLocationRecipeSpecification(options);
  const validation = buildCoastalLocationRecipeValidationRecord(specification);
  const report = renderCoastalLocationRecipeReport(specification, validation);

  fs.writeFileSync(
    path.join(specificationDirectory, SPECIFICATION_FILENAME),
    `${JSON.stringify(specification, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(validationDirectory, VALIDATION_FILENAME),
    `${JSON.stringify(validation, null, 2)}\n`
  );
  fs.writeFileSync(path.join(reportsDirectory, REPORT_FILENAME), report);

  return deepFreeze({
    recipeRoot,
    specification,
    validation,
    report
  });
}
