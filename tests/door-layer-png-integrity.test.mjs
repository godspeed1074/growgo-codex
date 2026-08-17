import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'test-output/door-mask-calibration');
const ids = ['DOOR_OPENING_SHADOW','DOOR_FRAME','DOOR_SLAB','DOOR_GLASS','DOOR_LOWER_PANEL','DOOR_MAIL_SLOT','DOOR_KNOB_LOCK','DOOR_THRESHOLD'];

test('shared RGBA decoder handles RGB8 source and exact RGBA output dimensions', () => {
  const source = decodePng(path.join(root, 'test-output/door-direct-reference-crop.png'));
  assert.deepEqual([source.w, source.h], [300, 350]);
  assert.equal(source.rgba.length, 300 * 350 * 4);
  assert.equal(source.rgba[3], 255);
});

test('all eight layer PNGs pass exact expected-vs-written roundtrip', () => {
  const evidence = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/DOOR_LAYER_PNG_INTEGRITY_EVIDENCE.json')));
  for (const id of ids) assert.equal(evidence.layers[id].roundtripPass, true, id);
  assert.equal(evidence.pngRoundtrip, 'PASS');
  assert.equal(evidence.twoDLayerOnlyReassembly, 'PASS');
  assert.equal(evidence.fullCropReconstruction, 'PASS');
  assert.equal(evidence.noiseOrCorruptionRemaining, false);
});

test('layer outputs preserve straight alpha and RGBA channel contract', () => {
  const evidence = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/DOOR_LAYER_PNG_INTEGRITY_EVIDENCE.json')));
  for (const id of ids) {
    assert.equal(evidence.layers[id].channelOrder, 'RGBA');
    assert.equal(evidence.layers[id].alphaMode, 'STRAIGHT');
    assert.equal(evidence.layers[id].alphaOutsidePixels, 0);
    assert.equal(evidence.layers[id].expectedBytes, 300 * 350 * 4);
  }
});

test('integrity board and reassembly evidence exist without a full-source asset backplate', () => {
  for (const file of ['DOOR_LAYER_PNG_INTEGRITY_BOARD.png','DOOR_LAYER_PNG_REASSEMBLED.png','DOOR_LAYER_PNG_FULL_CONTEXT_REASSEMBLED.png']) assert.equal(fs.existsSync(path.join(dir, file)), true, file);
  const spec = JSON.parse(fs.readFileSync(path.join(dir, 'DOOR_LAYER_MASKS.json')));
  assert.deepEqual(spec.compositingOrder, ids);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/DOOR_LAYER_PNG_INTEGRITY_EVIDENCE.json'))).blenderRun, false);
});
