import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'test-output/door-shallow-layer-proof/output');
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/DOOR_SHALLOW_LAYER_PRODUCTION_EVIDENCE.json')));
const required = ['DOOR_SHALLOW_FIDELITY_FRONT.png','DOOR_SHALLOW_PAPERCUT_FRONT.png','DOOR_SHALLOW_GAMEPLAY.png','DOOR_SHALLOW_CLOSEUP.png','DOOR_SHALLOW_BACK.png','DOOR_SHALLOW_LEFT.png','DOOR_SHALLOW_RIGHT.png','DOOR_SHALLOW_COMPONENT_ID.png','DOOR_SHALLOW_COMPARISON_BOARD.png','DOOR_SHALLOW_LAYER_PROOF.blend','DOOR_SHALLOW_DEPTH_CONTRACT.json','DOOR_SHALLOW_BUDGET.json'];

test('shallow proof is isolated and does not use a full-source backplate', () => {
  assert.equal(evidence.assetId, 'GG-BLD-DOOR-SHOP-002');
  assert.equal(evidence.fullSourceBackplateUsed, false);
  assert.equal(evidence.permanentDoorVersionCreated, false);
  assert.equal(evidence.layerBAssembled, false);
  assert.deepEqual(evidence.layers, ['DOOR_OPENING_SHADOW','DOOR_FRAME','DOOR_SLAB','DOOR_GLASS','DOOR_LOWER_PANEL','DOOR_MAIL_SLOT','DOOR_KNOB_LOCK','DOOR_THRESHOLD']);
});

test('all required proof artifacts exist', () => {
  for (const file of required) assert.equal(fs.existsSync(path.join(out, file)), true, file);
});

test('depth contract is shallow, deterministic, and component-bound', () => {
  const c = JSON.parse(fs.readFileSync(path.join(out, 'DOOR_SHALLOW_DEPTH_CONTRACT.json')));
  assert.equal(c.camera.type, 'ORTHO');
  assert.equal(c.camera.locked, true);
  assert.deepEqual(c.layers.map(x => x.zOffset), [0, .01, .02, .03, .04, .05, .06, .07]);
  assert.equal(c.fullSourceBackplateUsed, false);
  assert.equal(c.sourceDirectoryFiles.some(x => /crop|full/i.test(x)), false);
});

test('budget and anonymous geometry gates pass while visual approval remains explicit', () => {
  const b = JSON.parse(fs.readFileSync(path.join(out, 'DOOR_SHALLOW_BUDGET.json')));
  assert.equal(b.anonymousGeometry, 0);
  assert.equal(b.mobileBudget, 'PASS');
  assert.equal(evidence.status, 'NEEDS_CORRECTION');
  assert.equal(evidence.operatorApprovalRequired, true);
});
