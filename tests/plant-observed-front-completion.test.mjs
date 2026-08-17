import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const modular = path.join(root, 'asset-factory/modular');
const out = path.join(root, 'test-output/plant-observed-front-completion/full');
const read = (name) => JSON.parse(fs.readFileSync(path.join(modular, name), 'utf8'));

test('observed front completion preserves all 26 frozen leaf IDs', () => {
  const manifest = read('PLANT_OBSERVED_FOLIAGE_FINAL_MANIFEST.json');
  assert.equal(manifest.frozenLeafIds.length, 26);
  assert.equal(new Set(manifest.frozenLeafIds).size, 26);
  assert.equal(manifest.additionalObservedPartialLeaves.length, 7);
  assert.equal(manifest.observedTransitionFoliageIds.length, 15);
});

test('residual regions are measured and classified only as A-E', () => {
  const residual = read('PLANT_OBSERVED_FOLIAGE_RESIDUAL_REGIONS.json');
  assert.ok(residual.residualPixelArea > 0);
  for (const region of residual.regions) assert.ok(['A', 'B', 'C', 'D', 'E'].includes(region.probableInterpretation.code));
  assert.ok(residual.outputs.mask.endsWith('PLANT_OBSERVED_FOLIAGE_RESIDUAL_MASK.png'));
  assert.ok(fs.existsSync(path.join(modular, 'PLANT_OBSERVED_FOLIAGE_RESIDUAL_BOARD.png')));
});

test('front completion uses real geometry-only Steam Deck evidence', () => {
  const result = JSON.parse(fs.readFileSync(path.join(out, 'PLANT_26LEAF_TARGETSPECIFIC_RESULT.json'), 'utf8'));
  assert.equal(result.status, 'PASS_OBSERVED_FRONT_COMPLETION_CANDIDATE');
  assert.equal(result.referenceTextureUsedInBeauty, false);
  assert.equal(result.referencePlaneVisible, false);
  assert.equal(result.depthInferencePerformed, false);
  assert.equal(result.shopIntegrationPerformed, false);
  assert.equal(result.anonymousGeometryCount, 0);
  assert.equal(result.additionalObservedPartialLeafCount, 7);
  assert.equal(result.observedTransitionFoliageCount, 16);
});

test('completion artifacts, final render and shallow occlusion graph exist', () => {
  for (const file of [
    'PLANT_OBSERVED_FRONT_COMPLETION_REPORT.md',
    'PLANT_OBSERVED_FRONT_COMPLETION_BOARD.png',
    'PLANT_FRONT_OCCLUSION_GRAPH.json',
    'PLANT_OBSERVED_FOLIAGE_FINAL_MANIFEST.json',
    'PLANT_OBSERVED_FRONT_COMPLETION_EVALUATION.json'
  ]) assert.equal(fs.existsSync(path.join(modular, file)), true, file);
  assert.equal(fs.existsSync(path.join(out, 'PLANT_OBSERVED_FRONT_COMPLETE.png')), true);
  const graph = read('PLANT_FRONT_OCCLUSION_GRAPH.json');
  assert.equal(graph.frozenLeafCount, 26);
  assert.equal(graph.noExistingPassingLeafReshaped, true);
  assert.equal(graph.noReferenceImageryInBeauty, true);
});

test('authority lock remains withheld while flower interaction residuals remain', () => {
  const status = read('PLANT_26_LEAF_PRODUCTION_STATUS.json');
  assert.equal(status.observedFrontCompletion.authorityLock, 'NOT_LOCKED');
  assert.equal(status.observedFrontCompletion.flowersFinal, undefined);
  assert.equal(status.observedFrontCompletion.residualRegionsRemaining.length, 3);
  assert.equal(status.observedFrontCompletion.readyForFlowerAndPlanter, false);
});
