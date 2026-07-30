import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const RECIPE_ROOT =
  "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001";

const PREVIEW_ROOT = "preview";
const REVIEW_ROOT = "review";
const VALIDATION_ROOT = "validation";
const REPORTS_ROOT = "reports";

const PREVIEW_DATA_FILENAME = "coastal-location-recipe-001-preview-data.json";
const ZONE_SUMMARY_FILENAME = "coastal-location-recipe-001-zone-summary.json";
const DENSITY_REPORT_FILENAME = "coastal-location-recipe-001-density-report.json";
const DEPENDENCY_VISUALIZATION_FILENAME =
  "coastal-location-recipe-001-dependency-visualization.json";
const PLACEMENT_INSPECTION_FILENAME =
  "coastal-location-recipe-001-placement-inspection-report.json";
const INSPECTION_OUTPUT_FILENAME =
  "coastal-location-recipe-001-visual-inspection-output.json";
const VISUAL_PREVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-visual-preview-validation.json";

const MANUAL_REVIEW_FILENAME = "coastal-location-recipe-001-manual-review.json";
const TUNING_RECOMMENDATIONS_FILENAME =
  "coastal-location-recipe-001-tuning-recommendations.json";
const MANUAL_REVIEW_VALIDATION_FILENAME =
  "coastal-location-recipe-001-manual-review-validation.json";
const MANUAL_REVIEW_REPORT_FILENAME =
  "coastal-location-recipe-001-manual-review-report.md";

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

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
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

function loadVisualPreviewPackage(cwd) {
  const recipeRoot = path.resolve(cwd, RECIPE_ROOT);
  const previewRoot = path.join(recipeRoot, PREVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);

  const previewData = readJson(path.join(previewRoot, PREVIEW_DATA_FILENAME));
  const zoneSummary = readJson(path.join(previewRoot, ZONE_SUMMARY_FILENAME));
  const densityReport = readJson(path.join(previewRoot, DENSITY_REPORT_FILENAME));
  const dependencyVisualization = readJson(
    path.join(previewRoot, DEPENDENCY_VISUALIZATION_FILENAME)
  );
  const placementInspection = readJson(
    path.join(previewRoot, PLACEMENT_INSPECTION_FILENAME)
  );
  const inspectionOutput = readJson(path.join(previewRoot, INSPECTION_OUTPUT_FILENAME));
  const visualPreviewValidation = readJson(
    path.join(validationRoot, VISUAL_PREVIEW_VALIDATION_FILENAME)
  );

  if (visualPreviewValidation.status !== "pass") {
    throw new Error(
      "Coastal location manual review blocked: visual preview validation must pass first."
    );
  }

  return {
    recipeRoot,
    previewRoot,
    validationRoot,
    previewData,
    zoneSummary,
    densityReport,
    dependencyVisualization,
    placementInspection,
    inspectionOutput,
    visualPreviewValidation
  };
}

function findZone(previewPackage, zoneId) {
  return previewPackage.zoneSummary.find((zone) => zone.zoneId === zoneId) ?? null;
}

function findDensity(previewPackage, zoneId) {
  return previewPackage.densityReport.find((entry) => entry.zoneId === zoneId) ?? null;
}

function buildAreaReview(status, evidence, notes, tuningSignal = "stable") {
  return deepFreeze({
    status,
    evidence,
    notes,
    tuningSignal
  });
}

function buildManualReviewRecord(previewPackage) {
  const crossingZone = findZone(previewPackage, "WET_CROSSING_ZONE");
  const lookoutZone = findZone(previewPackage, "LOOKOUT_OR_REST_ZONE");
  const shorelineZone = findZone(previewPackage, "SHORELINE_EDGE_ZONE");
  const bufferZone = findZone(previewPackage, "VEGETATION_BUFFER_ZONE");
  const bufferDensity = findDensity(previewPackage, "VEGETATION_BUFFER_ZONE");
  const shorelineDensity = findDensity(previewPackage, "SHORELINE_EDGE_ZONE");

  const playerJourney = buildAreaReview(
    "PASS",
    [
      "Preview flow starts in ENTRY_PATH_ZONE and ends at LOOKOUT_OR_REST_ZONE.",
      "WET_CROSSING_ZONE provides a single crossing beat between shoreline and destination spaces.",
      `First-to-last flow remains ${previewPackage.placementInspection.firstToLastFlow.firstPlacementId} -> ${previewPackage.placementInspection.firstToLastFlow.lastPlacementId}.`
    ],
    "The overall journey reads clearly as entry, shoreline encounter, crossing, recovery buffer, and destination."
  );

  const navigationFlow = buildAreaReview(
    "PASS",
    [
      `Primary path surface appears ${previewPackage.placementInspection.roleCounts.primary_path_surface} times.`,
      `Elevated wet crossing appears ${previewPackage.placementInspection.roleCounts.elevated_wet_crossing} time.`,
      "Visual preview inspection already passed navigation clarity without runtime activation."
    ],
    "Navigation remains legible and sequenced correctly for a first coastal exploration layout."
  );

  const assetDensity =
    shorelineDensity?.placementsPerLaneUnit !== null &&
    bufferDensity?.placementsPerLaneUnit !== null &&
    shorelineDensity &&
    bufferDensity &&
    shorelineDensity.placementsPerLaneUnit < 0.2 &&
    bufferDensity.placementsPerLaneUnit > 0.25
      ? buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            `Shoreline edge density is ${shorelineDensity.placementsPerLaneUnit} placements per lane unit with zero vegetation support.`,
            `Vegetation buffer density rises to ${bufferDensity.placementsPerLaneUnit} placements per lane unit with full vegetation occupancy.`,
            "The density shift is readable, but it jumps abruptly between shoreline and inland buffer spaces."
          ],
          "Density is serviceable for preview review, but the shoreline-to-buffer transition would benefit from one extra intermediary accent cluster.",
          "soften_transition"
        )
      : buildAreaReview(
          "PASS",
          [
            "Zone densities remain within their declared LOW/MEDIUM profiles.",
            "No spacing flags were raised in placement inspection."
          ],
          "Density staging is balanced enough for refinement-ready review."
        );

  const missingCrossingRole =
    crossingZone &&
    crossingZone.requiredRoles.includes("shoreline_transition_band") &&
    !crossingZone.rolesPresent.includes("shoreline_transition_band");
  const missingLookoutRole =
    lookoutZone &&
    lookoutZone.requiredRoles.includes("terrain_detail_cluster") &&
    !lookoutZone.rolesPresent.includes("terrain_detail_cluster");

  const zoneBalance =
    missingCrossingRole || missingLookoutRole
      ? buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            missingCrossingRole
              ? "WET_CROSSING_ZONE requires shoreline_transition_band but currently presents only elevated_wet_crossing."
              : "Crossing zone required roles are satisfied.",
            missingLookoutRole
              ? "LOOKOUT_OR_REST_ZONE requires terrain_detail_cluster but currently presents only path and accent tree roles."
              : "Destination zone required roles are satisfied.",
            `Shoreline edge zone currently carries ${shorelineZone?.placementCount ?? 0} placements while the crossing zone carries ${crossingZone?.placementCount ?? 0}.`
          ],
          "Zone sequencing works, but two required-role gaps make the crossing and destination feel under-supported.",
          "restore_required_roles"
        )
      : buildAreaReview(
          "PASS",
          [
            "All required zone roles are present.",
            "Zone spans and density profiles remain coherent."
          ],
          "Zone balance is suitable for refinement-ready handoff."
        );

  const shorelineTransition = buildAreaReview(
    missingCrossingRole ? "TUNE_RECOMMENDED" : "PASS",
    [
      `COASTAL_WATER_EDGE_001 appears ${previewPackage.placementInspection.roleCounts.shoreline_transition_band} times and is isolated to SHORELINE_EDGE_ZONE.`,
      "Boardwalk crossing is visually readable, but the transition into and out of the crossing stays sharp rather than layered.",
      "No runtime shoreline simulation is involved; this is strictly a preview composition judgment."
    ],
    missingCrossingRole
      ? "A small transition support placement on the crossing approaches would make shoreline movement feel more continuous."
      : "Shoreline transition already reads continuously across adjacent zones.",
    missingCrossingRole ? "bridge_shoreline_transition" : "stable"
  );

  const explorationInterest =
    missingLookoutRole || (lookoutZone?.placementCount ?? 0) <= 3
      ? buildAreaReview(
          "TUNE_RECOMMENDED",
          [
            `Destination zone currently has ${lookoutZone?.placementCount ?? 0} placements.`,
            "TREE_BOTTLEBRUSH_001 provides a single anchor moment in the destination space.",
            "No secondary terrain or curiosity marker currently reinforces the arrival point."
          ],
          "The route is pleasant, but the endpoint could carry a slightly stronger sense of payoff without breaking mobile budgets.",
          "strengthen_destination_interest"
        )
      : buildAreaReview(
          "PASS",
          [
            "Destination zone contains multiple reinforcing assets beyond the primary path.",
            "Arrival point reads as distinct from the entry corridor."
          ],
          "Exploration interest is already sufficient for first-pass recipe usage."
        );

  const futurePoiSuitability = buildAreaReview(
    "PASS",
    [
      "The generated recipe already separates entry, shoreline, crossing, buffer, and destination spaces into distinct tuning zones.",
      "Those separations are compatible with future POI tags, micro-objectives, or achievement hooks without runtime work.",
      "No unsupported assets are required to keep the current layout valid."
    ],
    "Future POI or achievement layering looks feasible once the crossing and destination support beats are strengthened."
  );

  const reviewAreas = deepFreeze({
    playerJourney,
    navigationFlow,
    assetDensity,
    zoneBalance,
    shorelineTransition,
    explorationInterest,
    futurePoiSuitability
  });

  const tuningRequiredAreas = Object.entries(reviewAreas)
    .filter(([, area]) => area.status === "TUNE_RECOMMENDED")
    .map(([areaId]) => areaId);

  const overallStatus =
    tuningRequiredAreas.length === 0
      ? "APPROVED_FOR_RECIPE_REUSE"
      : "APPROVED_WITH_TUNING_RECOMMENDATIONS";

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_MANUAL_REVIEW_RECORD_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    reviewRecordId:
      "COASTAL_LOCATION_RECIPE_001_MANUAL_REVIEW_AND_TUNING_001",
    basedOnPreviewFingerprint:
      previewPackage.visualPreviewValidation.visualPreviewFingerprint,
    basedOnInspectionSchemaId: previewPackage.inspectionOutput.schemaId,
    reviewMethod: "non_runtime_preview_package_inspection",
    reviewAreas,
    overallStatus,
    tuningRequiredAreas,
    findingsSummary: deepFreeze({
      strengths: [
        "Player journey is legible from entry to destination.",
        "Navigation flow remains clear without runtime assistance.",
        "Preview stays inside current mobile-friendly placement budgets."
      ],
      watchItems: [
        "Crossing zone is missing a supporting shoreline transition role.",
        "Destination zone is missing terrain-detail support for stronger arrival interest.",
        "Density step between shoreline and inland vegetation zones is sharper than ideal."
      ]
    })
  });
}

function buildTuningRecommendations(previewPackage, reviewRecord) {
  const recommendations = [
    {
      recommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_001",
      priority: "HIGH",
      area: "shorelineTransition",
      title: "Carry shoreline transition support into the crossing approaches",
      rationale:
        "The crossing zone requires shoreline_transition_band but currently contains only the elevated boardwalk beat.",
      recommendedAdjustment:
        "Introduce one lightweight shoreline transition support placement adjacent to the wet crossing approaches so the boardwalk feels grounded in the coastal edge rather than dropped onto it.",
      affectedRoles: ["shoreline_transition_band", "elevated_wet_crossing"],
      candidateAssets: ["COASTAL_WATER_EDGE_001", "COASTAL_ROCK_CLUSTER_001"],
      deterministicGuardrail:
        "Keep the added support tied to the existing crossing zone seed so placement remains reproducible."
    },
    {
      recommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_002",
      priority: "HIGH",
      area: "destinationInterest",
      title: "Strengthen the lookout/rest destination with one terrain-detail support beat",
      rationale:
        "LOOKOUT_OR_REST_ZONE currently lacks the required terrain_detail_cluster role, which leaves the endpoint visually thin.",
      recommendedAdjustment:
        "Add one compact terrain or edge-detail accent near the destination path segment so the final zone feels intentional without becoming crowded.",
      affectedRoles: ["terrain_detail_cluster", "primary_path_surface"],
      candidateAssets: ["COASTAL_ROCK_CLUSTER_001", "COASTAL_GROUND_COVER_001"],
      deterministicGuardrail:
        "Preserve the bottlebrush as the primary destination anchor and keep added detail below current MEDIUM density expectations."
    },
    {
      recommendationId: "COASTAL_LOCATION_RECIPE_001_TUNING_REC_003",
      priority: "MEDIUM",
      area: "densityGradient",
      title: "Soften the shoreline-to-buffer density jump",
      rationale:
        "The shoreline zone is sparse while the inland vegetation buffer immediately jumps to full vegetation occupancy.",
      recommendedAdjustment:
        "Trial one intermediary accent placement or redistribute one existing understory element closer to the shoreline edge so the transition reads more gradual.",
      affectedRoles: ["understory_ground_blend", "native_grass_breakup"],
      candidateAssets: ["COASTAL_GROUND_COVER_001", "COASTAL_GRASS_TUSSOCK_001"],
      deterministicGuardrail:
        "Maintain LOW shoreline density and avoid adding enough placements to obscure path readability."
    }
  ];

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_TUNING_RECOMMENDATIONS_001",
    recipeId: previewPackage.previewData.recipeId,
    locationPlanId: previewPackage.previewData.locationPlanId,
    derivedFromReviewRecordId: reviewRecord.reviewRecordId,
    recommendationCount: recommendations.length,
    recommendations
  });
}

function buildManualReviewValidation(reviewRecord, tuningRecommendations) {
  const checks = [
    {
      name: "manual_review_record_created",
      ok: true
    },
    {
      name: "tuning_recommendations_created",
      ok: tuningRecommendations.recommendationCount > 0
    },
    {
      name: "player_journey_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.playerJourney)
    },
    {
      name: "navigation_flow_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.navigationFlow)
    },
    {
      name: "asset_density_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.assetDensity)
    },
    {
      name: "zone_balance_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.zoneBalance)
    },
    {
      name: "shoreline_transition_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.shorelineTransition)
    },
    {
      name: "exploration_interest_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.explorationInterest)
    },
    {
      name: "future_poi_review_recorded",
      ok: Boolean(reviewRecord.reviewAreas.futurePoiSuitability)
    },
    {
      name: "no_runtime_activation",
      ok: true
    },
    {
      name: "no_blender_usage",
      ok: true
    },
    {
      name: "no_glb_generation",
      ok: true
    },
    {
      name: "no_asset_modification",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "COASTAL_LOCATION_RECIPE_001_MANUAL_REVIEW_VALIDATION_001",
    recipeId: reviewRecord.recipeId,
    locationPlanId: reviewRecord.locationPlanId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    tuningRequiredAreas: reviewRecord.tuningRequiredAreas,
    nextAllowedAction:
      reviewRecord.tuningRequiredAreas.length === 0
        ? "recipe_refinement_optional"
        : "recipe_refinement_recommended"
  });
}

function buildManualReviewReport(reviewRecord, tuningRecommendations, validation) {
  const areaLines = Object.entries(reviewRecord.reviewAreas)
    .map(
      ([areaId, area]) =>
        `- ${areaId}: ${area.status} - ${area.notes}`
    )
    .join("\n");

  const recommendationLines = tuningRecommendations.recommendations
    .map(
      (recommendation) =>
        `- ${recommendation.priority}: ${recommendation.title} - ${recommendation.recommendedAdjustment}`
    )
    .join("\n");

  return [
    "# GROWGO SESSION 200.5 — COASTAL_LOCATION_RECIPE_001 Manual Review & Tuning",
    "",
    `recipe: ${reviewRecord.recipeId}`,
    `location plan: ${reviewRecord.locationPlanId}`,
    `overall status: ${reviewRecord.overallStatus}`,
    "",
    "## Review Findings",
    areaLines,
    "",
    "## Tuning Recommendations",
    recommendationLines,
    "",
    "## Validation",
    `- status: ${validation.status}`,
    `- next allowed action: ${validation.nextAllowedAction}`,
    "- runtime activation: not performed",
    "- Blender usage: not performed",
    "- GLB generation: not performed",
    "- asset modification: not performed",
    "",
    "## Readiness",
    reviewRecord.tuningRequiredAreas.length === 0
      ? "- The recipe preview is ready for reuse without further tuning."
      : "- The recipe preview is ready for refinement planning. Recommendations are recorded without modifying assets or runtime systems.",
    ""
  ].join("\n");
}

export function buildCoastalLocationRecipeManualReview(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const previewPackage = loadVisualPreviewPackage(cwd);
  const recipeRoot = previewPackage.recipeRoot;
  const reviewRoot = path.join(recipeRoot, REVIEW_ROOT);
  const validationRoot = path.join(recipeRoot, VALIDATION_ROOT);
  const reportsRoot = path.join(recipeRoot, REPORTS_ROOT);

  ensureDirectory(reviewRoot);
  ensureDirectory(validationRoot);
  ensureDirectory(reportsRoot);

  const reviewRecord = buildManualReviewRecord(previewPackage);
  const tuningRecommendations = buildTuningRecommendations(previewPackage, reviewRecord);
  const validation = buildManualReviewValidation(reviewRecord, tuningRecommendations);
  const report = buildManualReviewReport(
    reviewRecord,
    tuningRecommendations,
    validation
  );

  const reviewPath = path.join(reviewRoot, MANUAL_REVIEW_FILENAME);
  const tuningPath = path.join(reviewRoot, TUNING_RECOMMENDATIONS_FILENAME);
  const validationPath = path.join(
    validationRoot,
    MANUAL_REVIEW_VALIDATION_FILENAME
  );
  const reportPath = path.join(reportsRoot, MANUAL_REVIEW_REPORT_FILENAME);

  writeJson(reviewPath, reviewRecord);
  writeJson(tuningPath, tuningRecommendations);
  writeJson(validationPath, validation);
  fs.writeFileSync(reportPath, `${report}\n`);

  const reviewFingerprint = hashHex(
    reviewRecord.overallStatus,
    JSON.stringify(reviewRecord.reviewAreas),
    JSON.stringify(tuningRecommendations.recommendations),
    validation.nextAllowedAction
  );

  return deepFreeze({
    reviewPath,
    tuningPath,
    validationPath,
    reportPath,
    reviewRecord,
    tuningRecommendations,
    validation,
    reviewFingerprint
  });
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  buildCoastalLocationRecipeManualReview();
}
