import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasMapAttachmentPlanning } from "./atlas-map-attachment-planning.mjs";
import { buildAtlasMapCoordinateDeterminismSimulation } from "./atlas-map-coordinate-determinism-simulation.mjs";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import {
  buildLocationRecipeSelectorFoundation,
  selectLocationRecipe
} from "./location-recipe-selector-foundation.mjs";

const TRANSITION_ROOT =
  "asset-factory-workspace/atlas-regional-boundary-transition/ATLAS_REGIONAL_BOUNDARY_TRANSITION_SIMULATION_001";

const HARNESS_FILENAME = "atlas-regional-boundary-transition-simulation-harness.json";
const RECORDS_FILENAME = "atlas-regional-boundary-transition-records.json";
const VALIDATION_FILENAME =
  "atlas-regional-boundary-transition-validation.json";
const REPORT_FILENAME = "atlas-regional-boundary-transition-report.md";

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

function normalizeBucket(value) {
  return Number(Number(value).toFixed(2));
}

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function selectDesiredFeatures(pkg) {
  if (pkg.expectedRecipeId === "COASTAL_LOCATION_RECIPE_001") {
    return ["SHORELINE_TRANSITION", "WET_CROSSING", "LOOP_ROUTE"];
  }

  if (normalizeToken(pkg.archetypeHint).includes("OUT_AND_BACK")) {
    return ["CANOPY_ENCLOSURE", "CLEARING_DESTINATION", "OUT_AND_BACK_ROUTE"];
  }

  return ["CANOPY_ENCLOSURE", "CLEARING_DESTINATION", "LOOP_ROUTE"];
}

function buildSelectorContext(simulationId, stepId, pkg, selectorId) {
  return deepFreeze({
    worldContextId: `${simulationId}_${stepId}`,
    environment: "DEVELOPMENT_ONLY",
    biomeProfile: pkg.primaryBiomeHint,
    routeMode: "pedestrian_exploration",
    archetype: pkg.archetypeHint,
    desiredFeatures: selectDesiredFeatures(pkg),
    seed: hashHex(simulationId, stepId, pkg.regionId, selectorId),
    selectorVersion: selectorId
  });
}

function validateCoordinateInput(step) {
  if (
    typeof step.lat !== "number" ||
    Number.isNaN(step.lat) ||
    step.lat < -90 ||
    step.lat > 90 ||
    typeof step.lng !== "number" ||
    Number.isNaN(step.lng) ||
    step.lng < -180 ||
    step.lng > 180
  ) {
    return {
      ok: false,
      reasonCode: "UNSUPPORTED_COORDINATE_CONTEXT"
    };
  }

  return { ok: true };
}

function findRepresentativePackage(step, packages) {
  const latBucket = normalizeBucket(step.lat);
  const lngBucket = normalizeBucket(step.lng);
  const environmentProfileHint = normalizeToken(step.environmentProfileHint);

  return (
    packages.find(
      (pkg) =>
        normalizeBucket(pkg.latBucket) === latBucket &&
        normalizeBucket(pkg.lngBucket) === lngBucket &&
        normalizeToken(pkg.environmentProfile) === environmentProfileHint
    ) ?? null
  );
}

function resolveStep(step, simulationId, packages, selectorFoundation) {
  const inputValidation = validateCoordinateInput(step);
  const latBucket = normalizeBucket(step.lat);
  const lngBucket = normalizeBucket(step.lng);

  if (!inputValidation.ok) {
    return deepFreeze({
      stepId: step.stepId,
      status: "blocked",
      lat: step.lat,
      lng: step.lng,
      latBucket,
      lngBucket,
      reasonCode: inputValidation.reasonCode,
      cacheKey: null,
      packageFingerprint: null,
      selectorSeed: null,
      selectedRecipeId: null,
      deterministicFingerprint: hashHex(
        simulationId,
        step.stepId,
        inputValidation.reasonCode,
        latBucket,
        lngBucket
      )
    });
  }

  const pkg = findRepresentativePackage(step, packages);
  if (!pkg) {
    return deepFreeze({
      stepId: step.stepId,
      status: "blocked",
      lat: step.lat,
      lng: step.lng,
      latBucket,
      lngBucket,
      reasonCode: "REGION_NOT_FOUND",
      cacheKey: null,
      packageFingerprint: null,
      selectorSeed: null,
      selectedRecipeId: null,
      deterministicFingerprint: hashHex(
        simulationId,
        step.stepId,
        "REGION_NOT_FOUND",
        latBucket,
        lngBucket,
        normalizeToken(step.environmentProfileHint)
      )
    });
  }

  const selectorContext = buildSelectorContext(
    simulationId,
    step.stepId,
    pkg,
    selectorFoundation.specification.selectorId
  );
  const selection = selectLocationRecipe(
    selectorContext,
    selectorFoundation.recipeMetadataRecords,
    selectorFoundation.specification
  );

  return deepFreeze({
    stepId: step.stepId,
    status: selection.blocked ? "blocked" : "resolved",
    lat: step.lat,
    lng: step.lng,
    latBucket,
    lngBucket,
    regionId: pkg.regionId,
    packageId: pkg.packageId,
    packageVersion: pkg.packageVersion,
    packageFingerprint: pkg.packageFingerprint,
    cacheKey: `${pkg.packageFingerprint}:${pkg.packageVersion}:${selectorFoundation.specification.selectorId}`,
    environmentProfile: pkg.environmentProfile,
    selectorSeed: pkg.selectorSeed,
    expectedRecipeId: pkg.expectedRecipeId,
    selectedRecipeId: selection.selectedRecipeId,
    confidenceScore: selection.confidenceScore ?? 0,
    fallbackApplied: selection.fallbackApplied ?? false,
    reasonCode: selection.blocked ? "SELECTOR_CONTRACT_MISMATCH" : "RESOLVED",
    selectorContext,
    deterministicFingerprint: hashHex(
      simulationId,
      step.stepId,
      pkg.regionId,
      pkg.packageId,
      pkg.selectorSeed,
      selection.selectedRecipeId ?? "NONE"
    )
  });
}

function buildScenarioDefinitions(packages) {
  const coastal = packages.find(
    (pkg) => pkg.expectedRecipeId === "COASTAL_LOCATION_RECIPE_001"
  );
  const forest = packages.find(
    (pkg) =>
      pkg.expectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
      pkg.environmentProfile === "FOREST_EXPLORATION"
  );
  const mixed = packages.find(
    (pkg) => pkg.environmentProfile === "MIXED_EDGE_TRANSITION"
  );

  return deepFreeze([
    {
      transitionId: "REGION_TRANSITION_WITHIN_REGION_001",
      transitionType: "MOVEMENT_WITHIN_SAME_REGION",
      description:
        "Movement within the same coastal region should preserve package handoff, cache continuity, recipe continuity, and selector seed.",
      steps: [
        {
          stepId: "WITHIN_A",
          lat: coastal.latBucket + 0.001,
          lng: coastal.lngBucket + 0.001,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          stepId: "WITHIN_B",
          lat: coastal.latBucket - 0.001,
          lng: coastal.lngBucket - 0.001,
          environmentProfileHint: coastal.environmentProfile
        }
      ]
    },
    {
      transitionId: "REGION_TRANSITION_CROSS_REGION_001",
      transitionType: "TRANSITION_BETWEEN_REGIONS",
      description:
        "Movement from coastal exploration into forest exploration should deterministically hand off package, cache key, and recipe selection.",
      steps: [
        {
          stepId: "COASTAL_SIDE",
          lat: coastal.latBucket,
          lng: coastal.lngBucket,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          stepId: "FOREST_SIDE",
          lat: forest.latBucket,
          lng: forest.lngBucket,
          environmentProfileHint: forest.environmentProfile
        }
      ]
    },
    {
      transitionId: "REGION_TRANSITION_MIXED_BOUNDARY_001",
      transitionType: "MIXED_BIOME_BOUNDARY",
      description:
        "Movement from forest edge into a mixed biome boundary should remain deterministic, preserve seed semantics, and allow recipe continuity through approved fallback.",
      steps: [
        {
          stepId: "FOREST_EDGE",
          lat: forest.latBucket,
          lng: forest.lngBucket,
          environmentProfileHint: forest.environmentProfile
        },
        {
          stepId: "MIXED_MARGIN",
          lat: mixed.latBucket,
          lng: mixed.lngBucket,
          environmentProfileHint: mixed.environmentProfile
        }
      ]
    },
    {
      transitionId: "REGION_TRANSITION_MISSING_NEIGHBOR_001",
      transitionType: "MISSING_NEIGHBORING_PACKAGE",
      description:
        "Transitioning toward a neighboring area with no representative package must block safely without mutating cache or runtime state.",
      steps: [
        {
          stepId: "VALID_START",
          lat: coastal.latBucket,
          lng: coastal.lngBucket,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          stepId: "MISSING_NEIGHBOR",
          lat: -37.55,
          lng: 144.02,
          environmentProfileHint: "COASTAL_EXPLORATION"
        }
      ]
    },
    {
      transitionId: "REGION_TRANSITION_INVALID_BOUNDARY_001",
      transitionType: "INVALID_BOUNDARY_STATE",
      description:
        "An invalid boundary state must block immediately and return a deterministic failure record.",
      steps: [
        {
          stepId: "INVALID_BOUNDARY",
          lat: 123.45,
          lng: 200.01,
          environmentProfileHint: forest.environmentProfile
        }
      ]
    }
  ]);
}

function buildHarness(mapAttachmentPlanning, coordinateSimulation, regionalPlanning) {
  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_BOUNDARY_TRANSITION_SIMULATION_HARNESS_001",
    simulationId: "ATLAS_REGIONAL_BOUNDARY_TRANSITION_SIMULATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      mapAttachmentId: mapAttachmentPlanning.specification.attachmentId,
      coordinateDeterminismSimulationId:
        coordinateSimulation.harness.simulationId,
      regionalPackagePlanningId: regionalPlanning.specification.planningId
    },
    transitionRules: {
      boundaryPolicy:
        mapAttachmentPlanning.specification.regionBoundaryRules.rules,
      packageLoadPolicy:
        mapAttachmentPlanning.specification.packageLoadingRules.loadPolicies,
      allowedStates:
        mapAttachmentPlanning.specification.mapAttachmentPermissions.allowedStates,
      blockedStates:
        mapAttachmentPlanning.specification.mapAttachmentPermissions.blockedStates
    },
    scenarios: buildScenarioDefinitions(
      regionalPlanning.specification.representativePackages
    )
  });
}

function summarizeTransition(scenario, steps) {
  if (scenario.transitionType === "MOVEMENT_WITHIN_SAME_REGION") {
    const [first, second] = steps;
    return deepFreeze({
      transitionId: scenario.transitionId,
      result:
        first.regionId === second.regionId &&
        first.packageId === second.packageId &&
        first.cacheKey === second.cacheKey &&
        first.selectedRecipeId === second.selectedRecipeId &&
        first.selectorSeed === second.selectorSeed
          ? "PASS"
          : "FAIL"
    });
  }

  if (scenario.transitionType === "TRANSITION_BETWEEN_REGIONS") {
    const [first, second] = steps;
    return deepFreeze({
      transitionId: scenario.transitionId,
      result:
        first.regionId !== second.regionId &&
        first.packageId !== second.packageId &&
        first.cacheKey !== second.cacheKey &&
        first.selectedRecipeId !== second.selectedRecipeId
          ? "PASS"
          : "FAIL"
    });
  }

  if (scenario.transitionType === "MIXED_BIOME_BOUNDARY") {
    const [first, second] = steps;
    return deepFreeze({
      transitionId: scenario.transitionId,
      result:
        first.regionId !== second.regionId &&
        first.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        second.selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        second.fallbackApplied === true
          ? "PASS"
          : "FAIL"
    });
  }

  if (scenario.transitionType === "MISSING_NEIGHBORING_PACKAGE") {
    const [first, second] = steps;
    return deepFreeze({
      transitionId: scenario.transitionId,
      result:
        first.status === "resolved" &&
        second.status === "blocked" &&
        second.reasonCode === "REGION_NOT_FOUND"
          ? "PASS"
          : "FAIL"
    });
  }

  return deepFreeze({
    transitionId: scenario.transitionId,
    result:
      steps.length === 1 &&
      steps[0].status === "blocked" &&
      steps[0].reasonCode === "UNSUPPORTED_COORDINATE_CONTEXT"
        ? "PASS"
        : "FAIL"
  });
}

function buildTransitionRecords(harness, regionalPlanning, selectorFoundation) {
  const scenarioResults = harness.scenarios.map((scenario) => {
    const steps = scenario.steps.map((step) =>
      resolveStep(
        step,
        scenario.transitionId,
        regionalPlanning.specification.representativePackages,
        selectorFoundation
      )
    );

    return deepFreeze({
      schemaId: "ATLAS_REGIONAL_BOUNDARY_TRANSITION_RECORD_001",
      transitionId: scenario.transitionId,
      transitionType: scenario.transitionType,
      description: scenario.description,
      steps,
      summary: summarizeTransition(scenario, steps)
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_BOUNDARY_TRANSITION_RECORD_SET_001",
    simulationId: harness.simulationId,
    transitions: scenarioResults,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      ...scenarioResults.map((entry) => JSON.stringify(entry))
    ),
    safetyState: {
      runtimeActivationAuthorized: false,
      mapDownloadsAuthorized: false,
      rendererAttachmentAuthorized: false,
      blenderAuthorized: false,
      glbAuthorized: false,
      assetModificationAuthorized: false
    }
  });
}

function buildValidation(harness, transitionRecords, mapAttachmentPlanning) {
  const sameRegion = transitionRecords.transitions.find(
    (entry) => entry.transitionId === "REGION_TRANSITION_WITHIN_REGION_001"
  );
  const crossRegion = transitionRecords.transitions.find(
    (entry) => entry.transitionId === "REGION_TRANSITION_CROSS_REGION_001"
  );
  const mixedBoundary = transitionRecords.transitions.find(
    (entry) => entry.transitionId === "REGION_TRANSITION_MIXED_BOUNDARY_001"
  );
  const missingNeighbor = transitionRecords.transitions.find(
    (entry) => entry.transitionId === "REGION_TRANSITION_MISSING_NEIGHBOR_001"
  );
  const invalidBoundary = transitionRecords.transitions.find(
    (entry) => entry.transitionId === "REGION_TRANSITION_INVALID_BOUNDARY_001"
  );

  const checks = [
    {
      name: "package_handoff",
      ok:
        sameRegion.summary.result === "PASS" &&
        crossRegion.summary.result === "PASS"
    },
    {
      name: "cache_continuity",
      ok:
        sameRegion.steps[0].cacheKey === sameRegion.steps[1].cacheKey &&
        crossRegion.steps[0].cacheKey !== crossRegion.steps[1].cacheKey
    },
    {
      name: "deterministic_recipe_continuity",
      ok:
        sameRegion.steps[0].selectedRecipeId === sameRegion.steps[1].selectedRecipeId &&
        mixedBoundary.steps[0].selectedRecipeId === "FOREST_LOCATION_RECIPE_001" &&
        mixedBoundary.steps[1].selectedRecipeId === "FOREST_LOCATION_RECIPE_001"
    },
    {
      name: "seed_preservation",
      ok:
        sameRegion.steps[0].selectorSeed === sameRegion.steps[1].selectorSeed &&
        crossRegion.steps[0].selectorSeed !== crossRegion.steps[1].selectorSeed
    },
    {
      name: "safe_failure_behaviour",
      ok:
        missingNeighbor.summary.result === "PASS" &&
        invalidBoundary.summary.result === "PASS"
    },
    {
      name: "runtime_map_renderer_blender_glb_asset_mutation_blocked",
      ok:
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .runtimeActivationAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .mapDownloadsAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .rendererAttachmentAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .blenderAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .glbAuthorized === false &&
        mapAttachmentPlanning.specification.mapAttachmentPermissions.permissions
          .assetModificationAuthorized === false
    }
  ];

  return deepFreeze({
    schemaId: "ATLAS_REGIONAL_BOUNDARY_TRANSITION_VALIDATION_001",
    simulationId: harness.simulationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(transitionRecords.transitions),
      JSON.stringify(checks)
    ),
    runtimeActivationAuthorized: false,
    mapDownloadsAuthorized: false,
    rendererAttachmentAuthorized: false,
    blenderAuthorized: false,
    glbAuthorized: false,
    assetModificationAuthorized: false
  });
}

function buildReport(harness, transitionRecords, validation) {
  const transitionLines = transitionRecords.transitions
    .map((transition) => {
      const stepLines = transition.steps
        .map((step) => {
          if (step.status === "blocked") {
            return `  - ${step.stepId}: BLOCKED (${step.reasonCode}) @ ${step.latBucket}, ${step.lngBucket}`;
          }
          return `  - ${step.stepId}: ${step.regionId} -> ${step.packageId} -> ${step.selectedRecipeId} | cache ${step.cacheKey}`;
        })
        .join("\n");

      return `- ${transition.transitionId} [${transition.summary.result}]\n${stepLines}`;
    })
    .join("\n");

  return `# ATLAS REGIONAL BOUNDARY TRANSITION SIMULATION

## Scope

${harness.simulationId} validates deterministic regional transitions before future map attachment.

## Transition Results

${transitionLines}

## Validation

${validation.checks
  .map((check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`)
  .join("\n")}

## Safety

- runtime activation authorized: ${validation.runtimeActivationAuthorized}
- map downloads authorized: ${validation.mapDownloadsAuthorized}
- renderer attachment authorized: ${validation.rendererAttachmentAuthorized}
- Blender authorized: ${validation.blenderAuthorized}
- GLB authorized: ${validation.glbAuthorized}
- asset modification authorized: ${validation.assetModificationAuthorized}

## Readiness

Future map attachment boundary transitions: ${
    validation.status === "pass" ? "READY" : "BLOCKED"
  }
`;
}

export function buildAtlasRegionalBoundaryTransitionSimulation({
  cwd = process.cwd()
} = {}) {
  const mapAttachmentPlanning = buildAtlasMapAttachmentPlanning({ cwd });
  const coordinateSimulation = buildAtlasMapCoordinateDeterminismSimulation({
    cwd
  });
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });

  const harness = buildHarness(
    mapAttachmentPlanning,
    coordinateSimulation,
    regionalPlanning
  );
  const transitionRecords = buildTransitionRecords(
    harness,
    regionalPlanning,
    selectorFoundation
  );
  const validation = buildValidation(
    harness,
    transitionRecords,
    mapAttachmentPlanning
  );
  const report = buildReport(harness, transitionRecords, validation);

  return deepFreeze({
    root: path.resolve(cwd, TRANSITION_ROOT),
    harness,
    transitionRecords,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasRegionalBoundaryTransitionSimulation({
  cwd = process.cwd()
} = {}) {
  const simulation = buildAtlasRegionalBoundaryTransitionSimulation({ cwd });
  const specificationDir = path.join(simulation.root, "specification");
  const outputsDir = path.join(simulation.root, "outputs");
  const validationDir = path.join(simulation.root, "validation");
  const reportsDir = path.join(simulation.root, "reports");

  for (const directory of [
    specificationDir,
    outputsDir,
    validationDir,
    reportsDir
  ]) {
    ensureDirectory(directory);
  }

  writeJson(path.join(specificationDir, HARNESS_FILENAME), simulation.harness);
  writeJson(path.join(outputsDir, RECORDS_FILENAME), simulation.transitionRecords);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), simulation.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), simulation.report);

  return simulation;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasRegionalBoundaryTransitionSimulation();
}
