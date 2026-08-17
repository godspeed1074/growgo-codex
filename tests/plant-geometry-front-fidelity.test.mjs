import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const modular = path.join(repo, 'asset-factory/modular');
const output = path.resolve(repo, '..', 'test-output/plant-26leaf-geometry-only');

test('front fidelity evidence contains all 26 target-specific contour records', () => {
  const contours = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
  assert.equal(contours.visibleLeafCount, 26);
  assert.equal(contours.leaves.length, 26);
  assert.deepEqual(contours.leaves.map((leaf) => leaf.id), Array.from({ length: 26 }, (_, i) => `LEAF_${String(i + 1).padStart(3, '0')}`));
  assert.ok(contours.leaves.every((leaf) => Array.isArray(leaf.contourPx) && leaf.contourPx.length >= 8));
});

test('geometry-only Blender proof excludes reference pixels and preserves independent meshes', () => {
  const proof = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_FRONT_GEOMETRY_ONLY_PROOF.json'), 'utf8'));
  assert.equal(proof.leafGeometryCount, 26);
  assert.equal(proof.targetSpecificContourCount, 26);
  assert.equal(proof.facetedFrontGeometry, true);
  assert.equal(proof.referenceTextureUsedInBeauty, false);
  assert.equal(proof.referencePlaneVisible, false);
  assert.equal(proof.foliageCompositeUsed, false);
  assert.equal(proof.bakedTargetFoliageUsed, false);
  assert.equal(proof.anonymousGeometryCount, 0);
  assert.equal(proof.geometryAuthorityLockV1, 'NOT_LOCKED');
  assert.equal(proof.visualGate, 'FAIL_GEOMETRY_ONLY_LIKENESS');
});

test('contour report is independently measurable and front gate remains honest', () => {
  const report = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_PER_LEAF_CONTOUR_REPORT.json'), 'utf8'));
  assert.equal(report.leaves.length, 26);
  assert.equal(report.measurementBasis.includes('projected Blender mesh polygon'), true);
  assert.equal(report.status, 'BLOCKED_TARGET_CONTOUR_OVERLAP');
  assert.ok(report.aggregate.meanDominantIoU >= 0 && report.aggregate.meanDominantIoU <= 1);
});

test('13-panel operator board exists and geometry authority lock is not issued', () => {
  const board = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.json'), 'utf8'));
  assert.equal(board.panelCount, 13);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png')), true);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_GEOMETRY_FRONT_AUTHORITY_LOCK_V1.json')), false);
  assert.equal(fs.existsSync(path.join(output, 'PLANT_26LEAF_GEOMETRY_FRONT.blend')), true);
});
