import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'test-output/door-root-correction');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/SHOP_FINAL_DOOR_ROOT_CORRECTION_PLAN.json')));
const result = JSON.parse(fs.readFileSync(path.join(out, 'SHOP_DOORCAL_RESULT.json')));

test('door root correction preserves scope and required evidence', () => {
  assert.equal(plan.recipe, 'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0');
  assert.equal(plan.artworkInternalsChanged, false);
  assert.equal(plan.openingResponse, 'DERIVED_FROM_ROOT_BOUNDS');
  assert.equal(plan.landingResponse, 'DERIVED_FROM_THRESHOLD_ANCHOR');
  assert.equal(result.componentIds.includes('DOOR'), true);
  for (const n of ['SHOP_DOORCAL_FRONT.png','SHOP_DOORCAL_GAMEPLAY.png','SHOP_DOORCAL_HERO.png','SHOP_DOORCAL_CLOSEUP.png','SHOP_DOORCAL_BACK.png','SHOP_DOORCAL_LEFT.png','SHOP_DOORCAL_RIGHT.png','SHOP_DOORCAL_COMPONENT_ID.png','SHOP_DOORCAL_GOLDEN_COMPARISON_BOARD.png','SHOP_DOORCAL_FOUR_SIDE_BOARD.png']) assert.equal(fs.existsSync(path.join(out, n)), true, n);
  assert.equal(result.knownGoodBuildId, null);
  assert.equal(result.visionReview.verdict, 'VISION_METRIC_CONFLICT');
});
