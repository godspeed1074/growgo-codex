import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const r=JSON.parse(fs.readFileSync('asset-factory/modular/SHOP_LAYER_B_FINAL_REVIEW.json','utf8'));
test('final review detects visual mismatch without promotion',()=>{assert.equal(r.status,'NEEDS_CORRECTION');assert.equal(r.knownGoodBuildId,null);assert.equal(r.goldenReference.unchanged,true)});
test('component IDs and anonymous geometry remain valid',()=>{assert.equal(r.componentId.pass,true);assert.equal(r.componentId.anonymousGeometryCount,0)});
test('correction plan preserves recipe/module/camera gates',()=>{assert.equal(r.correctionDecision.iteration,1);assert.equal(r.correctionDecision.preserveRecipe,true);assert.equal(r.correctionDecision.preserveModuleIds,true);assert.equal(r.correctionDecision.preserveCamera,true)});
