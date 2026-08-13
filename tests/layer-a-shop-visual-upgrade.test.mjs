import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('test-output/shop-layer-a-upgrade');
const pack=JSON.parse(fs.readFileSync('asset-factory/modular/SHOP_LAYER_A_VISUAL_UPGRADE_PACK.json','utf8'));
const result=JSON.parse(fs.readFileSync(path.join(root,'SHOP_LAYER_A_VISUAL_UPGRADE_RESULT.json'),'utf8'));
const recipe=JSON.parse(fs.readFileSync('asset-factory/modular/SHOP_LAYER_B_RECIPE.json','utf8'));

test('five upgrade candidates have stable IDs, parent versions, and passing budgets',()=>{
 assert.equal(result.executionMode,'REAL_BLENDER_WORKER_EXECUTION'); assert.equal(result.modules.length,5);
 for(const m of result.modules){ assert.equal(m.assetVersion,'1.1.0'); assert.equal(m.parentVersion,'1.0.0'); assert.ok(m.budget.triangles<=1200); assert.ok(m.budget.materials<=3); assert.equal(m.budget.anonymousGeometryCount,0); }
});

test('component IDs and four-side review boards exist for every upgrade',()=>{
 for(const m of result.modules){ const d=path.join(root,`${m.assetId}@${m.assetVersion}`); for(const f of ['MODULE_COMPONENT_ID_RENDER.png','MODULE_COMPONENT_ID_MAP.json','FRONT.png','BACK.png','LEFT.png','RIGHT.png','MODULE_UPGRADE_REVIEW_BOARD.png']) assert.ok(fs.existsSync(path.join(d,f)),`${m.assetId}/${f}`); }
});

test('existing Layer B recipe remains compatible and immutable in identity',()=>{
 const ids=new Set(recipe.components.map(c=>c.assetId)); for(const m of pack.modules) assert.ok(ids.has(m.assetId)); assert.equal(recipe.recipeId,'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001'); assert.equal(recipe.recipeVersion,'1.0.0');
});
