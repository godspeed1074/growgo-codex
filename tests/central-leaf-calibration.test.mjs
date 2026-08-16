import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const modular = path.join(repo, 'asset-factory', 'modular');
const output = path.join(repo, 'test-output', 'central-leaf-calibration-targettrace');
const contour = JSON.parse(fs.readFileSync(path.join(modular, 'CENTRAL_TARGET_LEAF_CONTOUR.json'), 'utf8'));
const blender = JSON.parse(fs.readFileSync(path.join(output, 'CENTRAL_LEAF_CALIBRATION_RESULT.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(modular, 'CENTRAL_LEAF_CALIBRATION_REPORT.json'), 'utf8'));

test('central calibration targets exactly the tallest central observed leaf', () => {
  assert.equal(contour.targetLeafId, 'LEAF_001');
  assert.equal(contour.role, 'TALLEST_CENTRE');
  assert.equal(contour.contourSource, 'TARGET_SPECIFIC_OCCLUSION_CLEANED_TRACE');
  assert.equal(contour.chosenVertexCount, 22);
  assert.ok(contour.targetSpecificContourScore >= 0.92);
});

test('central Blender proof is isolated and does not touch the other plant components', () => {
  assert.equal(blender.status, 'PASS_CENTRAL_LEAF_BLENDER_CALIBRATION');
  assert.equal(blender.leafId, 'LEAF_001');
  assert.equal(blender.referenceTextureUsedInBeauty, false);
  assert.equal(blender.referencePlaneVisible, false);
  assert.equal(blender.otherLeafGeometryChanged, false);
  assert.equal(blender.flowersChanged, false);
  assert.equal(blender.planterChanged, false);
  assert.equal(blender.frontContourLocked, true);
  assert.equal(blender.internalRidgeOnlyDepthChange, true);
});

test('central visual gate remains honest and blocks generalization until the one leaf passes', () => {
  assert.match(report.status, /^BLOCKED_/);
  assert.ok(report.numeric.targetContourIoU >= 0.92);
  assert.ok(report.numeric.renderedGeometryMaskIoU < 0.92);
  assert.equal(report.directVision.sameOverallLeaf, 'NO');
  assert.equal(report.directVision.genericLeafAppearance, 'YES');
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_TARGET_SPECIFIC_LEAF_RECONSTRUCTION_METHOD_V1.json')), false);
  assert.equal(fs.existsSync(path.join(modular, 'PLANT_TARGET_SPECIFIC_LEAF_RECONSTRUCTION_METHOD_V1.md')), false);
});

test('central evidence board and all required proof renders exist', () => {
  for (const file of [
    'CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png',
    'CENTRAL_TARGET_LEAF_REFERENCE.png',
    'CENTRAL_TARGET_LEAF_VISIBLE_MASK.png',
  ]) assert.equal(fs.existsSync(path.join(modular, file)), true, file);
  for (const file of [
    'CENTRAL_LEAF_FINAL_FRONT.png',
    'CENTRAL_LEAF_COMPONENT_ID.png',
    'CENTRAL_LEAF_WIREFRAME_FRONT.png',
    'CENTRAL_LEAF_FINAL_3Q.png',
    'CENTRAL_LEAF_FINAL_SIDE.png',
    'CENTRAL_LEAF_CALIBRATION.blend',
  ]) assert.equal(fs.existsSync(path.join(output, file)), true, file);
});
