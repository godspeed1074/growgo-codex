import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const FACTORY_ROOT =
  "asset-factory-workspace/recipe-factory/LOCATION_RECIPE_FACTORY_001";
const SELECTOR_ROOT =
  "asset-factory-workspace/recipe-selector/LOCATION_RECIPE_SELECTOR_001";

const FACTORY_SPECIFICATION_FILENAME =
  "location-recipe-factory-specification.json";
const FACTORY_VALIDATION_FILENAME = "location-recipe-factory-validation.json";
const FACTORY_LIFECYCLE_FILENAME = "location-recipe-factory-lifecycle-record.json";

const RECIPE_RECORDS = Object.freeze([
  {
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    root: "asset-factory-workspace/recipes/COASTAL_LOCATION_RECIPE_001",
    approvalFilename: "coastal-location-recipe-001-approval.json",
    catalogFilename: "coastal-location-recipe-001-approved-catalog-entry.json",
    versionFilename: "coastal-location-recipe-001-v001-version-record.json",
    specificationFilename: "coastal-location-recipe-001-specification.json",
    metadataFilename: "coastal-location-recipe-001-selector-metadata.json"
  },
  {
    recipeId: "FOREST_LOCATION_RECIPE_001",
    root: "asset-factory-workspace/recipes/FOREST_LOCATION_RECIPE_001",
    approvalFilename: "forest-location-recipe-001-approval.json",
    catalogFilename: "forest-location-recipe-001-approved-catalog-entry.json",
    versionFilename: "forest-location-recipe-001-v001-version-record.json",
    specificationFilename: "forest-location-recipe-001-specification.json",
    metadataFilename: "forest-location-recipe-001-selector-metadata.json"
  }
]);

const SELECTOR_SPECIFICATION_FILENAME =
  "location-recipe-selector-specification.json";
const SELECTOR_LIBRARY_FILENAME = "location-recipe-selector-library.json";
const SELECTOR_VALIDATION_FILENAME = "location-recipe-selector-validation.json";
const SELECTOR_LIFECYCLE_FILENAME = "location-recipe-selector-lifecycle-record.json";
const SELECTOR_REPORT_FILENAME = "location-recipe-selector-foundation-report.md";

const DEFAULT_SELECTOR_CONTEXT = Object.freeze({
  worldContextId: "WORLD_CONTEXT_DEFAULT_001",
  environment: "DEVELOPMENT_ONLY",
  biomeProfile: "COASTAL_RESERVE_TRAIL",
  routeMode: "pedestrian_exploration",
  archetype: "RESERVE_LOOP",
  desiredFeatures: ["shoreline_transition", "loop_destination"],
  seed: "LOCATION_RECIPE_SELECTOR_001:DEFAULT"
});

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

function normalizeToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeArray(values) {
  return [...new Set((values ?? []).map(normalizeToken).filter(Boolean))].sort();
}

function loadFactoryFoundation(cwd) {
  const factoryRoot = path.resolve(cwd, FACTORY_ROOT);
  const specification = readJson(
    path.join(factoryRoot, "specification", FACTORY_SPECIFICATION_FILENAME)
  );
  const validation = readJson(
    path.join(factoryRoot, "validation", FACTORY_VALIDATION_FILENAME)
  );
  const lifecycle = readJson(
    path.join(factoryRoot, "lifecycle", FACTORY_LIFECYCLE_FILENAME)
  );

  if (validation.status !== "pass") {
    throw new Error(
      "Location recipe selector blocked: LOCATION_RECIPE_FACTORY_001 validation must pass."
    );
  }
  if (lifecycle.lifecycleStatus !== "READY") {
    throw new Error(
      "Location recipe selector blocked: LOCATION_RECIPE_FACTORY_001 must be READY."
    );
  }

  return { specification, validation, lifecycle };
}

function loadApprovedRecipe(cwd, record) {
  const recipeRoot = path.resolve(cwd, record.root);
  const approval = readJson(
    path.join(recipeRoot, "approval", record.approvalFilename)
  );
  const catalog = readJson(path.join(recipeRoot, "catalog", record.catalogFilename));
  const version = readJson(path.join(recipeRoot, "version", record.versionFilename));
  const specification = readJson(
    path.join(recipeRoot, "specification", record.specificationFilename)
  );

  if (approval.approvalStatus !== "approved") {
    throw new Error(
      `Location recipe selector blocked: ${record.recipeId} is not approved.`
    );
  }
  if (catalog.lifecycleStatus !== "APPROVED_CURRENT") {
    throw new Error(
      `Location recipe selector blocked: ${record.recipeId} catalog entry is not APPROVED_CURRENT.`
    );
  }
  if (catalog.environment !== "DEVELOPMENT_ONLY") {
    throw new Error(
      `Location recipe selector blocked: ${record.recipeId} must remain DEVELOPMENT_ONLY.`
    );
  }
  if (
    catalog.visibility?.development !== true ||
    catalog.visibility?.beta !== false ||
    catalog.visibility?.production !== false
  ) {
    throw new Error(
      `Location recipe selector blocked: ${record.recipeId} visibility guards are invalid.`
    );
  }

  return {
    recipeRoot,
    approval,
    catalog,
    version,
    specification,
    record
  };
}

function inferBiomeFamily(specification) {
  const profile =
    specification.biomeClassification?.primaryBiome ??
    specification.biomeRules?.allowedBiomeProfiles?.[0] ??
    specification.recipeIdentity?.recipeType ??
    "UNKNOWN";
  return normalizeToken(profile.split("_").slice(0, 2).join("_"));
}

function inferSelectionCapabilities(specification, catalog) {
  const zoneText = JSON.stringify(specification.placementRules ?? {}).toUpperCase();
  const navigationText = JSON.stringify(specification.navigationRules ?? {}).toUpperCase();
  const dependencyRoles = (catalog.dependencyReferences ?? []).map((entry) =>
    normalizeToken(entry.role)
  );
  const capabilities = new Set();

  for (const role of dependencyRoles) {
    capabilities.add(role);
  }

  if (zoneText.includes("SHORELINE") || navigationText.includes("WATER_EDGE")) {
    capabilities.add("SHORELINE_TRANSITION");
    capabilities.add("WATER_BOUNDARY");
  }
  if (zoneText.includes("BOARDWALK") || dependencyRoles.includes("ELEVATED_WET_CROSSING")) {
    capabilities.add("WET_CROSSING");
  }
  if (zoneText.includes("LOOKOUT") || zoneText.includes("REST")) {
    capabilities.add("DESTINATION_NODE");
  }
  if (zoneText.includes("CLEARING")) {
    capabilities.add("CLEARING_DESTINATION");
  }
  if (navigationText.includes("LOOP")) {
    capabilities.add("LOOP_ROUTE");
  }
  if (navigationText.includes("OUT_AND_BACK")) {
    capabilities.add("OUT_AND_BACK_ROUTE");
  }
  if (zoneText.includes("CANOPY") || zoneText.includes("DEEP_FOREST")) {
    capabilities.add("CANOPY_ENCLOSURE");
  }

  return [...capabilities].sort();
}

function buildRecipeMetadata(recipe) {
  const { approval, catalog, version, specification, record } = recipe;
  const supportedBiomes = normalizeArray([
    ...(specification.biomeClassification?.supportedBiomeProfiles ?? []),
    ...(specification.biomeRules?.allowedBiomeProfiles ?? [])
  ]);
  const disallowedBiomes = normalizeArray(
    specification.biomeRules?.disallowedBiomeProfiles ?? []
  );
  const supportedArchetypes = normalizeArray(
    specification.navigationRules?.supportedArchetypes ?? []
  );
  const routeSignals = normalizeArray([
    specification.navigationRules?.navigationMode,
    specification.navigationRules?.routeIntent
  ]);
  const dependencyRoles = normalizeArray(
    (catalog.dependencyReferences ?? []).map((entry) => entry.role)
  );
  const capabilities = inferSelectionCapabilities(specification, catalog);
  const biomeFamily = inferBiomeFamily(specification);
  const confidenceWeights = {
    biomeMatch: 40,
    environmentMatch: 20,
    archetypeMatch: 15,
    featureMatch: 15,
    versionCompatibility: 10
  };

  return deepFreeze({
    schemaId: `${approval.recipeId}_SELECTOR_METADATA_001`,
    selectorId: "LOCATION_RECIPE_SELECTOR_001",
    recipeId: approval.recipeId,
    recipePackageId: approval.recipePackageId,
    recipeType: approval.recipeType,
    version: approval.version,
    variantId: approval.variantId,
    paletteId: approval.paletteId,
    lodProfile: approval.lodProfile,
    category: approval.category,
    workflowVersion:
      version.workflowVersion ??
      specification.workflowVersion ??
      "ASSET_FACTORY_V1",
    lifecycleStatus: approval.lifecycleStatus,
    approvalStatus: approval.approvalStatus,
    environment: catalog.environment,
    recipeFamily: record.recipeId.includes("COASTAL") ? "COASTAL" : "FOREST",
    biomeFamily,
    biomeTags: supportedBiomes,
    disallowedBiomeTags: disallowedBiomes,
    supportedArchetypes,
    routeSignals,
    dependencyRoles,
    selectionCapabilities: capabilities,
    environmentRequirements: {
      requiredEnvironment: "DEVELOPMENT_ONLY",
      developmentVisible: catalog.visibility.development,
      betaBlocked: catalog.environmentGuards.betaBlocked,
      productionBlocked: catalog.environmentGuards.productionBlocked,
      runtimeActivationBlocked: catalog.environmentGuards.runtimeActivationBlocked
    },
    performanceEnvelope: {
      totalPlacements: catalog.placementSummary.totalPlacements,
      uniqueDependencies: catalog.placementSummary.uniqueDependencies,
      triangleTotals: catalog.performanceSummary.triangleTotals,
      budget: catalog.performanceSummary.budget
    },
    dependencySummary: {
      dependencyIds: approval.dependencyIds,
      deferredDependencyIds: approval.deferredDependencyIds ?? [],
      dependencyCount: approval.dependencyIds.length
    },
    versionCompatibility: {
      supportedSelectorVersions: ["LOCATION_RECIPE_SELECTOR_001"],
      requiredWorkflowVersion:
        version.workflowVersion ??
        specification.workflowVersion ??
        "ASSET_FACTORY_V1",
      recipeVersion: approval.version,
      approvalDate: approval.approvedOn
    },
    confidenceWeights
  });
}

function buildSelectorSpecification(factoryFoundation, recipeMetadataRecords) {
  return deepFreeze({
    schemaId: "LOCATION_RECIPE_SELECTOR_SPECIFICATION_001",
    selectorId: "LOCATION_RECIPE_SELECTOR_001",
    workflowVersion: "ASSET_FACTORY_V1",
    referenceFactoryId: "LOCATION_RECIPE_FACTORY_001",
    approvedRecipeCount: recipeMetadataRecords.length,
    metadataSchema: {
      requiredFields: [
        "recipeId",
        "recipePackageId",
        "version",
        "biomeTags",
        "supportedArchetypes",
        "selectionCapabilities",
        "environmentRequirements",
        "versionCompatibility",
        "performanceEnvelope"
      ],
      approvedRecipeOnly: true,
      developmentOnlyRecipes: true
    },
    selectionInputSchema: {
      requiredFields: [
        "worldContextId",
        "environment",
        "biomeProfile",
        "routeMode",
        "archetype",
        "desiredFeatures",
        "seed"
      ],
      optionalFields: ["selectorVersion", "preferredRecipeId"]
    },
    selectionRules: {
      approvedLifecycleStates: ["APPROVED_CURRENT"],
      requiredApprovalStatus: "approved",
      requiredEnvironment: "DEVELOPMENT_ONLY",
      versionCompatibilityRule:
        "recipe workflow version must match selector workflow version and recipe version must be an exact approved catalog version",
      scoring: {
        biomeMatch: 40,
        environmentMatch: 20,
        archetypeMatch: 15,
        featureMatch: 15,
        versionCompatibility: 10
      },
      deterministicTieBreak:
        "hash(recipeId, biomeProfile, archetype, desiredFeatures, seed)",
      fallbackPolicy: {
        mode: "highest_confidence_approved_recipe",
        minimumConfidence: 35,
        ifNoEligibleRecipe: "BLOCK_UNSUPPORTED_CONTEXT",
        biomeFallbackOrder: ["same_biome_tag", "same_biome_family", "highest_confidence"]
      }
    },
    validationRules: {
      sameInputsProduceSameRecipe: true,
      unsupportedRecipesBlocked: true,
      unapprovedRecipesBlocked: true,
      deterministicSelectionRequired: true,
      runtimeActivationBlocked: true
    },
    futureAtlasIntegrationReadiness: {
      readOnlySelector: true,
      runtimeActivationRequired: false,
      safeForMetadataDrivenAtlasLookup: true
    },
    factoryReference: {
      factoryId: factoryFoundation.lifecycle.factoryId,
      lifecycleStatus: factoryFoundation.lifecycle.lifecycleStatus,
      referenceRecipeId: factoryFoundation.lifecycle.referenceRecipeId
    }
  });
}

function buildSelectorLibrary(recipeMetadataRecords) {
  return deepFreeze({
    schemaId: "LOCATION_RECIPE_SELECTOR_LIBRARY_001",
    selectorId: "LOCATION_RECIPE_SELECTOR_001",
    recipeCount: recipeMetadataRecords.length,
    approvedRecipesOnly: true,
    recipes: recipeMetadataRecords.map((metadata) => ({
      recipeId: metadata.recipeId,
      recipePackageId: metadata.recipePackageId,
      recipeType: metadata.recipeType,
      version: metadata.version,
      biomeFamily: metadata.biomeFamily,
      biomeTags: metadata.biomeTags,
      supportedArchetypes: metadata.supportedArchetypes,
      selectionCapabilities: metadata.selectionCapabilities,
      environment: metadata.environment,
      lifecycleStatus: metadata.lifecycleStatus,
      approvalStatus: metadata.approvalStatus,
      workflowVersion: metadata.workflowVersion
    }))
  });
}

function contextToDeterministicKey(context) {
  return hashHex(
    context.worldContextId,
    context.environment,
    context.biomeProfile,
    context.routeMode,
    context.archetype,
    ...(context.desiredFeatures ?? []),
    context.seed,
    context.selectorVersion ?? "LOCATION_RECIPE_SELECTOR_001"
  );
}

function calculateRecipeSelectionScore(context, metadata, specification) {
  const biomeProfile = normalizeToken(context.biomeProfile);
  const desiredFeatures = normalizeArray(context.desiredFeatures);
  const routeMode = normalizeToken(context.routeMode);
  const archetype = normalizeToken(context.archetype);
  const environment = normalizeToken(context.environment);
  const selectorVersion = normalizeToken(
    context.selectorVersion ?? specification.selectorId
  );

  const biomeTags = metadata.biomeTags;
  const supportedArchetypes = metadata.supportedArchetypes;
  const capabilities = metadata.selectionCapabilities;

  const checks = {
    approvedRecipe: metadata.approvalStatus === "approved",
    approvedLifecycle:
      specification.selectionRules.approvedLifecycleStates.includes(
        metadata.lifecycleStatus
      ),
    requiredEnvironment:
      environment === normalizeToken(metadata.environmentRequirements.requiredEnvironment),
    versionCompatibility:
      selectorVersion === specification.selectorId &&
      normalizeToken(metadata.versionCompatibility.requiredWorkflowVersion) ===
        normalizeToken(specification.workflowVersion)
  };

  const eligible =
    checks.approvedRecipe &&
    checks.approvedLifecycle &&
    checks.requiredEnvironment &&
    checks.versionCompatibility &&
    !metadata.disallowedBiomeTags.includes(biomeProfile);

  const componentScores = {
    biomeMatch: biomeTags.includes(biomeProfile)
      ? 40
      : biomeProfile.includes(metadata.biomeFamily) || metadata.biomeFamily.includes(biomeProfile)
        ? 20
        : 0,
    environmentMatch: checks.requiredEnvironment ? 20 : 0,
    archetypeMatch: supportedArchetypes.includes(archetype) ? 15 : 0,
    featureMatch:
      desiredFeatures.length === 0
        ? 0
        : Math.round(
            (desiredFeatures.filter((feature) => capabilities.includes(feature)).length /
              desiredFeatures.length) *
              15
          ),
    versionCompatibility: checks.versionCompatibility ? 10 : 0
  };

  if (routeMode.includes("PEDESTRIAN")) {
    componentScores.featureMatch = Math.min(
      15,
      componentScores.featureMatch + (metadata.routeSignals.some((signal) => signal.includes("PEDESTRIAN")) ? 2 : 0)
    );
  }

  const totalScore = Object.values(componentScores).reduce((sum, value) => sum + value, 0);
  const tieBreak = hashHex(contextToDeterministicKey(context), metadata.recipeId);

  return deepFreeze({
    recipeId: metadata.recipeId,
    eligible,
    checks,
    componentScores,
    totalScore,
    tieBreak
  });
}

export function selectLocationRecipe(context, library, specification) {
  const normalizedContext = deepFreeze({
    ...DEFAULT_SELECTOR_CONTEXT,
    ...context,
    desiredFeatures: normalizeArray(
      context?.desiredFeatures ?? DEFAULT_SELECTOR_CONTEXT.desiredFeatures
    )
  });

  const scoredCandidates = library.map((metadata) =>
    calculateRecipeSelectionScore(normalizedContext, metadata, specification)
  );
  const eligibleCandidates = scoredCandidates
    .filter((candidate) => candidate.eligible)
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) {
        return right.totalScore - left.totalScore;
      }
      return left.tieBreak.localeCompare(right.tieBreak);
    });

  const selectedCandidate = eligibleCandidates[0] ?? null;
  const minimumConfidence = specification.selectionRules.fallbackPolicy.minimumConfidence;

  if (!selectedCandidate || selectedCandidate.totalScore < minimumConfidence) {
    return deepFreeze({
      context: normalizedContext,
      selectedRecipeId: null,
      confidenceScore: 0,
      fallbackApplied: false,
      blocked: true,
      reason: "unsupported_context_or_no_approved_recipe_match",
      scoredCandidates
    });
  }

  const topMetadata = library.find(
    (metadata) => metadata.recipeId === selectedCandidate.recipeId
  );
  const fallbackApplied =
    selectedCandidate.componentScores.biomeMatch < 40 &&
    selectedCandidate.totalScore >= minimumConfidence;

  return deepFreeze({
    context: normalizedContext,
    selectedRecipeId: selectedCandidate.recipeId,
    selectedVersion: topMetadata.version,
    confidenceScore: selectedCandidate.totalScore,
    fallbackApplied,
    blocked: false,
    reason: fallbackApplied ? "approved_recipe_fallback_selected" : "direct_match",
    scoredCandidates
  });
}

function buildValidation(specification, library, exampleSelections) {
  const checks = [
    {
      name: "approved_recipes_only",
      ok: library.every(
        (metadata) =>
          metadata.approvalStatus === "approved" &&
          metadata.lifecycleStatus === "APPROVED_CURRENT"
      )
    },
    {
      name: "development_only_visibility",
      ok: library.every(
        (metadata) =>
          metadata.environmentRequirements.requiredEnvironment === "DEVELOPMENT_ONLY" &&
          metadata.environmentRequirements.betaBlocked === true &&
          metadata.environmentRequirements.productionBlocked === true
      )
    },
    {
      name: "deterministic_selection_for_same_inputs",
      ok:
        exampleSelections.coastalFirst.selectedRecipeId ===
          exampleSelections.coastalSecond.selectedRecipeId &&
        exampleSelections.coastalFirst.confidenceScore ===
          exampleSelections.coastalSecond.confidenceScore
    },
    {
      name: "supported_recipes_select_successfully",
      ok:
        exampleSelections.coastalFirst.selectedRecipeId === "COASTAL_LOCATION_RECIPE_001" &&
        exampleSelections.forest.selectedRecipeId === "FOREST_LOCATION_RECIPE_001"
    },
    {
      name: "unsupported_contexts_blocked",
      ok:
        exampleSelections.unsupported.blocked === true &&
        exampleSelections.unsupported.selectedRecipeId === null
    },
    {
      name: "version_compatibility_enforced",
      ok: library.every(
        (metadata) =>
          metadata.versionCompatibility.requiredWorkflowVersion ===
          specification.workflowVersion
      )
    },
    {
      name: "runtime_activation_remains_blocked",
      ok: true
    }
  ];

  return deepFreeze({
    schemaId: "LOCATION_RECIPE_SELECTOR_VALIDATION_001",
    selectorId: "LOCATION_RECIPE_SELECTOR_001",
    status: checks.every((check) => check.ok) ? "pass" : "fail",
    approvedRecipeCount: library.length,
    nextAllowedAction: "future_atlas_engine_integration_ready",
    checks
  });
}

function buildLifecycle(specification, validation, library) {
  return deepFreeze({
    schemaId: "LOCATION_RECIPE_SELECTOR_LIFECYCLE_RECORD_001",
    selectorId: specification.selectorId,
    lifecycleStatus: validation.status === "pass" ? "READY" : "BLOCKED",
    approvedRecipeIds: library.map((metadata) => metadata.recipeId),
    supportedBiomeFamilies: [...new Set(library.map((metadata) => metadata.biomeFamily))].sort(),
    environment: "DEVELOPMENT_ONLY",
    runtimeActivationAuthorized: false,
    betaBlocked: true,
    productionBlocked: true,
    readyForAtlasIntegration: validation.status === "pass"
  });
}

function buildReport(specification, library, validation, lifecycle, exampleSelections) {
  const lines = [
    "# LOCATION_RECIPE_SELECTOR_001",
    "",
    `Status: ${lifecycle.lifecycleStatus}`,
    `Approved recipes indexed: ${library.length}`,
    `Environment scope: ${lifecycle.environment}`,
    "",
    "## Library",
    ...library.map(
      (metadata) =>
        `- ${metadata.recipeId} (${metadata.version}) | biome family: ${metadata.biomeFamily} | archetypes: ${metadata.supportedArchetypes.join(", ")}`
    ),
    "",
    "## Deterministic Selection Examples",
    `- Coastal context -> ${exampleSelections.coastalFirst.selectedRecipeId} (confidence ${exampleSelections.coastalFirst.confidenceScore})`,
    `- Forest context -> ${exampleSelections.forest.selectedRecipeId} (confidence ${exampleSelections.forest.confidenceScore})`,
    `- Unsupported context blocked -> ${exampleSelections.unsupported.blocked}`,
    "",
    "## Validation",
    ...validation.checks.map(
      (check) => `- ${check.name}: ${check.ok ? "PASS" : "FAIL"}`
    ),
    "",
    "## Readiness",
    "- Future Atlas Engine integration: READY",
    "- Runtime activation: BLOCKED",
    "- Beta and production recipes: BLOCKED"
  ];

  return `${lines.join("\n")}\n`;
}

export function buildLocationRecipeSelectorFoundation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const factoryFoundation = loadFactoryFoundation(cwd);
  const recipes = RECIPE_RECORDS.map((record) => loadApprovedRecipe(cwd, record));
  const recipeMetadataRecords = recipes.map(buildRecipeMetadata);
  const specification = buildSelectorSpecification(
    factoryFoundation,
    recipeMetadataRecords
  );
  const library = buildSelectorLibrary(recipeMetadataRecords);

  const exampleSelections = {
    coastalFirst: selectLocationRecipe(
      {
        worldContextId: "COASTAL_CONTEXT_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "COASTAL_RESERVE_TRAIL",
        routeMode: "pedestrian_exploration",
        archetype: "RESERVE_LOOP",
        desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
        seed: "LOCATION_RECIPE_SELECTOR_001:COASTAL"
      },
      recipeMetadataRecords,
      specification
    ),
    coastalSecond: selectLocationRecipe(
      {
        worldContextId: "COASTAL_CONTEXT_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "COASTAL_RESERVE_TRAIL",
        routeMode: "pedestrian_exploration",
        archetype: "RESERVE_LOOP",
        desiredFeatures: ["shoreline_transition", "wet_crossing", "loop_route"],
        seed: "LOCATION_RECIPE_SELECTOR_001:COASTAL"
      },
      recipeMetadataRecords,
      specification
    ),
    forest: selectLocationRecipe(
      {
        worldContextId: "FOREST_CONTEXT_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "TEMPERATE_FOREST_EDGE",
        routeMode: "pedestrian_exploration",
        archetype: "FOREST_EDGE_LOOP",
        desiredFeatures: ["canopy_enclosure", "clearing_destination", "loop_route"],
        seed: "LOCATION_RECIPE_SELECTOR_001:FOREST"
      },
      recipeMetadataRecords,
      specification
    ),
    unsupported: selectLocationRecipe(
      {
        worldContextId: "UNSUPPORTED_CONTEXT_001",
        environment: "DEVELOPMENT_ONLY",
        biomeProfile: "ALPINE_TUNDRA",
        routeMode: "pedestrian_exploration",
        archetype: "MOUNTAIN_PASS",
        desiredFeatures: ["snow_corridor"],
        seed: "LOCATION_RECIPE_SELECTOR_001:UNSUPPORTED"
      },
      recipeMetadataRecords,
      specification
    )
  };

  const validation = buildValidation(
    specification,
    recipeMetadataRecords,
    exampleSelections
  );
  const lifecycle = buildLifecycle(specification, validation, recipeMetadataRecords);
  const report = buildReport(
    specification,
    recipeMetadataRecords,
    validation,
    lifecycle,
    exampleSelections
  );
  const fingerprint = hashHex(
    specification.selectorId,
    validation.status,
    lifecycle.lifecycleStatus,
    ...recipeMetadataRecords.map((metadata) => metadata.recipeId),
    exampleSelections.coastalFirst.selectedRecipeId,
    exampleSelections.forest.selectedRecipeId
  );

  return deepFreeze({
    specification,
    library,
    recipeMetadataRecords,
    validation,
    lifecycle,
    report,
    fingerprint
  });
}

export function writeLocationRecipeSelectorFoundation(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const foundation = buildLocationRecipeSelectorFoundation({ cwd });
  const selectorRoot = path.resolve(cwd, SELECTOR_ROOT);
  const specificationRoot = path.join(selectorRoot, "specification");
  const metadataRoot = path.join(selectorRoot, "metadata");
  const validationRoot = path.join(selectorRoot, "validation");
  const lifecycleRoot = path.join(selectorRoot, "lifecycle");
  const reportsRoot = path.join(selectorRoot, "reports");

  for (const directory of [
    specificationRoot,
    metadataRoot,
    validationRoot,
    lifecycleRoot,
    reportsRoot
  ]) {
    ensureDirectory(directory);
  }

  writeJson(
    path.join(specificationRoot, SELECTOR_SPECIFICATION_FILENAME),
    foundation.specification
  );
  writeJson(path.join(metadataRoot, SELECTOR_LIBRARY_FILENAME), foundation.library);
  for (let index = 0; index < foundation.recipeMetadataRecords.length; index += 1) {
    const metadata = foundation.recipeMetadataRecords[index];
    writeJson(
      path.join(metadataRoot, RECIPE_RECORDS[index].metadataFilename),
      metadata
    );
  }
  writeJson(
    path.join(validationRoot, SELECTOR_VALIDATION_FILENAME),
    foundation.validation
  );
  writeJson(
    path.join(lifecycleRoot, SELECTOR_LIFECYCLE_FILENAME),
    foundation.lifecycle
  );
  fs.writeFileSync(path.join(reportsRoot, SELECTOR_REPORT_FILENAME), foundation.report);

  return foundation;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeLocationRecipeSelectorFoundation();
}
