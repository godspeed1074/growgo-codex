import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const modular = path.join(repo, 'asset-factory', 'modular');
const report = JSON.parse(fs.readFileSync(path.join(modular, 'TWO_LEAF_CALIBRATION_REPORT.json'), 'utf8'));

test('two additional calibration leaves are deliberately different target shapes', () => {
  assert.equal(report.status, 'PASS_TWO_ADDITIONAL_LEAF_CALIBRATION');
  assert.deepEqual(report.selectedLeaves.map((leaf) => leaf.id), ['LEAF_005', 'LEAF_007']);
  assert.equal(report.leaf001.id, 'LEAF_001');
  assert.equal(report.threeLeafMethodGeneralizes, true);
});

test('broad leaf passes target-specific numeric and visual gates', () => {
  const leaf = report.leaves.find((entry) => entry.leafId === 'LEAF_005');
  assert.equal(leaf.selectedCandidate.candidateId, 'LEAF_005_BROAD_C28');
  assert.ok(leaf.selectedCandidate.silhouetteIoU >= .92);
  assert.ok(leaf.selectedCandidate.centreErrorPx <= 1);
  assert.ok(leaf.selectedCandidate.widthErrorPercent <= 3);
  assert.ok(leaf.selectedCandidate.heightErrorPercent <= 3);
  assert.ok(leaf.selectedCandidate.tipErrorPx <= 1.5);
  assert.ok(leaf.selectedCandidate.angleErrorDeg <= 3);
  assert.equal(leaf.directVision.targetSpecificSilhouette, 'PASS');
  assert.equal(leaf.directVision.targetSpecificTonalFaceting, 'PASS');
  assert.equal(leaf.directVision.genericAppearance, 'NO');
});

test('narrow angled leaf passes after local base and shoulder calibration', () => {
  const leaf = report.leaves.find((entry) => entry.leafId === 'LEAF_007');
  assert.equal(leaf.selectedCandidate.candidateId, 'LEAF_007_NARROW_ANGLED_C64_BASE_TAPER_WIDTH');
  assert.ok(leaf.selectedCandidate.silhouetteIoU >= .92);
  assert.ok(leaf.selectedCandidate.centreErrorPx <= 1);
  assert.ok(leaf.selectedCandidate.widthErrorPercent <= 3);
  assert.ok(leaf.selectedCandidate.heightErrorPercent <= 3);
  assert.ok(leaf.selectedCandidate.tipErrorPx <= 1.5);
  assert.ok(leaf.selectedCandidate.angleErrorDeg <= 3);
  assert.equal(leaf.directVision.narrownessMatches, 'PASS');
  assert.equal(leaf.directVision.targetSpecificSilhouette, 'PASS');
  assert.equal(leaf.directVision.targetSpecificTonalFaceting, 'PASS');
  assert.equal(leaf.directVision.genericAppearance, 'NO');
});

test('three-leaf proof remains isolated and reference-free in beauty renders', () => {
  assert.equal(report.referenceImageryInBeauty, false);
  assert.equal(report.other23LeavesModified, false);
  assert.equal(report.depthPerformed, false);
  assert.equal(report.shopModified, false);
  assert.equal(report.eucalyptusStarted, false);
  assert.equal(report.anonymousGeometry, 0);
  assert.equal(report.budget, 'PASS');
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_THREE_LEAF_METHOD_VALIDATION_BOARD.png')), true);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_THREE_LEAF_METHOD_VALIDATION_BOARD.json')), true);
});
