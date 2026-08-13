import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  MasterAssetIndex, ContractError, validateAssetId, validateSemver,
  validateLayerAModule, validateLayerBRecipe, validateTransform,
  searchBeforeCreate, authorizeNewGeometry, validateGoldenReferenceBindings,
  buildGoldenReferenceModularHandoff, assembleLayerBRecipe, auditMasterAssetIndex
} from "../asset-factory/modular/modular-asset-contract.mjs";

const modularRoot = path.resolve(import.meta.dirname, "..", "asset-factory", "modular");
const read = (name) => JSON.parse(fs.readFileSync(path.join(modularRoot, name), "utf8"));
const sourceIndex = read("MASTER_ASSET_INDEX.json");
const budgetProfiles = read("ASSET_BUDGET_PROFILES.json");
const context = { budgetProfiles, atlases: sourceIndex.atlases, materials: sourceIndex.materials, paletteFamilies: sourceIndex.paletteFamilies };
const makeIndex = () => new MasterAssetIndex({ index: sourceIndex, ...context });
const baseModule = () => structuredClone(sourceIndex.modules[0]);
const request = (overrides = {}) => ({ category: "BUILDING", type: "EXTERIOR_WALL", family: "HERITAGE_BRICK", dimensionsMeters: { width: 4, height: 3, depth: 0.2 }, variantFamily: "BRICK", searchEvidence: { indexVersion: "1.0.0", searchedAtLifecycleStep: "CREATE_SPEC" }, ...overrides });
const recipe = (overrides = {}) => ({ recipeId: "GG-REC-BLD-BAKERY-001", recipeVersion: "1.0.0", layer: "LAYER_B_RECIPE", recipeFamily: "BAKERY", components: [{ componentId: "WALL_FRONT", assetId: "GG-BLD-WALL-BRICK-001", assetVersion: "1.0.0", transform: { ROTATE: 90 } }], deterministicSeedRule: "SHA256_RECIPE_VERSION_SEED_CONTEXT", provenance: { source: "CONTROLLED_FIXTURE" }, ...overrides });
const throwsCode = (fn, code) => assert.throws(fn, error => error instanceof ContractError && error.code === code);

test("permanent asset ID registration", () => {
  const index = makeIndex(); const module = baseModule(); module.assetId = "GG-BLD-DOOR-SHOP-002"; module.assetVersion = "0.1.0"; module.type = "SHOP_DOOR"; module.approvalState = "DRAFT";
  assert.equal(index.register(module).assetId, "GG-BLD-DOOR-SHOP-002");
});

test("duplicate ID/version rejection", () => {
  const index = makeIndex(); throwsCode(() => index.register(baseModule()), "DUPLICATE_ASSET_VERSION");
});

test("version registration is independent from permanent identity", () => {
  const index = makeIndex(); const module = baseModule(); module.assetVersion = "1.1.0"; module.approvalState = "DRAFT";
  index.register(module); assert.equal(index.lookup({ assetId: module.assetId }).length, 2);
});

test("invalid version rejection", () => throwsCode(() => validateSemver("v2"), "INVALID_VERSION"));

test("Layer A validation", () => assert.equal(validateLayerAModule(baseModule(), context).ok, true));

test("Layer B validation", () => assert.equal(validateLayerBRecipe(recipe(), makeIndex()).ok, true));

test("Master Index lookup across indexed metadata", () => {
  const found = makeIndex().lookup({ category: "BUILDING", type: "EXTERIOR_WALL", family: "HERITAGE_BRICK", recipeUse: "BAKERY", material: "GG-MAT-BRICK-ATLAS-A", textureAtlas: "GG-ATLAS-BUILDING-A", dimensions: { width: 4 }, allowedTransformations: ["ROTATE"], tags: ["modular"] });
  assert.equal(found[0].assetId, "GG-BLD-WALL-BRICK-001");
});

test("exact reuse discovery", () => assert.equal(searchBeforeCreate(makeIndex(), request()).outcome, "EXACT_REUSE"));

test("parametric reuse discovery", () => assert.equal(searchBeforeCreate(makeIndex(), request({ dimensionsMeters: { width: 5, height: 3, depth: 0.2 } })).outcome, "PARAMETRIC_REUSE"));

test("no-compatible-module result records rejection", () => {
  const result = searchBeforeCreate(makeIndex(), request({ dimensionsMeters: { width: 10, height: 8, depth: 2 } })); assert.equal(result.outcome, "NO_COMPATIBLE_MODULE"); assert.equal(result.rejectionReasons[0].reason, "DIMENSION_MISMATCH");
});

test("allowed transform", () => assert.equal(validateTransform(baseModule(), { MIRROR: true, BOUNDED_SCALE_X: 1.2 }).ok, true));

test("forbidden transform", () => throwsCode(() => validateTransform(baseModule(), { UNIFORM_SCALE: 2 }), "FORBIDDEN_TRANSFORM"));

test("budget profile resolution", () => assert.equal(validateLayerAModule(baseModule(), context).ok, true));

test("missing budget rejection", () => { const module = baseModule(); module.mobileBudgetProfile = "UNLIMITED"; throwsCode(() => validateLayerAModule(module, context), "MISSING_BUDGET_PROFILE"); });

test("atlas reference validation", () => assert.equal(validateLayerAModule(baseModule(), context).ok, true));

test("missing atlas rejection", () => { const module = baseModule(); module.textureAtlases[0].textureAtlasId = "GG-ATLAS-MISSING"; throwsCode(() => validateLayerAModule(module, context), "MISSING_ATLAS_REFERENCE"); });

test("LOD requirement validation", () => assert.deepEqual(baseModule().lod.available, ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]));

test("missing LOD rejection", () => { const module = baseModule(); module.lod.available = ["LOD_CLOSE"]; throwsCode(() => validateLayerAModule(module, context), "MISSING_REQUIRED_LOD"); });

test("recipe component resolution", () => assert.equal(validateLayerBRecipe(recipe(), makeIndex()).ok, true));

test("missing module rejection", () => { const value = recipe(); value.components[0].assetId = "GG-BLD-WALL-MISSING-999"; throwsCode(() => validateLayerBRecipe(value, makeIndex()), "MISSING_MODULE"); });

test("deprecated module handling", () => {
  const index = makeIndex(); index.transition("GG-BLD-WALL-BRICK-001", "1.0.0", "DEPRECATED"); throwsCode(() => validateLayerBRecipe(recipe(), index), "DEPRECATED_MODULE_NOT_ALLOWED"); const allowed = recipe(); allowed.components[0].allowDeprecated = true; assert.equal(validateLayerBRecipe(allowed, index).ok, true);
});

test("module identity preservation across versions", () => {
  const index = makeIndex(); const module = baseModule(); module.assetVersion = "2.0.0"; module.type = "ROOF"; module.approvalState = "DRAFT"; throwsCode(() => index.register(module), "MODULE_IDENTITY_CHANGED");
});

test("deterministic recipe output", () => {
  const first = assembleLayerBRecipe(recipe(), makeIndex(), { seed: "town-42", context: { region: "AU-VIC" } }); const second = assembleLayerBRecipe(recipe(), makeIndex(), { seed: "town-42", context: { region: "AU-VIC" } }); assert.deepEqual(first, second); assert.equal(first.layer, "LAYER_C_RUNTIME_ASSEMBLY");
});

test("colour-palette restriction", () => throwsCode(() => validateTransform(baseModule(), { APPROVED_TINT: "HOT_PINK" }), "PALETTE_RESTRICTION_VIOLATION"));

test("modular search-before-create gate", () => {
  throwsCode(() => searchBeforeCreate(makeIndex(), request({ searchEvidence: null })), "SEARCH_BEFORE_CREATE_REQUIRED"); throwsCode(() => authorizeNewGeometry({ outcome: "EXACT_REUSE", rejectionReasons: [] }), "NEW_GEOMETRY_NOT_AUTHORIZED"); assert.equal(authorizeNewGeometry(searchBeforeCreate(makeIndex(), request({ type: "GABLE" }))).authorized, true);
});

test("anonymous geometry rejection", () => { const value = recipe(); value.components[0].geometry = { vertices: [0, 1, 2] }; throwsCode(() => validateLayerBRecipe(value, makeIndex()), "ANONYMOUS_GEOMETRY_REJECTED"); });

test("Golden Reference component binding", () => {
  const bindings = [{ componentId: "WINDOW_SET", assetId: "GG-BLD-WALL-BRICK-001", assetVersion: "1.0.0", reuseStatus: "EXACT_REUSE" }]; const result = validateGoldenReferenceBindings(bindings, makeIndex()); const handoff = buildGoldenReferenceModularHandoff(bindings, makeIndex()); assert.equal(result.ok, true); assert.equal(result.bindings[0].componentId, "WINDOW_SET"); assert.deepEqual(handoff.analyzer, handoff.publishing);
});

test("Master Index audit", () => {
  const result = auditMasterAssetIndex(makeIndex(), [recipe()]); assert.equal(result.status, "PASS"); assert.equal(result.generatedDeterministically, true);
});

test("history/version preservation", () => {
  const index = makeIndex(); const original = index.resolve("GG-BLD-WALL-BRICK-001", "1.0.0"); const next = baseModule(); next.assetVersion = "1.1.0"; next.approvalState = "DRAFT"; index.register(next, { actor: "TEST", reason: "NON_DESTRUCTIVE_REVISION" }); assert.deepEqual(index.resolve(original.assetId, original.assetVersion), original); assert.equal(index.index.history.at(-1).assetVersion, "1.1.0"); assert.equal(index.index.history.length, 2);
});

test("asset layer and permanent ID patterns are machine enforced", () => {
  assert.equal(validateAssetId("GG-VEG-FOLIAGE-EUCALYPTUS-001"), "GG-VEG-FOLIAGE-EUCALYPTUS-001"); const module = baseModule(); module.layer = "LAYER_B_RECIPE"; throwsCode(() => validateLayerAModule(module, context), "INVALID_ASSET_LAYER");
});

test("registration lifecycle requires review evidence before approval", () => {
  const index = makeIndex(); const module = baseModule(); module.assetId = "GG-BLD-WINDOW-HERITAGE-003"; module.assetVersion = "0.1.0"; module.type = "WINDOW"; module.approvalState = "DRAFT"; index.register(module); index.transition(module.assetId, module.assetVersion, "REVIEW"); throwsCode(() => index.transition(module.assetId, module.assetVersion, "APPROVED"), "MISSING_APPROVAL_EVIDENCE"); const approved = index.transition(module.assetId, module.assetVersion, "APPROVED", { evidence: { BUILD: "PASS", REFERENCE_REVIEW: "PASS", BUDGET_VALIDATION: "PASS", MODULAR_REUSE_VALIDATION: "PASS" } }); assert.equal(approved.approvalState, "APPROVED");
});
