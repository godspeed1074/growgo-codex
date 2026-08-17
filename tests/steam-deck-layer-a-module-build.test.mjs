import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("test-output/shop-layer-a-real");
const result = JSON.parse(fs.readFileSync(path.join(root, "SHOP_LAYER_A_BLENDER_BUILD_RESULT.json"), "utf8"));
test("real Steam Deck Layer A build completed", () => { assert.equal(result.executionMode, "REAL_BLENDER_WORKER_EXECUTION"); assert.equal(result.blenderVersion, "5.2.0 LTS"); assert.equal(result.modules.length, 9); assert.equal(result.anonymousGeometryCount, 0); });
test("every module has independent blend, ID render/map, and four-side review", () => { for (const module of result.modules) { const folder=path.join(root,module.assetId); assert.ok(fs.existsSync(path.join(folder,module.blend))); assert.ok(fs.existsSync(path.join(folder,"MODULE_COMPONENT_ID_RENDER.png"))); assert.ok(fs.existsSync(path.join(folder,"MODULE_COMPONENT_ID_MAP.json"))); for (const name of ["FRONT.png","BACK.png","LEFT.png","RIGHT.png","FOUR_SIDE_REVIEW_BOARD.png"]) assert.ok(fs.existsSync(path.join(folder,name))); assert.equal(module.fourSide.length,5); } });
test("all real module budgets are within registered mobile ceilings", () => { const limits={building:1200,vegetation:900}; for (const module of result.modules) { const ceiling=module.assetId.startsWith("GG-VEG")?limits.vegetation:limits.building; assert.ok(module.budget.triangles<=ceiling,`${module.assetId} exceeds triangle ceiling`); assert.deepEqual(module.budget.lods,["LOD0","LOD1","LOD2"]); } });
