import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {isExpiredBirdDeployment,shouldMoveExpiredBird,publicBirdDeployment}=require('../lib/domain/quests/sharedBirdDeployment.js');
const now=100000000;
const visit={schemaVersion:1,id:'old',birdId:'bird',ownerUid:'owner',ownerName:'Owner',
  createdAt:now-21600000,expiresAt:now,status:'deployed',landing:{id:'plot-a',lat:0,lng:0}};
test('automatic travel is due exactly at expiry and never before',()=>{
  assert.equal(isExpiredBirdDeployment(visit,now-1),false);
  assert.equal(shouldMoveExpiredBird(visit,now-1),false);
  assert.equal(shouldMoveExpiredBird(visit,now),true);
  assert.equal(shouldMoveExpiredBird(visit,now+86400000),true);
});
test('no-target backoff persists and expires exactly on the server boundary',()=>{
  const waiting={...visit,nextLandingAttemptAt:now+300000};
  assert.equal(shouldMoveExpiredBird(waiting,now),false);
  assert.equal(shouldMoveExpiredBird(waiting,now+299999),false);
  assert.equal(shouldMoveExpiredBird(waiting,now+300000),true);
  assert.equal('nextLandingAttemptAt' in publicBirdDeployment(waiting),false);
});
test('recalled, departed and malformed records never automatically resurrect',()=>{
  for(const change of [{status:'recalled'},{status:'departed'},{schemaVersion:2},{id:''},{ownerUid:''},{birdId:''},
    {expiresAt:NaN},{createdAt:Infinity},{expiresAt:visit.createdAt},{landing:null}])
    assert.equal(shouldMoveExpiredBird({...visit,...change},now+86400000),false);
  assert.equal(shouldMoveExpiredBird(null,now),false);
});
