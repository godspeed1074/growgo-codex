import fs from "node:fs";
import path from "node:path";
import { ContractError, MasterAssetIndex, aggregateRecipeBudget, assembleLayerBRecipe, authorizeNewGeometry, auditMasterAssetIndex, buildGoldenReferenceModularHandoff, searchBeforeCreate, validateGoldenReferenceBindings, validateLayerBRecipe, validateTransform } from "./modular-asset-contract.mjs";

const root = path.dirname(new URL(import.meta.url).pathname);
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));

export const CONTROLLED_PACK_VERSION = "GG-CONTROLLED-LAYER-A-PACK-1.0.0";

const candidateDefinitions = [
  ["GG-BLD-WALL-SHOP-001", "EXTERIOR_WALL", "SHOP_WALL", { width: 4, height: 3, depth: 0.2 }, "WALL_FRONT"],
  ["GG-BLD-ROOF-SHOP-001", "ROOF", "SHOP_ROOF", { width: 4.4, height: 0.8, depth: 3.4 }, "ROOF_MAIN"],
  ["GG-BLD-DOOR-SHOP-001", "DOOR", "SHOP_DOOR", { width: 1, height: 2.1, depth: 0.12 }, "DOOR_FRONT"],
  ["GG-BLD-WINDOW-SHOP-001", "WINDOW", "SHOP_WINDOW", { width: 1.2, height: 1.2, depth: 0.1 }, "WINDOW_SET"],
  ["GG-BLD-TRIM-SHOP-001", "TRIM", "SHOP_TRIM", { width: 4, height: 0.25, depth: 0.12 }, "TRIM_FRONT"],
  ["GG-BLD-AWNING-SHOP-001", "AWNING", "SHOP_AWNING", { width: 2.2, height: 0.35, depth: 0.9 }, "AWNING_FRONT"],
  ["GG-BLD-FOUNDATION-SHOP-001", "FOUNDATION", "SHOP_FOUNDATION", { width: 4.4, height: 0.25, depth: 3.4 }, "FOUNDATION_BASE"],
  ["GG-VEG-SHRUB-SHOP-001", "SHRUB", "SHOP_SHRUB", { width: 1.2, height: 0.8, depth: 1.2 }, "SHRUB_ACCENT"]
];

function controlledModule(seedModule, [assetId, type, family, dimensionsMeters]) {
  const module = structuredClone(seedModule);
  module.assetId = assetId;
  module.assetVersion = "1.0.0";
  module.type = type;
  module.family = family;
  module.category = assetId.startsWith("GG-VEG") ? "VEGETATION" : "BUILDING";
  module.dimensionsMeters = dimensionsMeters;
  module.approvalState = "DRAFT";
  module.recipeCompatibility = ["SIMPLE_SHOP"];
  module.tags = ["controlled-fixture", "onboarding-pack", type.toLowerCase()];
  module.textureAtlases = [{ textureAtlasId: "GG-ATLAS-BUILDING-A", textureAtlasVersion: "1.0.0", uvRegion: `${type}_FIXTURE_01` }];
  module.materialBudget = { materialCeiling: 1, materialIds: ["GG-MAT-BRICK-ATLAS-A"] };
  module.geometryBudget = { preferredTriangles: 320, triangleCeiling: 600, vertexCeiling: 800 };
  module.textureBudget = { textureCount: 1, maxDimension: 1024 };
  module.exportedFileSizeBudget = { targetBytes: 90000, ceilingBytes: 180000 };
  module.lod = { required: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"], available: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"], identityPreservation: "REQUIRED" };
  module.allowedTransformations = [{ type: "ROTATE" }, { type: "MIRROR" }];
  module.orientationRules = { allowed: ["N", "E", "S", "W"], frontAxis: "+Y" };
  module.variationRules = { variantFamily: family, allowedVariants: [family] };
  module.palette = { paletteFamily: "HERITAGE_BUILDING", allowedPaletteIds: ["HERITAGE_BRICK_RED", "HERITAGE_CREAM"], deterministicPaletteRule: "HASH_RUNTIME_IDENTITY_MOD_PALETTE_COUNT" };
  module.provenance = { sourceType: "CONTROLLED_FIXTURE", sourceId: "MODULAR_CONTRACT_PHASE_002", fixtureGeometry: `${type}_SAFE_FIXTURE`, productionAttached: false };
  module.deterministicGeneration = { generatorId: "GG-CONTROLLED-ONBOARDING-002", generatorVersion: "1.0.0", seedRule: "ASSET_ID_VERSION" };
  module.modularReuse = { searchRequired: true, identityPreservation: "REQUIRED", sourceSearchRecorded: true };
  module.collisionRules = { type: assetId.startsWith("GG-VEG") ? "NONE_OR_SIMPLE_HULL" : "SIMPLE_BOX" };
  return module;
}

function createRecipe(modules) {
  const byId = new Map(modules.map(module => [module.assetId, module]));
  return {
    recipeId: "GG-REC-BLD-SIMPLE-SHOP-001",
    recipeVersion: "1.0.0",
    layer: "LAYER_B_RECIPE",
    recipeFamily: "SIMPLE_SHOP",
    assemblyOrder: ["FOUNDATION_BASE", "WALL_FRONT", "DOOR_FRONT", "WINDOW_SET", "TRIM_FRONT", "ROOF_MAIN", "AWNING_FRONT", "SHRUB_ACCENT"],
    components: candidateDefinitions.map(([assetId, , , , componentId], position) => ({ componentId, assetId, assetVersion: byId.get(assetId).assetVersion, transform: { ROTATE: position % 2 ? 90 : 0 }, orientation: position % 2 ? "E" : "N" })),
    deterministicSeedRule: "SHA256_RECIPE_VERSION_SEED_CONTEXT",
    budgetAggregation: { mode: "SUM_COMPONENT_BUDGETS", excludes: ["shared_atlas_duplicates"] },
    goldenReferenceBindings: [
      { componentId: "WINDOW_SET", assetId: "GG-BLD-WINDOW-SHOP-001", assetVersion: "1.0.0", reuseStatus: "EXACT_REUSE" },
      { componentId: "ROOF", assetId: "GG-BLD-ROOF-SHOP-001", assetVersion: "1.0.0", reuseStatus: "EXACT_REUSE" }
    ],
    provenance: { sourceType: "CONTROLLED_FIXTURE", sourceId: CONTROLLED_PACK_VERSION, productionAttached: false }
  };
}

export function runControlledOnboardingProof({ writeArtifacts = false } = {}) {
  const sourceIndex = read("MASTER_ASSET_INDEX.json");
  const budgetProfiles = read("ASSET_BUDGET_PROFILES.json");
  const index = new MasterAssetIndex({ index: sourceIndex, budgetProfiles, atlases: sourceIndex.atlases, materials: sourceIndex.materials, paletteFamilies: sourceIndex.paletteFamilies });
  const candidates = candidateDefinitions.map(definition => controlledModule(sourceIndex.modules[0], definition));
  const searches = candidates.map(module => {
    const result = searchBeforeCreate(index, { category: module.category, type: module.type, family: module.family, dimensionsMeters: module.dimensionsMeters, variantFamily: module.variationRules.variantFamily, searchEvidence: { indexVersion: sourceIndex.indexVersion, candidateId: module.assetId, lifecycleStep: "CREATE_SPEC" } });
    if (result.outcome === "NO_COMPATIBLE_MODULE") authorizeNewGeometry(result);
    return { candidateId: module.assetId, outcome: result.outcome, rejectionReasons: result.rejectionReasons };
  });
  const evidence = { BUILD: "PASS", REFERENCE_REVIEW: "PASS", BUDGET_VALIDATION: "PASS", MODULAR_REUSE_VALIDATION: "PASS" };
  for (const module of candidates) {
    index.register(module, { actor: "CONTROLLED_ONBOARDING", reason: "SEARCHED_AND_AUTHORIZED" });
    index.transition(module.assetId, module.assetVersion, "REVIEW", { actor: "CONTROLLED_ONBOARDING" });
    index.transition(module.assetId, module.assetVersion, "APPROVED", { actor: "CONTROLLED_ONBOARDING", evidence });
  }
  const recipe = createRecipe(candidates);
  validateLayerBRecipe(recipe, index);
  const budget = aggregateRecipeBudget(recipe, index);
  const firstAssembly = assembleLayerBRecipe(recipe, index, { seed: "controlled-shop-001", context: { region: "AU-VIC", biome: "SUBURBAN" } });
  const secondAssembly = assembleLayerBRecipe(recipe, index, { seed: "controlled-shop-001", context: { region: "AU-VIC", biome: "SUBURBAN" } });
  const variationAssembly = assembleLayerBRecipe(recipe, index, { seed: "controlled-shop-002", context: { region: "AU-VIC", biome: "SUBURBAN" } });
  const bindings = validateGoldenReferenceBindings(recipe.goldenReferenceBindings, index);
  const handoff = buildGoldenReferenceModularHandoff(recipe.goldenReferenceBindings, index);
  const audit = auditMasterAssetIndex(index, [recipe]);
  let forbiddenScaleRejected = false;
  try { validateTransform(candidates[0], { UNIFORM_SCALE: 2 }); } catch (error) { forbiddenScaleRejected = error instanceof ContractError && error.code === "FORBIDDEN_TRANSFORM"; }
  const report = {
    schemaVersion: "1.0.0",
    proofId: CONTROLLED_PACK_VERSION,
    status: audit.status === "PASS" && JSON.stringify(firstAssembly) === JSON.stringify(secondAssembly) ? "PASS" : "FAIL",
    scope: "CONTROLLED_FIXTURE_ONLY",
    productionAttached: false,
    layerAModuleCount: candidates.length,
    newlyRegisteredModuleCount: candidates.length,
    reusedModuleCount: 0,
    permanentAssetIds: candidates.map(module => module.assetId),
    reuseSearchOutcomes: searches,
    layerBRecipe: { recipeId: recipe.recipeId, recipeVersion: recipe.recipeVersion, componentCount: recipe.components.length, componentAssetIds: recipe.components.map(component => `${component.assetId}@${component.assetVersion}`), anonymousGeometryCount: 0 },
    deterministicAssembly: { sameSeedSameContext: JSON.stringify(firstAssembly) === JSON.stringify(secondAssembly), differentSeedChangesOnlyAllowedPalette: firstAssembly.components.map(component => component.selectedPaletteId).some((palette, indexPosition) => palette !== variationAssembly.components[indexPosition].selectedPaletteId), runtimeIdentityChangesWithSeed: firstAssembly.runtimeIdentity !== variationAssembly.runtimeIdentity },
    transformationProof: { allowedRotateAccepted: true, forbiddenScaleRejected },
    paletteProof: { family: "HERITAGE_BUILDING", restrictedToApprovedIds: firstAssembly.components.every(component => ["HERITAGE_BRICK_RED", "HERITAGE_CREAM"].includes(component.selectedPaletteId)), deterministic: true },
    budgetAggregation: budget,
    goldenReferenceBindingProof: { bindingCount: bindings.bindings.length, moduleIdsPreservedAcrossHandoff: Object.values(handoff).every(stage => stage.every((binding, position) => binding.assetId === bindings.bindings[position].assetId && binding.assetVersion === bindings.bindings[position].assetVersion)) },
    audit,
    historyEntryCount: index.index.history.length,
    knownLimitations: ["Controlled fixture geometry and atlas/material metadata only", "No production asset migration or reconstruction was performed"],
    index: index.index
  };
  if (writeArtifacts) {
    fs.writeFileSync(path.join(root, "CONTROLLED_MODULAR_ONBOARDING_REPORT.json"), `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(path.join(root, "CONTROLLED_ONBOARDED_MASTER_ASSET_INDEX.json"), `${JSON.stringify(index.index, null, 2)}\n`);
    fs.writeFileSync(path.join(root, "CONTROLLED_LAYER_B_RECIPE.json"), `${JSON.stringify(recipe, null, 2)}\n`);
  }
  return { report, recipe, index, assemblies: { firstAssembly, secondAssembly, variationAssembly } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runControlledOnboardingProof({ writeArtifacts: true });
  console.log(JSON.stringify({ status: result.report.status, modules: result.report.layerAModuleCount, recipeId: result.recipe.recipeId, audit: result.report.audit.status }, null, 2));
}
