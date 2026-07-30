import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildAtlasMapAttachmentPlanning } from "./atlas-map-attachment-planning.mjs";
import { buildAtlasRegionalPackagePlanning } from "./atlas-regional-package-planning.mjs";
import {
  buildLocationRecipeSelectorFoundation,
  selectLocationRecipe
} from "./location-recipe-selector-foundation.mjs";

const SIMULATION_ROOT =
  "asset-factory-workspace/atlas-map-coordinate-determinism/ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001";

const HARNESS_FILENAME = "atlas-map-coordinate-determinism-simulation-harness.json";
const RESULTS_FILENAME = "atlas-map-coordinate-determinism-simulation-results.json";
const VALIDATION_FILENAME =
  "atlas-map-coordinate-determinism-simulation-validation.json";
const REPORT_FILENAME = "atlas-map-coordinate-determinism-simulation-report.md";

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
      scenarioId: "MAP_COORDINATE_REPEAT_001",
      scenarioType: "IDENTICAL_COORDINATE_REPEATED_LOOKUP",
      description:
        "The same coastal coordinate is resolved twice and must produce the same region, package, seed, and recipe.",
      lookups: [
        {
          lookupId: "REPEAT_A",
          lat: coastal.latBucket,
          lng: coastal.lngBucket,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          lookupId: "REPEAT_B",
          lat: coastal.latBucket,
          lng: coastal.lngBucket,
          environmentProfileHint: coastal.environmentProfile
        }
      ]
    },
    {
      scenarioId: "MAP_COORDINATE_NEARBY_VARIATION_001",
      scenarioType: "NEARBY_COORDINATE_VARIATION",
      description:
        "Nearby coordinates in the same rounded bucket should resolve to the same metadata package and recipe.",
      lookups: [
        {
          lookupId: "NEARBY_A",
          lat: coastal.latBucket + 0.001,
          lng: coastal.lngBucket + 0.001,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          lookupId: "NEARBY_B",
          lat: coastal.latBucket - 0.001,
          lng: coastal.lngBucket - 0.001,
          environmentProfileHint: coastal.environmentProfile
        }
      ]
    },
    {
      scenarioId: "MAP_COORDINATE_BOUNDARY_CROSSING_001",
      scenarioType: "REGION_BOUNDARY_CROSSING",
      description:
        "Crossing from a coastal lookup to a mixed coastal-forest margin lookup should change region and package deterministically.",
      lookups: [
        {
          lookupId: "BOUNDARY_COASTAL_SIDE",
          lat: coastal.latBucket,
          lng: coastal.lngBucket,
          environmentProfileHint: coastal.environmentProfile
        },
        {
          lookupId: "BOUNDARY_MIXED_SIDE",
          lat: mixed.latBucket,
          lng: mixed.lngBucket,
          environmentProfileHint: mixed.environmentProfile
        }
      ]
    },
    {
      scenarioId: "MAP_COORDINATE_INVALID_INPUT_001",
      scenarioType: "INVALID_COORDINATE_HANDLING",
      description:
        "Invalid geographic coordinates must block safely before package or recipe handoff.",
      lookups: [
        {
          lookupId: "INVALID_COORDINATE",
          lat: 123.45,
          lng: 200.01,
          environmentProfileHint: forest.environmentProfile
        }
      ]
    },
    {
      scenarioId: "MAP_COORDINATE_MISSING_PACKAGE_001",
      scenarioType: "MISSING_PACKAGE_HANDLING",
      description:
        "A valid coordinate with no matching representative package must fail safely with a missing-package result.",
      lookups: [
        {
          lookupId: "MISSING_PACKAGE",
          lat: -37.55,
          lng: 144.02,
          environmentProfileHint: "COASTAL_EXPLORATION"
        }
      ]
    }
  ]);
}

function buildHarness(mapAttachmentPlanning, regionalPlanning, selectorFoundation) {
  return deepFreeze({
    schemaId: "ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_HARNESS_001",
    simulationId: "ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_001",
    workflowVersion: "ASSET_FACTORY_V1",
    references: {
      mapAttachmentId: mapAttachmentPlanning.specification.attachmentId,
      regionalPackagePlanningId:
        regionalPlanning.specification.planningId,
      locationRecipeSelectorId: selectorFoundation.specification.selectorId
    },
    deterministicContracts: {
      coordinateNormalization:
        mapAttachmentPlanning.specification.coordinateInputContract.normalizationRules,
      lookupPolicy:
        mapAttachmentPlanning.specification.mapToRegionLookupRules
          .deterministicLookupPolicy,
      seedPolicy:
        mapAttachmentPlanning.specification
          .deterministicSeedGenerationFromCoordinates.seedPolicy
    },
    scenarios: buildScenarioDefinitions(
      regionalPlanning.specification.representativePackages
    )
  });
}

function validateCoordinateInput(lookup) {
  if (
    typeof lookup.lat !== "number" ||
    Number.isNaN(lookup.lat) ||
    lookup.lat < -90 ||
    lookup.lat > 90 ||
    typeof lookup.lng !== "number" ||
    Number.isNaN(lookup.lng) ||
    lookup.lng < -180 ||
    lookup.lng > 180
  ) {
    return {
      ok: false,
      reasonCode: "UNSUPPORTED_COORDINATE_CONTEXT"
    };
  }

  return { ok: true };
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

function buildSelectorContext(scenarioId, lookupId, pkg, selectorId) {
  return deepFreeze({
    worldContextId: `${scenarioId}_${lookupId}`,
    environment: "DEVELOPMENT_ONLY",
    biomeProfile: pkg.primaryBiomeHint,
    routeMode: "pedestrian_exploration",
    archetype: pkg.archetypeHint,
    desiredFeatures: selectDesiredFeatures(pkg),
    seed: hashHex(scenarioId, lookupId, pkg.regionId, selectorId),
    selectorVersion: selectorId
  });
}

function findRepresentativePackage(lookup, packages) {
  const latBucket = normalizeBucket(lookup.lat);
  const lngBucket = normalizeBucket(lookup.lng);
  const environmentProfileHint = normalizeToken(lookup.environmentProfileHint);

  return (
    packages.find(
      (pkg) =>
        normalizeBucket(pkg.latBucket) === latBucket &&
        normalizeBucket(pkg.lngBucket) === lngBucket &&
        normalizeToken(pkg.environmentProfile) === environmentProfileHint
    ) ?? null
  );
}

function resolveLookup(lookup, scenarioId, mapAttachmentPlanning, regionalPlanning, selectorFoundation) {
  const inputValidation = validateCoordinateInput(lookup);
  const latBucket = normalizeBucket(lookup.lat);
  const lngBucket = normalizeBucket(lookup.lng);

  if (!inputValidation.ok) {
    return deepFreeze({
      lookupId: lookup.lookupId,
      status: "blocked",
      lat: lookup.lat,
      lng: lookup.lng,
      latBucket,
      lngBucket,
      reasonCode: inputValidation.reasonCode,
      deterministicFingerprint: hashHex(
        scenarioId,
        lookup.lookupId,
        inputValidation.reasonCode,
        latBucket,
        lngBucket
      )
    });
  }

  const pkg = findRepresentativePackage(
    lookup,
    regionalPlanning.specification.representativePackages
  );

  if (!pkg) {
    return deepFreeze({
      lookupId: lookup.lookupId,
      status: "blocked",
      lat: lookup.lat,
      lng: lookup.lng,
      latBucket,
      lngBucket,
      reasonCode: "REGION_NOT_FOUND",
      deterministicFingerprint: hashHex(
        scenarioId,
        lookup.lookupId,
        "REGION_NOT_FOUND",
        latBucket,
        lngBucket,
        normalizeToken(lookup.environmentProfileHint)
      )
    });
  }

  const selectorContext = buildSelectorContext(
    scenarioId,
    lookup.lookupId,
    pkg,
    selectorFoundation.specification.selectorId
  );
  const recipeSelection = selectLocationRecipe(
    selectorContext,
    selectorFoundation.recipeMetadataRecords,
    selectorFoundation.specification
  );

  return deepFreeze({
    lookupId: lookup.lookupId,
    status: recipeSelection.blocked ? "blocked" : "resolved",
    lat: lookup.lat,
    lng: lookup.lng,
    latBucket,
    lngBucket,
    regionId: pkg.regionId,
    packageId: pkg.packageId,
    packageVersion: pkg.packageVersion,
    environmentProfile: pkg.environmentProfile,
    packageFingerprint: pkg.packageFingerprint,
    selectorSeed: pkg.selectorSeed,
    expectedRecipeId: pkg.expectedRecipeId,
    selectedRecipeId: recipeSelection.selectedRecipeId,
    confidenceScore: recipeSelection.confidenceScore ?? 0,
    fallbackApplied: recipeSelection.fallbackApplied ?? false,
    reasonCode: recipeSelection.blocked ? "SELECTOR_CONTRACT_MISMATCH" : "RESOLVED",
    selectorContext,
    deterministicFingerprint: hashHex(
      scenarioId,
      lookup.lookupId,
      pkg.regionId,
      pkg.packageId,
      pkg.selectorSeed,
      recipeSelection.selectedRecipeId ?? "NONE"
    )
  });
}

function summarizeScenario(scenario, lookups) {
  if (scenario.scenarioType === "IDENTICAL_COORDINATE_REPEATED_LOOKUP") {
    const [first, second] = lookups;
    return deepFreeze({
      scenarioId: scenario.scenarioId,
      result: first.regionId === second.regionId &&
        first.packageId === second.packageId &&
        first.selectorSeed === second.selectorSeed &&
        first.selectedRecipeId === second.selectedRecipeId
        ? "PASS"
        : "FAIL"
    });
  }

  if (scenario.scenarioType === "NEARBY_COORDINATE_VARIATION") {
    const [first, second] = lookups;
    return deepFreeze({
      scenarioId: scenario.scenarioId,
      result: first.regionId === second.regionId &&
        first.packageId === second.packageId &&
        first.selectedRecipeId === second.selectedRecipeId
        ? "PASS"
        : "FAIL"
    });
  }

  if (scenario.scenarioType === "REGION_BOUNDARY_CROSSING") {
    const [first, second] = lookups;
    return deepFreeze({
      scenarioId: scenario.scenarioId,
      result:
        first.regionId !== second.regionId &&
        first.packageId !== second.packageId &&
        first.selectedRecipeId !== null &&
        second.selectedRecipeId !== null
          ? "PASS"
          : "FAIL"
    });
  }

  return deepFreeze({
    scenarioId: scenario.scenarioId,
    result:
      lookups.length === 1 &&
      lookups[0].status === "blocked" &&
      ["UNSUPPORTED_COORDINATE_CONTEXT", "REGION_NOT_FOUND"].includes(
        lookups[0].reasonCode
      )
        ? "PASS"
        : "FAIL"
  });
}

function buildResults(harness, mapAttachmentPlanning, regionalPlanning, selectorFoundation) {
  const scenarioResults = harness.scenarios.map((scenario) => {
    const lookups = scenario.lookups.map((lookup) =>
      resolveLookup(
        lookup,
        scenario.scenarioId,
        mapAttachmentPlanning,
        regionalPlanning,
        selectorFoundation
      )
    );

    return deepFreeze({
      schemaId: "ATLAS_MAP_COORDINATE_DETERMINISM_SCENARIO_RESULT_001",
      scenarioId: scenario.scenarioId,
      scenarioType: scenario.scenarioType,
      description: scenario.description,
      lookups,
      summary: summarizeScenario(scenario, lookups)
    });
  });

  return deepFreeze({
    schemaId: "ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_RESULTS_001",
    simulationId: harness.simulationId,
    scenarioResults,
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

function buildValidation(harness, results, mapAttachmentPlanning) {
  const repeatedScenario = results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_REPEAT_001"
  );
  const nearbyScenario = results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_NEARBY_VARIATION_001"
  );
  const boundaryScenario = results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_BOUNDARY_CROSSING_001"
  );
  const invalidScenario = results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_INVALID_INPUT_001"
  );
  const missingScenario = results.scenarioResults.find(
    (scenario) => scenario.scenarioId === "MAP_COORDINATE_MISSING_PACKAGE_001"
  );

  const checks = [
    {
      name: "deterministic_region_identity",
      ok: repeatedScenario.summary.result === "PASS" && boundaryScenario.summary.result === "PASS"
    },
    {
      name: "deterministic_package_selection",
      ok: repeatedScenario.summary.result === "PASS" && nearbyScenario.summary.result === "PASS"
    },
    {
      name: "deterministic_recipe_selection",
      ok:
        repeatedScenario.lookups.every(
          (lookup) =>
            lookup.status === "resolved" &&
            lookup.selectedRecipeId === lookup.expectedRecipeId
        ) &&
        nearbyScenario.lookups.every(
          (lookup) =>
            lookup.status === "resolved" &&
            lookup.selectedRecipeId === lookup.expectedRecipeId
        )
    },
    {
      name: "deterministic_seed_generation",
      ok:
        repeatedScenario.lookups[0].selectorSeed ===
          repeatedScenario.lookups[1].selectorSeed &&
        nearbyScenario.lookups[0].selectorSeed === nearbyScenario.lookups[1].selectorSeed
    },
    {
      name: "safe_failure_behaviour",
      ok:
        invalidScenario.summary.result === "PASS" &&
        missingScenario.summary.result === "PASS"
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
    schemaId: "ATLAS_MAP_COORDINATE_DETERMINISM_SIMULATION_VALIDATION_001",
    simulationId: harness.simulationId,
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    checks,
    deterministicFingerprint: hashHex(
      harness.simulationId,
      JSON.stringify(results.scenarioResults),
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

function buildReport(harness, results, validation) {
  const scenarioLines = results.scenarioResults
    .map((scenario) => {
      const lookupLines = scenario.lookups
        .map((lookup) => {
          if (lookup.status === "blocked") {
            return `  - ${lookup.lookupId}: BLOCKED (${lookup.reasonCode}) @ ${lookup.latBucket}, ${lookup.lngBucket}`;
          }
          return `  - ${lookup.lookupId}: ${lookup.regionId} -> ${lookup.packageId} -> ${lookup.selectedRecipeId} | seed ${lookup.selectorSeed}`;
        })
        .join("\n");

      return `- ${scenario.scenarioId} [${scenario.summary.result}]\n${lookupLines}`;
    })
    .join("\n");

  return `# ATLAS MAP COORDINATE DETERMINISM SIMULATION

## Scope

${harness.simulationId} validates deterministic coordinate-to-location resolution before future map attachment.

## Scenario Results

${scenarioLines}

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

Future map attachment determinism simulation: ${
    validation.status === "pass" ? "READY" : "BLOCKED"
  }
`;
}

export function buildAtlasMapCoordinateDeterminismSimulation({
  cwd = process.cwd()
} = {}) {
  const mapAttachmentPlanning = buildAtlasMapAttachmentPlanning({ cwd });
  const regionalPlanning = buildAtlasRegionalPackagePlanning({ cwd });
  const selectorFoundation = buildLocationRecipeSelectorFoundation({ cwd });

  const harness = buildHarness(
    mapAttachmentPlanning,
    regionalPlanning,
    selectorFoundation
  );
  const results = buildResults(
    harness,
    mapAttachmentPlanning,
    regionalPlanning,
    selectorFoundation
  );
  const validation = buildValidation(
    harness,
    results,
    mapAttachmentPlanning
  );
  const report = buildReport(harness, results, validation);

  return deepFreeze({
    root: path.resolve(cwd, SIMULATION_ROOT),
    harness,
    results,
    validation,
    report,
    fingerprint: validation.deterministicFingerprint
  });
}

export function writeAtlasMapCoordinateDeterminismSimulation({
  cwd = process.cwd()
} = {}) {
  const simulation = buildAtlasMapCoordinateDeterminismSimulation({ cwd });
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
  writeJson(path.join(outputsDir, RESULTS_FILENAME), simulation.results);
  writeJson(path.join(validationDir, VALIDATION_FILENAME), simulation.validation);
  fs.writeFileSync(path.join(reportsDir, REPORT_FILENAME), simulation.report);

  return simulation;
}

const isEntrypoint = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
  : false;

if (isEntrypoint) {
  writeAtlasMapCoordinateDeterminismSimulation();
}
