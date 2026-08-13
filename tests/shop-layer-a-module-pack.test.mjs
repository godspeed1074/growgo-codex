import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MasterAssetIndex, validateGoldenReferenceBindings, validateLayerAModule, validateTransform } from "../asset-factory/modular/modular-asset-contract.mjs";

const root = path.resolve("asset-factory/modular");
const pack = JSON.parse(fs.readFileSync(path.join(root, "SHOP_LAYER_A_MODULE_PACK.json"), "utf8"));
const source = JSON.parse(fs.readFileSync(path.join(root, "SHOP_LAYER_A_MASTER_ASSET_INDEX.json"), "utf8"));
const budgets = JSON.parse(fs.readFileSync(path.join(root, "ASSET_BUDGET_PROFILES.json"), "utf8"));
const index = new MasterAssetIndex({ index: source, budgetProfiles: budgets, atlases: source.atlases, materials: source.materials, paletteFamilies: source.paletteFamilies });

test("shop Layer A pack has nine permanent modules", () => { assert.equal(pack.modules.length, 9); assert.equal(new Set(pack.modules.map(m => m.assetId)).size, 9); assert.ok(pack.modules.every(m => /^GG-(BLD|VEG)-[A-Z0-9-]+-\d{3}$/.test(m.assetId))); });
test("every shop module passes the machine contract and remains in review", () => { for (const module of pack.modules) { assert.equal(validateLayerAModule(module, index.context).ok, true); assert.equal(index.resolve(module.assetId, module.assetVersion).approvalState, "REVIEW"); } });
test("duplicate registration is rejected", () => { assert.throws(() => index.register(pack.modules[0], { actor: "TEST" }), error => error.code === "DUPLICATE_ASSET_VERSION"); });
test("Golden Reference bindings resolve to registered modules", () => { assert.equal(validateGoldenReferenceBindings(pack.goldenReferenceBindings, index).ok, true); });
test("allowed transformations and palette rules are explicit", () => { const wall = pack.modules.find(m => m.assetId === "GG-BLD-WALL-SHOP-BROWN-001"); assert.equal(validateTransform(wall, { MIRROR: true }).ok, true); assert.equal(validateTransform(wall, { BOUNDED_SCALE_X: 1.1 }).ok, true); assert.throws(() => validateTransform(wall, { UNIFORM_SCALE: 2 }), error => error.code === "FORBIDDEN_TRANSFORM"); assert.throws(() => validateTransform(wall, { APPROVED_TINT: "HOT_PINK" }), error => error.code === "PALETTE_RESTRICTION_VIOLATION"); });
test("pack contains no anonymous geometry and no Layer B assembly", () => { assert.equal(pack.anonymousGeometryCount, 0); assert.equal(pack.finalShopAssembly, "NOT_CREATED"); });
