import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'test-output/facade-architecture');
const result = JSON.parse(fs.readFileSync(path.join(out, 'SHOP_FACADE_ARCHITECTURE_RESULT.json')));
const ids = ['GG-BLD-WALL-SHOP-BROWN-001','GG-BLD-FOUNDATION-SHOP-002','GG-BLD-WINDOW-SHOP-LARGE-002','GG-BLD-AWNING-SHOP-FABRIC-001','GG-BLD-FASCIA-SHOP-NAVY-001'];
test('facade architecture candidates are real-worker validated', () => {
  assert.equal(result.status, 'PASS'); assert.equal(result.modules.length, 5);
  for (const m of result.modules) {
    assert.ok(ids.includes(m.assetId)); assert.equal(m.version, '3.5.0');
    assert.ok(m.budget.triangles <= 1200); assert.ok(m.budget.materials <= 3); assert.equal(m.budget.anonymousGeometryCount, 0);
    const dir = path.join(out, `${m.assetId}@3.5.0`);
    for (const f of ['FRONT.png','BACK.png','LEFT.png','RIGHT.png','CLOSE_UP.png','MODULE_COMPONENT_ID_RENDER.png','MODULE_COMPONENT_ID_MAP.json']) assert.ok(fs.existsSync(path.join(dir,f)), `${m.assetId}/${f}`);
  }
});
test('facade review package and protected recipe exist', () => {
  assert.ok(fs.existsSync(path.join(root,'asset-factory/modular/SHOP_FACADE_ARCHITECTURE_UPGRADE_REPORT.md')));
  assert.ok(fs.existsSync(path.join(out,'SHOP_FACADE_ARCHITECTURE_REVIEW_BOARD.png')));
  const recipe = JSON.parse(fs.readFileSync(path.join(root,'asset-factory/modular/SHOP_LAYER_B_RECIPE.json')));
  assert.equal(recipe.recipeId, 'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001'); assert.equal(recipe.recipeVersion, '1.0.0');
});
