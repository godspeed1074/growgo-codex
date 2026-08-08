import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation,
  getDeveloperOnlyAtlasAttachmentMetadataGlbPreparationStatus,
  resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation
} from "../client/developer-only-atlas-attachment-metadata-glb-preparation.mjs";
import {
  createDeveloperOnlyAtlasWorldPopulationPlanner,
  createDeveloperOnlyAtlasWorldPopulationPlan,
  getDeveloperOnlyAtlasWorldPopulationPlannerStatus
} from "../client/developer-only-atlas-world-population-planner.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const sessionDocPath = path.join(
  repoRoot,
  "GROWGO_SESSION_212_62_ATTACHMENT_METADATA_GLB_PREPARATION.md"
);

function feature({
  featureId = "feature-001",
  featureClass = "coastal_green",
  latitude = -38.13565,
  longitude = 144.34905,
  area = 220,
  width = 40,
  height = 20,
  orientationHint = null,
  deterministicFeatureIdentity = featureId,
  sourceClassification = "green:near_coast"
} = {}) {
  return {
    featureId,
    featureClass,
    coordinate: { latitude, longitude },
    area,
    footprintScalars: { width, height },
    orientationHint,
    deterministicFeatureIdentity,
    sourceClassification
  };
}

function plannerInput(overrides = {}) {
  return {
    regionId: "BELLARINE",
    packageId: "ATLAS_DEVELOPER_PACKAGE",
    recipeId: "COASTAL_LOCATION_RECIPE_001",
    selectorSeed: "ATTACHMENT_METADATA_SELECTOR_001",
    viewportId: "ATTACHMENT_METADATA_VIEWPORT_001",
    performanceBudget: {
      maximumCandidateFeatures: 64,
      maximumCommands: 24,
      maximumVegetationCommands: 18,
      maximumBuildingCommands: 4
    },
    features: [],
    relationshipContext: { roadWays: [] },
    ...overrides
  };
}

function resolveMetadata(overrides = {}) {
  const registry = createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation();
  return resolveDeveloperOnlyAtlasAttachmentMetadataGlbPreparation(registry, {
    surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_COASTAL_VEGETATION_001",
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_COASTAL_VEGETATION_001",
    componentRecipeId: "COMPONENT_RECIPE_VEGETATION_NATIVE_CLUSTER_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_COASTAL_NATIVE_VEGETATION_001",
    ...overrides
  });
}

test("1. attachment metadata stable", () => {
  const first = resolveMetadata();
  const second = resolveMetadata();

  assert.deepEqual(first, second);
  assert.equal(first.socketMetadataCount > 0, true);
  assert.equal(first.componentMetadataCount > 0, true);
});

test("2. socket mappings deterministic", () => {
  const result = resolveMetadata({
    surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_HERITAGE_CIVIC_001",
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_001",
    componentRecipeId: "COMPONENT_RECIPE_CIVIC_HERITAGE_ENVELOPE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_HERITAGE_CIVIC_FOREGROUND_001"
  });

  assert.equal(
    result.attachmentMetadataProfileId,
    "ATTACHMENT_METADATA_PROFILE_HERITAGE_CIVIC_001"
  );
  assert.equal(
    result.glbPreparationProfileId,
    "GLB_PREPARATION_PROFILE_HERITAGE_CIVIC_001"
  );
});

test("3. GLB preparation valid", () => {
  const result = resolveMetadata({
    surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_URBAN_COMMERCIAL_001",
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_URBAN_COMMERCIAL_001",
    componentRecipeId: "COMPONENT_RECIPE_COMMERCIAL_FRONTAGE_001",
    assetAssemblyProfileId:
      "ASSET_ASSEMBLY_PROFILE_URBAN_COMMERCIAL_FRONTAGE_001"
  });

  assert.equal(result.matched, true);
  assert.equal(typeof result.glbPreparationProfileId, "string");
});

test("4. invalid metadata rejected", () => {
  const result = resolveMetadata({
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_HERITAGE_CIVIC_001"
  });

  assert.equal(result.matched, false);
  assert.equal(
    result.reasonCode,
    "ATTACHMENT_METADATA_ANCHOR_SET_INCOMPATIBLE"
  );
});

test("5. same input same output", () => {
  const first = resolveMetadata({
    surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_001",
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_001",
    componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
    assetAssemblyProfileId: "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001"
  });
  const second = resolveMetadata({
    surfaceMappingProfileId: "SURFACE_MAPPING_PROFILE_INDUSTRIAL_EDGE_001",
    componentAnchorSetId: "COMPONENT_ANCHOR_SET_INDUSTRIAL_EDGE_001",
    componentRecipeId: "COMPONENT_RECIPE_STREETSCAPE_EDGE_INDUSTRIAL_001",
    assetAssemblyProfileId: "ASSET_ASSEMBLY_PROFILE_INDUSTRIAL_EDGE_001"
  });

  assert.deepEqual(first, second);
});

test("6. budgets preserved and planner exposes attachment metadata diagnostics", () => {
  const planner = createDeveloperOnlyAtlasWorldPopulationPlanner();
  const plan = createDeveloperOnlyAtlasWorldPopulationPlan(
    planner,
    plannerInput({
      features: [
        feature({
          featureId: "coastal-plan-001",
          featureClass: "coastal_green",
          sourceClassification: "green:near_coast"
        }),
        feature({
          featureId: "heritage-plan-001",
          featureClass: "civic_site",
          latitude: -38.13545,
          longitude: 144.34935,
          sourceClassification: "amenity:community_centre"
        })
      ],
      relationshipContext: { roadWays: [{ id: "road-1" }, { id: "road-2" }] }
    })
  );
  const status = getDeveloperOnlyAtlasWorldPopulationPlannerStatus(planner);

  assert.equal(plan.commands.length <= 24, true);
  assert.equal(plan.attachmentMetadataDecisions.length >= 1, true);
  assert.equal(typeof status.attachmentMetadataProfileId, "string");
  assert.equal(typeof status.glbPreparationProfileId, "string");
  assert.equal(typeof status.socketMetadataCount, "number");
  assert.equal(typeof status.componentMetadataCount, "number");
  assert.equal(typeof status.attachmentMetadataReason, "string");
  assert.equal(
    plan.resolvedFeatureRecipes.every(
      (entry) =>
        "attachmentMetadataProfileId" in entry &&
        "glbPreparationProfileId" in entry &&
        "socketMetadataCount" in entry &&
        "componentMetadataCount" in entry &&
        "attachmentMetadataReason" in entry
    ),
    true
  );
});

test("7. automatic controller regression passes planning-safe", () => {
  const registry = createDeveloperOnlyAtlasAttachmentMetadataGlbPreparation();
  const status =
    getDeveloperOnlyAtlasAttachmentMetadataGlbPreparationStatus(registry);
  const source = fs.readFileSync(sessionDocPath, "utf8");

  assert.equal(status.registeredAttachmentMetadataRuleCount >= 5, true);
  assert.equal(status.canonicalSafetyFlags.runtimeExecutionEnabled, false);
  assert.equal(status.canonicalSafetyFlags.mapAttachmentAllowed, false);
  assert.equal(
    status.canonicalSafetyFlags.automaticRendererExecutionAllowed,
    false
  );
  assert.equal(status.canonicalSafetyFlags.lifecycleExecutionEnabled, false);
  assert.doesNotThrow(() => JSON.stringify(status));
  assert.match(source, /attachmentMetadataProfileId/);
  assert.match(source, /glbPreparationProfileId/);
  assert.match(source, /socketMetadataCount/);
  assert.match(source, /componentMetadataCount/);
  assert.match(source, /attachmentMetadataReason/);
  assert.match(source, /runtimeExecutionEnabled = false/);
});
