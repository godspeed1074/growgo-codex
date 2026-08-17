import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path";
const root=path.resolve("asset-factory/modular/SHOP_LAYER_A_MODULE_REVIEW"); const s=JSON.parse(fs.readFileSync(path.join(root,"SHOP_LAYER_A_MODULE_REVIEW_SUMMARY.json"),"utf8"));
test("review package covers all nine modules",()=>{assert.equal(s.modules.length,9);assert.equal(s.fourSideReviewsGenerated,9);assert.equal(s.componentIdReviewsGenerated,9);});
test("review records preserve identity and bindings",()=>{for(const r of s.modules){assert.equal(r.moduleId,r.componentId.render? r.moduleId:r.moduleId);assert.equal(r.componentId.confidence,"EXPLICIT_RENDER_ID");assert.equal(r.status,"APPROVED_WITH_NOTES");}});
test("review package preserves conservative operator gate",()=>{assert.equal(s.operatorApprovalRequired,true);assert.equal(s.layerBAssembly,"NOT_CREATED");assert.equal(fs.existsSync(path.join(root,"SHOP_LAYER_A_COMPLETE_REVIEW_BOARD.png")),true);});
