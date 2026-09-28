import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const admin=require('../lib/firebaseAdmin.js');
const {Timestamp}=require('firebase-admin/firestore');
const {requireActiveDeviceSessionIfEnabled:mutate,verifyActiveDeviceSessionIfEnabled:verify,hashDeviceId}=require('../lib/domain/players/activeDeviceSession.js');

function harness(t, age=120000){
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-09-16T12:00:00Z')});
 const params={uid:'player-a',deviceId:'device_123456789012345678901234',env:{GROWGO_ACTIVE_DEVICE_SESSION_ENFORCED:'true'}};
 let row={schemaVersion:1,deviceHash:hashDeviceId(params.deviceId),activatedAt:Timestamp.fromMillis(Date.now()-500000),lastSeenAt:Timestamp.fromMillis(Date.now()-age)};
 let moderation,version=1,writes=0,reads=0,conflict;
 const db={collection:name=>({doc:()=>({
   get:async()=>{
     reads++;const value=name==='playerModeration'?moderation:row;
     return {exists:!!value,data:()=>value,updateTime:Timestamp.fromMillis(version)};
   },
   update:async(value,condition)=>{
     if(conflict){const fn=conflict;conflict=null;fn();throw Object.assign(new Error('changed'),{code:9});}
     assert.ok(condition?.lastUpdateTime,'must protect against transfer race');
     if(condition.lastUpdateTime.toMillis()!==version)throw Object.assign(new Error('changed'),{code:9});
     row={...row,...value};version++;writes++;
   }
 })})};
 t.mock.method(admin,'getAdminFirestore',()=>db);
 return {params,get writes(){return writes},get reads(){return reads},setModeration:v=>moderation=v,
 setRow:v=>{row=v;version++},get row(){return row},onConflict:fn=>conflict=fn};
}

test('busy captures retain fresh checks but coalesce activity writes for one minute',async t=>{
 const h=harness(t);
 for(let i=0;i<20;i++)assert.deepEqual(await mutate(h.params),{enforced:true});
 assert.equal(h.writes,1);assert.equal(h.reads,40);
 t.mock.timers.tick(59999);await mutate(h.params);assert.equal(h.writes,1);
 t.mock.timers.tick(1);await mutate(h.params);assert.equal(h.writes,2);
});
test('simultaneous requests cannot each update the same stale session',async t=>{
 const h=harness(t);await Promise.all(Array.from({length:20},()=>mutate(h.params)));assert.equal(h.writes,1);
});
test('read-only map checks never write activity',async t=>{
 const h=harness(t);await verify(h.params);assert.equal(h.writes,0);
});
test('ban and device transfer are enforced even within the activity interval',async t=>{
 const h=harness(t,0);h.setModeration({status:'banned'});
 await assert.rejects(mutate(h.params),{code:'permission-denied'});assert.equal(h.writes,0);
 h.setModeration(undefined);h.setRow({...h.row,deviceHash:hashDeviceId('another-device')});
 await assert.rejects(mutate(h.params),{code:'failed-precondition'});assert.equal(h.writes,0);
});
test('transfer during the conditional write is reverified and blocks the old device',async t=>{
 const h=harness(t);h.onConflict(()=>h.setRow({...h.row,deviceHash:hashDeviceId('another-device')}));
 await assert.rejects(mutate(h.params),{code:'failed-precondition'});assert.equal(h.writes,0);
});
test('a concurrent same-device update succeeds after fresh verification',async t=>{
 const h=harness(t);h.onConflict(()=>h.setRow({...h.row,lastSeenAt:Timestamp.now()}));
 assert.deepEqual(await mutate(h.params),{enforced:true});assert.equal(h.writes,0);assert.equal(h.reads,4);
});
test('missing session rejects, and disabled enforcement still checks moderation',async t=>{
 const h=harness(t);h.setRow(undefined);await assert.rejects(mutate(h.params),{code:'failed-precondition'});
 assert.deepEqual(await mutate({...h.params,env:{}}),{enforced:false});assert.equal(h.writes,0);
 h.setModeration({status:'banned'});await assert.rejects(mutate({...h.params,env:{}}),{code:'permission-denied'});
});
test('future activity timestamps are corrected instead of suppressing writes indefinitely',async t=>{
 const h=harness(t,-86400000);await mutate(h.params);assert.equal(h.writes,1);
});
test('non-conflict storage errors remain failures rather than bypassing checks',async t=>{
 const h=harness(t);h.onConflict(()=>{throw Object.assign(new Error('unavailable'),{code:14});});
 await assert.rejects(mutate(h.params),{code:14});assert.equal(h.writes,0);
});
