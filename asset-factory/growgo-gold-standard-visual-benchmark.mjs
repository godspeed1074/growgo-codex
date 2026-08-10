import { createHash } from "node:crypto";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

export const growGoGoldStandardVisualAssetSetSchemaId =
  "GROWGO_GOLD_STANDARD_VISUAL_ASSET_SET_001";

export const growGoGoldStandardVisualBenchmarkDefinition = deepFreeze({
  benchmarkSetId: "GROWGO_GOLD_STANDARD_VISUAL_ASSET_SET_001",
  benchmarkStatus: "tree_gold_standard_approved_shrub_building_pending",
  scope: "DEVELOPER_ONLY_ASSET_FACTORY_BENCHMARK",
  phaseFocus: "FIRST_GROWGO_GOLD_STANDARD_VISUAL_ASSET_SET",
  lockedRendererFoundationRequired: true,
  massGenerationAllowed: false,
  productionPublishAllowed: false,
  historicalOverwriteForbidden: true,
  benchmarkVisualIssuesFound: deepFreeze([
    "shared-scene proof assets are technically functional but visually below the desired GrowGo quality bar",
    "cross-category cohesion between tree, shrub, and small-building assets is not yet strong enough to define the Gold Standard benchmark",
    "pavilion required developer-only live-render calibration to avoid dominating adjacent vegetation",
    "shrub family previously required a protected revision because the earlier silhouette read as pancaked and flowers were not readable enough",
    "tree benchmark has been approved and now defines the Gold Standard tree baseline, while shrub and building benchmark categories still need their own operator-reviewed Gold Standard revisions"
  ]),
  benchmarkVisualRules: deepFreeze({
    silhouette: deepFreeze([
      "immediately readable at normal gameplay zoom",
      "not visually pancaked from the fixed north-up oblique camera",
      "category identity remains obvious from live-map inspection"
    ]),
    proportions: deepFreeze([
      "works with GrowGo north-up oblique camera",
      "believable height and width relative to the other benchmark assets",
      "building, shrub, and tree can share one scene without one category overwhelming the others"
    ]),
    colour: deepFreeze([
      "curated region-appropriate palette",
      "no hyper-real or noisy colour variation",
      "palette cohesion must hold across all three benchmark assets"
    ]),
    geometry: deepFreeze([
      "mobile-lightweight geometry only",
      "dimensional enough to read clearly in true 3D",
      "no invisible micro-detail",
      "stable LOD and export path required"
    ]),
    materials: deepFreeze([
      "simple stylized materials",
      "papercut 2.5D feel over photorealism",
      "clean shapes and restrained surface breakup"
    ]),
    liveMapReadability: deepFreeze([
      "must remain readable on the attached live GrowGo map",
      "must remain geographically believable through pan and zoom",
      "must remain visually cohesive when multiple categories share one scene"
    ])
  }),
  benchmarkAssets: deepFreeze([
    deepFreeze({
      benchmarkCategory: "tree",
      assetId: "TREE_EUCALYPTUS_001",
      selectedCurrentVersion: "v002",
      currentLifecycleStatus: "gold_standard_operator_approved",
      familyId: "COASTAL_NATURE_FAMILY_001",
      selectionReason:
        "Eucalyptus is already wired through the live Atlas GLB proof, preserves a permanent asset identity, and is the safest tree family to elevate into the Gold Standard pass.",
      liveMapIssuesToResolve: deepFreeze([
        "must now remain the visual benchmark that shrub and small-building revisions are judged against",
        "historical v001 material must remain preserved for comparison and provenance",
        "future revisions must preserve the approved live-map geographic anchoring and readability baseline"
      ]),
      protectedRevisionPlan: deepFreeze({
        targetRevisionVersion: "v002",
        revisionMode: "protected_visual_revision",
        overwriteHistoricalVersionsForbidden: true,
        authoringWorkflow: "ASSET_FACTORY_REVISION_WORKFLOW",
        reviewCheckpointRequired: true,
        expectedOutputs: deepFreeze([
          "TREE_EUCALYPTUS_001_v002.blend",
          "TREE_EUCALYPTUS_001_v002_LOD_CLOSE.glb",
          "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb",
          "TREE_EUCALYPTUS_001_v002_LOD_MAP.glb"
        ])
      }),
      operatorApprovalStatus: "APPROVED_GOLD_STANDARD",
      goldStandardApprovalRecord: deepFreeze({
        approvedVersion: "v002",
        gameplayGlb: "TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb",
        gameplayGlbRelativePath:
          "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/TREE_EUCALYPTUS_001_v002_LOD_GAMEPLAY.glb",
        operatorApprovalSurface: "REAL_GROWGO_MAP",
        operatorApprovalCamera: "NORTH_UP_OBLIQUE_ATLAS_CAMERA",
        geographicAnchoringVerified: true,
        livePanZoomVerified: true,
        approvalScaleMultiplier: 1,
        historicalVersionPreserved: "v001"
      })
    }),
    deepFreeze({
      benchmarkCategory: "shrub",
      assetId: "SHRUB_COASTAL_LOW_001",
      selectedCurrentVersion: "v002",
      currentLifecycleStatus: "approved_active_development_revision",
      familyId: "COASTAL_SHRUB_FAMILY_001",
      selectionReason:
        "The shrub already has a protected v002 refinement path that fixed the earlier pancaked silhouette, making it the clearest low-landscape family to push from technically approved into Gold Standard quality.",
      liveMapIssuesToResolve: deepFreeze([
        "needs confirmation that the improved silhouette still reads cleanly beside the Gold Standard tree and building",
        "flower and canopy readability must remain clear from normal gameplay zoom",
        "must avoid sinking into the scene as indistinct ground clutter"
      ]),
      protectedRevisionPlan: deepFreeze({
        targetRevisionVersion: "v003",
        revisionMode: "protected_visual_revision",
        overwriteHistoricalVersionsForbidden: true,
        authoringWorkflow: "ASSET_FACTORY_REVISION_WORKFLOW",
        reviewCheckpointRequired: true,
        expectedOutputs: deepFreeze([
          "SHRUB_COASTAL_LOW_001_v003.blend",
          "SHRUB_COASTAL_LOW_001_v003_LOD_CLOSE.glb",
          "SHRUB_COASTAL_LOW_001_v003_LOD_GAMEPLAY.glb",
          "SHRUB_COASTAL_LOW_001_v003_LOD_MAP.glb"
        ])
      }),
      operatorApprovalStatus: "PENDING_GOLD_STANDARD_REVIEW"
    }),
    deepFreeze({
      benchmarkCategory: "building",
      assetId: "BUILDING_CIVIC_SPORTS_PAVILION_001",
      selectedCurrentVersion: "1.0.0",
      currentLifecycleStatus: "visually_approved_for_development_preview",
      familyId: "CIVIC_SPORTS_PAVILION_FAMILY_001",
      selectionReason:
        "The pavilion is already proven on the live Atlas shared renderer, gives us a small-building category with stable identity, and is the most practical building family to refine without reopening renderer work.",
      liveMapIssuesToResolve: deepFreeze([
        "must stop visually dominating adjacent vegetation without relying on ad hoc calibration alone",
        "must read as a small sports pavilion at normal inspection zoom",
        "materials and proportions must align with the final GrowGo Gold Standard style rather than only the technical proof scene"
      ]),
      protectedRevisionPlan: deepFreeze({
        targetRevisionVersion: "1.1.0",
        revisionMode: "protected_visual_revision",
        overwriteHistoricalVersionsForbidden: true,
        authoringWorkflow: "ASSET_FACTORY_REVISION_WORKFLOW",
        reviewCheckpointRequired: true,
        expectedOutputs: deepFreeze([
          "BUILDING_CIVIC_SPORTS_PAVILION_001_v110.blend",
          "BUILDING_CIVIC_SPORTS_PAVILION_001_v110_LOD_CLOSE.glb",
          "BUILDING_CIVIC_SPORTS_PAVILION_001_v110_LOD_GAMEPLAY.glb",
          "BUILDING_CIVIC_SPORTS_PAVILION_001_v110_LOD_MAP.glb"
        ]),
        provisionalLiveRendererObservation: deepFreeze({
          pavilionScaleMultiplier: 0.62,
          pavilionTargetHeightMeters: 3.6,
          observationOnly: true,
          universalProductionRule: false
        })
      }),
      operatorApprovalStatus: "PENDING_GOLD_STANDARD_REVIEW"
    })
  ]),
  operatorApprovalPolicy: deepFreeze({
    perAssetCheckpointRequired: true,
    benchmarkSetApprovalRequiresAllThreeAssetsApproved: true,
    automaticApprovalForbidden: true
  }),
  runtimeSafety: deepFreeze({
    lifecycleExecutionEnabled: false,
    mapAttachmentAllowed: false,
    automaticRendererExecutionAllowed: false,
    runtimeExecutionEnabled: false
  })
});

export function getGrowGoGoldStandardVisualBenchmarkSet(
  rawDefinition = growGoGoldStandardVisualBenchmarkDefinition
) {
  const definition = normalizeDefinition(rawDefinition);
  return deepFreeze({
    schemaId: growGoGoldStandardVisualAssetSetSchemaId,
    benchmarkSetId: definition.benchmarkSetId,
    benchmarkStatus: definition.benchmarkStatus,
    scope: definition.scope,
    phaseFocus: definition.phaseFocus,
    benchmarkVisualIssuesFound: definition.benchmarkVisualIssuesFound,
    benchmarkVisualRules: definition.benchmarkVisualRules,
    benchmarkAssets: definition.benchmarkAssets,
    operatorApprovalPolicy: definition.operatorApprovalPolicy,
    runtimeSafety: definition.runtimeSafety,
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          benchmarkSetId: definition.benchmarkSetId,
          benchmarkAssets: definition.benchmarkAssets,
          benchmarkVisualRules: definition.benchmarkVisualRules,
          operatorApprovalPolicy: definition.operatorApprovalPolicy,
          runtimeSafety: definition.runtimeSafety
        })
      )
      .digest("hex")
  });
}

export function validateGrowGoGoldStandardVisualBenchmarkSet(
  rawDefinition = growGoGoldStandardVisualBenchmarkDefinition
) {
  const definition = normalizeDefinition(rawDefinition);
  const errors = [];

  if (definition.benchmarkAssets.length !== 3) {
    errors.push("Gold Standard benchmark set must contain exactly three assets.");
  }

  const categories = definition.benchmarkAssets.map((asset) => asset.benchmarkCategory);
  const uniqueCategories = new Set(categories);
  if (uniqueCategories.size !== categories.length) {
    errors.push("Gold Standard benchmark categories must be unique.");
  }

  for (const requiredCategory of ["tree", "shrub", "building"]) {
    if (!uniqueCategories.has(requiredCategory)) {
      errors.push(`Missing required benchmark category: ${requiredCategory}.`);
    }
  }

  for (const asset of definition.benchmarkAssets) {
    if (!asset.assetId || typeof asset.assetId !== "string") {
      errors.push(`Benchmark asset is missing a valid assetId for ${asset.benchmarkCategory}.`);
    }
    if (!asset.protectedRevisionPlan?.overwriteHistoricalVersionsForbidden) {
      errors.push(`Historical version protection must remain enabled for ${asset.assetId}.`);
    }
    if (!asset.protectedRevisionPlan?.reviewCheckpointRequired) {
      errors.push(`Operator review checkpoint is required for ${asset.assetId}.`);
    }
    const allowedApprovalStates = new Set([
      "PENDING_GOLD_STANDARD_REVIEW",
      "APPROVED_GOLD_STANDARD"
    ]);
    if (!allowedApprovalStates.has(asset.operatorApprovalStatus)) {
      errors.push(
        `Unexpected operator approval status for ${asset.assetId}: ${asset.operatorApprovalStatus}.`
      );
    }
    if (
      asset.benchmarkCategory === "tree" &&
      asset.operatorApprovalStatus === "APPROVED_GOLD_STANDARD"
    ) {
      if (asset.selectedCurrentVersion !== "v002") {
        errors.push("Gold Standard tree approval must point to TREE_EUCALYPTUS_001@v002.");
      }
      if (asset.currentLifecycleStatus !== "gold_standard_operator_approved") {
        errors.push("Gold Standard tree lifecycle status must record operator approval.");
      }
      if (!asset.goldStandardApprovalRecord?.geographicAnchoringVerified) {
        errors.push("Gold Standard tree approval must preserve geographic anchoring proof.");
      }
      if (asset.goldStandardApprovalRecord?.historicalVersionPreserved !== "v001") {
        errors.push("Gold Standard tree approval must preserve TREE_EUCALYPTUS_001@v001.");
      }
    }
  }

  if (!definition.operatorApprovalPolicy?.perAssetCheckpointRequired) {
    errors.push("Per-asset operator checkpoints must remain required.");
  }
  if (!definition.operatorApprovalPolicy?.automaticApprovalForbidden) {
    errors.push("Automatic benchmark approval must remain forbidden.");
  }

  const valid = errors.length === 0;
  return deepFreeze({
    schemaId: "GROWGO_GOLD_STANDARD_VISUAL_ASSET_SET_VALIDATION_001",
    benchmarkSetId: definition.benchmarkSetId,
    valid,
    errors: deepFreeze(errors),
    benchmarkAssetCount: definition.benchmarkAssets.length,
    benchmarkCategories: deepFreeze([...uniqueCategories]),
    deterministicFingerprint: createHash("sha256")
      .update(JSON.stringify({ benchmarkSetId: definition.benchmarkSetId, errors, valid }))
      .digest("hex")
  });
}

function normalizeDefinition(rawDefinition) {
  if (!rawDefinition || typeof rawDefinition !== "object") {
    throw new TypeError("GrowGo Gold Standard visual benchmark definition must be an object.");
  }
  return rawDefinition;
}
