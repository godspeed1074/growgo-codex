import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const modular = path.join(repo, 'asset-factory', 'modular');
const output = path.join(repo, 'test-output', 'plant-26-leaf-production');
const status = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_26_LEAF_PRODUCTION_STATUS.json'), 'utf8'));
const selections = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_26_LEAF_SELECTION_MANIFEST.json'), 'utf8'));

test('26-leaf production status is complete, independent, and target-specific', () => {
  assert.equal(status.leaves.length, 26);
  assert.equal(new Set(status.leaves.map((leaf) => leaf.id)).size, 26);
  assert.equal(status.remainingLeavesRebuilt, 23);
  assert.equal(status.referenceImageryInBeauty, false);
  assert.equal(status.geometryOnly, true);
  assert.equal(status.shop, 'UNCHANGED');
  assert.equal(status.anonymousGeometry, 0);
  assert.equal(status.budget, 'PASS');
});

test('protected calibration leaves remain locked and unchanged', () => {
  for (const id of ['LEAF_001', 'LEAF_005', 'LEAF_007']) {
    const leaf = status.leaves.find((entry) => entry.id === id);
    assert.equal(leaf.protectedCalibrationLeaf, true);
    assert.equal(status.provenCalibrationLeavesPreserved[id], 'PASS');
    assert.equal(selections.selections[id].candidateId.includes('PROTECTED'), true);
  }
});

test('every leaf has an independent selection and no anonymous geometry', () => {
  for (const leaf of status.leaves) {
    assert.ok(leaf.independentAudit);
    assert.equal(leaf.anonymousGeometryCount, 0);
    assert.equal(leaf.referenceTextureUsedInBeauty, false);
    assert.equal(leaf.referencePlaneVisible, false);
    assert.equal(leaf.depthPerformed, false);
    assert.equal(leaf.flowersChanged, false);
    assert.equal(leaf.planterChanged, false);
    assert.equal(selections.selections[leaf.id].leafId, leaf.id);
  }
});

test('full front proof, component map, wireframe, and operator board exist', () => {
  for (const file of [
    'full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png',
    'full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png',
    'full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png',
    'full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.blend',
    'full/PLANT_26LEAF_TARGETSPECIFIC_RESULT.json'
  ]) assert.equal(fs.existsSync(path.join(output, file)), true, file);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.png')), true);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.json')), true);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.png')), true);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.json')), true);
});

test('19-leaf numeric gate is reconciled but direct visual authority remains withheld', () => {
  const finalStatus = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_19_DOMINANT_LEAF_FINAL_STATUS.json'), 'utf8'));
  assert.equal(status.status, 'BLOCKED_26_LEAF_FRONT_VISION_REVIEW');
  assert.equal(status.leavesBelowPoint90.length, 0);
  assert.equal(finalStatus.entries.length, 19);
  assert.equal(finalStatus.fullPassCount, 19);
  assert.equal(finalStatus.failCount, 0);
  assert.equal(finalStatus.directVision.sameShrub, 'NO');
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_FOLIAGE_GEOMETRY_FRONT_AUTHORITY_LOCK_V1.json')), false);
  assert.equal(status.readyForFlowerAndPlanterFidelityPhase, false);
});
