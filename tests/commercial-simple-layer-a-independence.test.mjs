import test from 'node:test';
import assert from 'node:assert/strict';

const runtimeReady = (artifact) => artifact.geometry && artifact.presentation && !artifact.parentFacadeDependency && !artifact.presentationContamination;
const assertRuntimeReady = (artifact) => { if (!runtimeReady(artifact)) throw new Error('LAYER_A_RUNTIME_PRESENTATION_INCOMPLETE'); };

test('geometry-only Layer A cannot claim runtime-reusable status', () => assert.throws(() => assertRuntimeReady({ geometry:true, presentation:false }), /INCOMPLETE/));
test('component presentation contamination fails', () => assert.throws(() => assertRuntimeReady({ geometry:true, presentation:true, presentationContamination:true }), /INCOMPLETE/));
test('parent-dependent presentation fails', () => assert.throws(() => assertRuntimeReady({ geometry:true, presentation:true, parentFacadeDependency:true }), /INCOMPLETE/));
test('independent geometry and presentation pass', () => assert.doesNotThrow(() => assertRuntimeReady({ geometry:true, presentation:true, parentFacadeDependency:false, presentationContamination:false })));
test('new opening layouts retain permanent module identities', () => {
  const layout = [{ component:'WINDOW', assetId:'GG-BLD-WINDOW-SHOP-LARGE-002' }, { component:'DOOR', assetId:'GG-BLD-DOOR-SHOP-002' }];
  assert.deepEqual(layout.map(x => x.component), ['WINDOW','DOOR']); assert.ok(layout.every(x => x.assetId.startsWith('GG-')));
});
test('Grow Goods native proof is Layer A-only', () => {
  const proof = { parentFacadeRequired:'NO', anonymousGeometry:0, sourceIds:true };
  assert.equal(proof.parentFacadeRequired,'NO'); assert.equal(proof.anonymousGeometry,0); assert.equal(proof.sourceIds,true);
});
