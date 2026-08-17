import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'asset-factory', 'modular', name), 'utf8'));

test('material consolidation plan is bounded and covers required palette families', () => {
  const p = read('SHOP_MATERIAL_CONSOLIDATION_REPORT.json');
  assert.equal(p.scope, 'PLAN_ONLY');
  assert.equal(p.materialCountBefore, 139);
  assert.equal(p.materialCountCurrent, 46);
  assert.ok(p.proposedMaterialCount <= p.targetMaterialCount);
  assert.deepEqual(p.sharedMaterials.map(x => x.paletteFamily), ['SHOP_WARM_BROWN','SHOP_NAVY','SHOP_PLUM_FABRIC','SHOP_TEAL_GLASS','SHOP_CREAM','SHOP_GRAY','SHOP_GREEN_VEGETATION']);
});

test('visual correction plan is measurable and preserves protected state', () => {
  const p = read('SHOP_VISUAL_CORRECTION_PLAN.json');
  assert.equal(p.scope, 'PLAN_ONLY');
  assert.equal(p.noNewGeometry, true);
  assert.equal(p.recipeId, 'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0');
  assert.ok(p.findings.length >= 8);
  for (const finding of p.findings) {
    assert.ok(finding.status === 'PASS' || finding.status === 'NEEDS_CORRECTION');
    assert.ok(finding.recommendedChange.measurement.length > 10);
  }
  assert.ok(p.protectedState.includes('Golden Reference checksum'));
  assert.ok(p.protectedState.includes('camera contract'));
});
