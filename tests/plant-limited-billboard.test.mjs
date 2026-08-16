import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),mod=path.join(root,'asset-factory/modular'),out=path.join(root,'test-output/plant-limited-billboard');
test('limited billboard proof contains all mandatory front, gameplay, leaf, and parallax evidence',()=>{for(const n of ['PLANT_LIMITED_BILLBOARD_FRONT.png','PLANT_LIMITED_BILLBOARD_GAMEPLAY_1X.png','PLANT_LIMITED_BILLBOARD_GAMEPLAY_2X.png','LEAF_001_STATIC_30.png','LEAF_001_BIAS_B_30.png','THREE_LEAF_PARALLAX_-30.png','THREE_LEAF_PARALLAX_+30.png'])assert.ok(fs.existsSync(path.join(out,n)),n);});
test('limited billboard candidate respects the front authority and creates no replacement hidden geometry',()=>{const r=JSON.parse(fs.readFileSync(path.join(out,'PLANT_LIMITED_BILLBOARD_RESULT.json'),'utf8')),e=JSON.parse(fs.readFileSync(path.join(mod,'PLANT_LIMITED_BILLBOARD_PARALLAX_EVALUATION.json'),'utf8'));assert.equal(r.authority,'PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1');assert.equal(r.depthFinsCreated,false);assert.equal(r.centralCoreCreated,false);assert.equal(r.supportLeavesCreated,0);assert.equal(e.frontIoU,100);assert.equal(e.negativeSpaceIntrusionPixels,0);assert.equal(e.degrees30,'FAIL_CARD_WALL_AND_PLANTER_EDGE');assert.equal(e.noShopWork,true);assert.equal(e.status,'BLOCKED_GAMEPLAY_CONE');});
