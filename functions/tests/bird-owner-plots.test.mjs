import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {eligibleBirdPlot,eligibleDeployedBirdPlot,publicBirdDeployment}=require('../lib/domain/quests/sharedBirdDeployment.js');
const now=new Date('2027-01-01T11:00:00Z');
const plot={pinId:'plot',latitude:-38.45,longitude:145.24,ownerUid:'owner',
  plant:{seedId:'corn_seed',plantedAt:new Date(+now-86400000),miracleGrownAt:null}};
const visit={schemaVersion:1,id:'any-normal-visit',ownerUid:'owner',ownerName:'Owner',birdId:'bird',
  landing:{id:plot.pinId,lat:plot.latitude,lng:plot.longitude},createdAt:+now-60000,expiresAt:+now+3600000,status:'deployed'};
test('own and other-player growing or harvest-ready plots are eligible without a date/account exception',()=>{
  for(const ownerUid of ['owner','other-player']) for(const miracleGrownAt of [null,new Date(+now-3600000)]){
    const p={...plot,ownerUid,plant:{...plot.plant,miracleGrownAt}};
    assert.equal(eligibleBirdPlot(p,visit.ownerUid,now),true);
    assert.equal(eligibleDeployedBirdPlot(p,visit,now),true);
    assert.equal(eligibleDeployedBirdPlot(p,{...visit,id:'new-visit',birdId:'new-bird'},now),true);
  }
  assert.equal('ownerUid' in publicBirdDeployment(visit),false);
});
test('unowned, empty, future-planted and harvest-expired crops remain ineligible for all birds',()=>{
  for(const p of [null,{...plot,ownerUid:null},{...plot,plant:null},
    {...plot,plant:{...plot.plant,plantedAt:new Date(+now+1)}},
    {...plot,plant:{...plot.plant,plantedAt:new Date(+now-40*86400000)}},
    {...plot,plant:{...plot.plant,miracleGrownAt:new Date(+now-8*86400000)}}]){
    assert.equal(eligibleBirdPlot(p,'owner',now),false);
    assert.equal(eligibleDeployedBirdPlot(p,visit,now),false);
  }
});
test('expiry, recall and acceptance remove own and other-owner visits',()=>{
  for(const changes of [{status:'departed'},{status:'recalled'},{createdAt:+now+1},{expiresAt:+now}])
    for(const ownerUid of ['owner','other-player']) assert.equal(eligibleDeployedBirdPlot({...plot,ownerUid},{...visit,...changes},now),false);
});
