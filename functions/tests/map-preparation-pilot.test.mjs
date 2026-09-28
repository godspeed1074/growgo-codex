import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {withMapPreparationPilot,canPersistMapPreparation}=require('../lib/infrastructure/pins/mapPreparationPilot.js');
const at=Date.parse('2026-09-16T00:00:00Z');
const env={GROWGO_PERSIST_PREPARED_MAP_HINTS:'true',GROWGO_MAP_PREPARATION_PILOT_UID:'tester',GROWGO_MAP_COST_PROBE_ENABLED:'true',GROWGO_MAP_COST_PROBE_UID:'tester',GROWGO_MAP_PREPARATION_PILOT_EXPIRES_AT:new Date(at+600000).toISOString()};
const options={env,now:()=>at};
test('default off and only server-selected account is eligible',async()=>{
 assert.equal(canPersistMapPreparation(),false);
 assert.equal(await withMapPreparationPilot('tester',async()=>canPersistMapPreparation(),{env:{},now:()=>at}),false);
 for(const uid of [undefined,'other'])assert.equal(await withMapPreparationPilot(uid,async()=>canPersistMapPreparation(),options),false);
 assert.equal(await withMapPreparationPilot('tester',async()=>canPersistMapPreparation(),options),true);
 assert.equal(canPersistMapPreparation(),false);
});
test('missing, invalid, expired and over-one-hour windows fail closed',async()=>{
 for(const probe of [{GROWGO_MAP_COST_PROBE_ENABLED:'false'},{GROWGO_MAP_COST_PROBE_UID:'other'}]){
  assert.equal(await withMapPreparationPilot('tester',async()=>canPersistMapPreparation(),{...options,env:{...env,...probe}}),false);
 }
 for(const expiry of ['', 'invalid',new Date(at).toISOString(),new Date(at+3600001).toISOString()]){
  assert.equal(await withMapPreparationPilot('tester',async()=>canPersistMapPreparation(),{...options,env:{...env,GROWGO_MAP_PREPARATION_PILOT_EXPIRES_AT:expiry}}),false);
 }
});
test('expiry applies during a request and after completion',async()=>{
 let time=at,delayed;
 await withMapPreparationPilot('tester',async()=>{
  assert.equal(canPersistMapPreparation(),true);time+=600000;assert.equal(canPersistMapPreparation(),false);
 },{env,now:()=>time});
 await withMapPreparationPilot('tester',async()=>{
  delayed=new Promise(resolve=>setTimeout(()=>resolve(canPersistMapPreparation()),5));
 },options);
 assert.equal(await delayed,false);
});
test('concurrent requests and nested unselected calls do not inherit permission',async()=>{
 const values=await Promise.all(['tester','other'].map(uid=>withMapPreparationPilot(uid,async()=>{
  await new Promise(resolve=>setTimeout(resolve,2));return canPersistMapPreparation();
 },options)));assert.deepEqual(values,[true,false]);
 await withMapPreparationPilot('tester',async()=>{
  assert.equal(await withMapPreparationPilot('other',async()=>canPersistMapPreparation(),options),false);
  assert.equal(canPersistMapPreparation(),true);
 },options);
});
