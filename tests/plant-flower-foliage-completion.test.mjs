import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..'), modular=path.join(root,'asset-factory/modular'), out=path.join(root,'test-output/plant-observed-front-completion/full');
const read=(name)=>JSON.parse(fs.readFileSync(path.join(modular,name),'utf8'));
test('flower completion artifacts and front authority board exist',()=>{for(const f of ['PLANT_FLOWER_FOLIAGE_MEASUREMENTS.json','PLANT_FLOWER_FOLIAGE_OCCLUSION_GRAPH.json','PLANT_FLOWER_FOLIAGE_COMPLETION_EVALUATION.json','PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1.json','PLANT_FRONT_COMPLETE_AUTHORITY_BOARD.png','PLANT_FLOWER_FOLIAGE_RESIDUAL_MASK.png'])assert.ok(fs.existsSync(path.join(modular,f)),f);assert.ok(fs.existsSync(path.join(out,'PLANT_FRONT_FLOWER_COMPLETE.png')));});
test('three logical flower groups pass locked-front placement gates',()=>{const m=read('PLANT_FLOWER_FOLIAGE_MEASUREMENTS.json');assert.deepEqual(Object.keys(m.groups),['LEFT','MIDDLE','RIGHT']);for(const g of Object.values(m.groups)){assert.equal(g.gate,'PASS');assert.ok(g.centerErrorPixels<=2);assert.ok(g.widthErrorPercent<=8);assert.ok(g.heightErrorPercent<=8);}});
test('flower occlusion graph places flowers in front without reshaping locked foliage',()=>{const g=read('PLANT_FLOWER_FOLIAGE_OCCLUSION_GRAPH.json');assert.equal(g.foliageLocked,true);assert.equal(g.noFoliageTransformChanged,true);assert.equal(g.noPlanterGeometryChanged,true);assert.equal(g.edges.length,4);});
test('real worker evidence retains geometry-only, no-depth safety',()=>{const r=JSON.parse(fs.readFileSync(path.join(out,'PLANT_26LEAF_TARGETSPECIFIC_RESULT.json'),'utf8'));assert.equal(r.flowersTemporary,false);assert.equal(r.flowerGeometryCount,26);assert.equal(r.anonymousGeometryCount,0);assert.equal(r.depthInferencePerformed,false);assert.equal(r.shopIntegrationPerformed,false);assert.equal(r.mobileBudget,'PASS');});
test('front geometry authority lock is restricted to the complete observed front',()=>{const l=read('PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1.json');assert.equal(l.status,'LOCKED');assert.equal(l.frozenObservedLeafIds.length,26);assert.equal(l.logicalVisibleFlowerGroups,3);assert.equal(l.noReferenceImageryInBeauty,true);assert.equal(l.noDepthOrSideWork,true);assert.equal(l.noShopWork,true);});
