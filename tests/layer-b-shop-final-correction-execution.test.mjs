import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('test-output/shop-layer-b-final-correction');
const recipe = JSON.parse(fs.readFileSync('asset-factory/modular/SHOP_LAYER_B_RECIPE.json', 'utf8'));
const result = JSON.parse(fs.readFileSync(path.join(root, 'SHOP_LAYER_B_ASSEMBLY_RESULT.json'), 'utf8'));
const budget = JSON.parse(fs.readFileSync(path.join(root, 'SHOP_BUDGET.json'), 'utf8'));
const idMap = JSON.parse(fs.readFileSync(path.join(root, 'SHOP_COMPONENT_ID_MAP.json'), 'utf8'));

test('final controlled correction uses seven shared materials and preserves identity', () => {
  assert.equal(result.executionMode, 'REAL_BLENDER_WORKER_EXECUTION');
  assert.equal(budget.materials, 7);
  assert.ok(budget.materials <= 32);
  assert.equal(budget.anonymousGeometryCount, 0);
  assert.equal(result.recipeId, recipe.recipeId);
  assert.equal(result.recipeVersion, recipe.recipeVersion);
  for (const id of ['WALL','DOOR','WINDOW','AWNING','FASCIA','SIGN','TRIM','FOUNDATION','PLANTER','SHRUB']) assert.ok(idMap[id]?.moduleId, `missing ${id}`);
});

test('final four-side review artifacts exist', () => {
  for (const file of ['SHOP_FINAL_FRONT.png','SHOP_FINAL_BACK.png','SHOP_FINAL_LEFT.png','SHOP_FINAL_RIGHT.png','SHOP_FINAL_FOUR_SIDE_BOARD.png']) assert.ok(fs.existsSync(path.join(root, file)), file);
});
