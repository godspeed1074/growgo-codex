import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular', name), 'utf8'));
const registry = read('SAD_TOMATO_V1_PRESENTATION_MODULE_REGISTRY.json');
const alpha = read('SAD_TOMATO_V1_DISPLAY_ALPHA_AUDIT.json');
const depth = read('SAD_TOMATO_V1_WINDOW_DEPTH_SPEC.json');
const refinement = read('SAD_TOMATO_V1_DISPLAY_REFINEMENT_AUDIT.json');

assert.equal(registry.status, 'PASS');
assert.equal(registry.phase, 'PREFLIGHT_ONLY');
assert.equal(registry.assemblyPerformed, 'NO');
assert.deepEqual(registry.modules.map(module => module.assetId), [
  'GG-PRES-SIGN-THE-SAD-TOMATO-001',
  'GG-PRES-AWNING-SAD-TOMATO-GREEN-WHITE-STRIPED-001',
  'GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001',
]);
assert.equal(registry.forbiddenContamination.structuralGeometry, 0);
assert.equal(registry.forbiddenContamination.opaqueBackgroundCards, 0);
assert.equal(alpha.status, 'PASS');
assert.equal(alpha.outsideArtworkTransparent, 'YES');
assert.ok(alpha.transparentPixels > 0);
assert.equal(depth.preservesWindowOwnership, 'YES');
assert.equal(depth.createsNoStructuralGeometry, 'YES');
assert.ok(fs.existsSync(path.join(root, 'test-output/sad-tomato-v1/SAD_TOMATO_V1_PREFLIGHT.png')));
assert.equal(refinement.status, 'PASS');
assert.equal(refinement.selected, 'C');
assert.equal(refinement.architectureChanged, 'NO');
assert.equal(refinement.signChanged, 'NO');
assert.equal(refinement.awningChanged, 'NO');
assert.equal(refinement.candidates.A.aiFoodAppearance, 'YES');
assert.equal(refinement.candidates.B.aiFoodAppearance, 'YES');
assert.equal(refinement.candidates.C.aiFoodAppearance, 'NO');
assert.equal(refinement.candidates.C.lettering, 'YES');
assert.equal(refinement.candidates.C.papercut, 'PASS');
assert.ok(fs.existsSync(path.join(root, 'test-output/sad-tomato-v1/display-refinement/SAD_TOMATO_V1_DISPLAY_REFINEMENT_BOARD.png')));
console.log('sad-tomato presentation preflight: PASS (24 assertions)');
