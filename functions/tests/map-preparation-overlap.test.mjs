import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const admin=require('../lib/firebaseAdmin.js');
const {cacheNearbyPinClassifications:prepare}=require('../lib/api/getNearbyBasePins.js');
let serial=0;
function harness(t){
 const prefix=`overlap-test-${++serial}-`,rows=new Map(),reads=[],writes=[];
 let failCommit=false,failRead=false,beforeCommit=null;
 const ref=path=>({path,doc:id=>ref(`${path}/${id}`)});
 const db={collection:ref,getAll:async(...refs)=>{
  if(failRead)throw Error('read failed');
  return refs.map(r=>{reads.push(r.path);const data=rows.get(r.path);return {exists:!!data,data:()=>data};});
 },batch:()=>{const pending=[];return {set:(r,v)=>pending.push([r.path,v]),commit:async()=>{
  if(beforeCommit)await beforeCommit();
  if(failCommit)throw Error('commit failed');
  for(const [p,v]of pending){rows.set(p,v);writes.push(p);}
 }};}};
 t.mock.method(admin,'getAdminFirestore',()=>db);
 const pin=n=>({pinId:prefix+n,type:'base',latitude:-38+n/10000,longitude:145});
 return {rows,reads,writes,pin,path:p=>'authoritativeWaterPinStates/'+p.pinId,
  failCommit:v=>failCommit=v,failRead:v=>failRead=v,beforeCommit:fn=>beforeCommit=fn};
}

test('baseline: overlapping cells reread shared evidence but do not rewrite unchanged records',async t=>{
 const h=harness(t),a=h.pin(1),b=h.pin(2),c=h.pin(3);
 await prepare([a,b],true);await prepare([b,c],true);
 assert.equal(h.reads.length,4);assert.equal(h.writes.length,3);
 assert.equal(h.reads.filter(p=>p===h.path(b)).length,2);
});
test('baseline: 350-pin identical cell preparations read 700 documents, write 350',async t=>{
 const h=harness(t),pins=Array.from({length:350},(_,i)=>h.pin(i));
 await prepare(pins,true);await prepare(pins,true);
 assert.equal(h.reads.length,700);assert.equal(h.writes.length,350);
});
test('concurrent identical 350-pin preparation shares pending reads without skipping persistence',async t=>{
 const h=harness(t),pins=Array.from({length:350},(_,i)=>h.pin(i));
 await Promise.all([prepare(pins,true),prepare(pins,true)]);
 assert.equal(h.reads.length,350);
 assert.equal(h.rows.size,350);
 // Writes remain independently acknowledged; no write-saving claim.
 await prepare(pins,true);assert.equal(h.reads.length,700);
});
test('aborting one caller does not cancel another callers shared database read',async t=>{
 const h=harness(t),p=h.pin(1),controller=new AbortController();
 const a=prepare([p],true,controller.signal),b=prepare([p],true);controller.abort();
 const results=await Promise.allSettled([a,b]);
 assert.equal(results[0].status,'rejected');assert.equal(results[1].status,'fulfilled');
 assert.ok(h.rows.has(h.path(p)));assert.equal(h.reads.length,1);
});
test('changed classification and coordinates are persisted even in a warm instance',async t=>{
 const h=harness(t),p=h.pin(1);await prepare([p],true);
 const changed={...p,type:'water',latitude:p.latitude+0.001};
 await prepare([changed],true);assert.equal(h.rows.get(h.path(p)).type,'water');
 assert.equal(h.rows.get(h.path(p)).latitude,changed.latitude);assert.equal(h.writes.length,2);
});
test('missing durable evidence is repaired despite a previous warm observation',async t=>{
 const h=harness(t),p=h.pin(1);await prepare([p],true);h.rows.delete(h.path(p));
 await prepare([p],true);assert.ok(h.rows.has(h.path(p)));assert.equal(h.writes.length,2);
});
test('failed persistence cannot mark evidence as confirmed for a subsequent non-forced call',async t=>{
 const h=harness(t),p=h.pin(1);h.failCommit(true);
 await assert.rejects(prepare([p],true),/commit failed/);assert.equal(h.rows.size,0);
 h.failCommit(false);await prepare([p],false);assert.ok(h.rows.has(h.path(p)));
});
test('failed read can be retried without cached success',async t=>{
 const h=harness(t),p=h.pin(1);h.failRead(true);
 await assert.rejects(prepare([p],true),/read failed/);
 h.failRead(false);await prepare([p],false);assert.ok(h.rows.has(h.path(p)));
});
test('concurrent preparation callers do not return before evidence commits',async t=>{
 const h=harness(t),p=h.pin(1);let release,finished=0;
 const gate=new Promise(r=>release=r);h.beforeCommit(()=>gate);
 const jobs=[prepare([p],true),prepare([p],true)].map(p=>p.then(()=>finished++));
 await new Promise(setImmediate);assert.equal(finished,0);assert.equal(h.rows.size,0);
 release();await Promise.all(jobs);assert.equal(finished,2);assert.ok(h.rows.has(h.path(p)));
});
test('already-aborted preparation performs no database work',async t=>{
 const h=harness(t),controller=new AbortController();controller.abort();
 await assert.rejects(prepare([h.pin(1)],true,controller.signal));
 assert.equal(h.reads.length,0);assert.equal(h.writes.length,0);
});
