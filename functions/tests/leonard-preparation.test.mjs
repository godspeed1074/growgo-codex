import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{prepareLeonardArea:prepare}=require('../lib/domain/quests/leonardPreparation');
const {leonardArea}=require('../lib/domain/quests/leonardAutomaticLocations');
function fixture(){const values=new Map();let queue=Promise.resolve();return {values,collection:c=>({doc:id=>({key:c+'/'+id})}),runTransaction(fn){const result=queue.then(()=>fn({get:async r=>({data:()=>values.get(r.key)}),set:(r,v,o)=>values.set(r.key,o?.merge?{...values.get(r.key),...v}:v)}));queue=result.catch(()=>{});return result;}};}
test('shared area lease prevents duplicate preparation and then reuses success',async()=>{
 const db=fixture(),p={latitude:0,longitude:0};let resolve,count=0;const waiting=new Promise(r=>resolve=r);
 const first=prepare(db,'a',p,async()=>{count++;await waiting;},()=>1000);
 await new Promise(r=>setImmediate(r));assert.equal((await prepare(db,'b',p,async()=>{count++;},()=>1001)).status,'waiting');
 resolve();assert.equal((await first).status,'prepared');assert.equal((await prepare(db,'c',p,async()=>{count++;},()=>2000)).status,'cached');assert.equal(count,1);
 assert.ok([...db.values.keys()].every(k=>k.startsWith('leonardPreparedAreas/')||k.startsWith('leonardPreparationLimits/')));
});
test('failure is quiet, throttled across areas and can retry later',async()=>{
 const db=fixture(),p={latitude:0,longitude:0};let count=0;const fail=async()=>{count++;throw Error('busy');};
 assert.equal((await prepare(db,'a',p,fail,()=>1000)).status,'waiting');
 await prepare(db,'a',{latitude:1,longitude:1},fail,()=>1001);assert.equal(count,1);
 await prepare(db,'b',p,fail,()=>1002);assert.equal(count,1);
 assert.equal((await prepare(db,'a',p,async()=>{count++;},()=>301001)).status,'prepared');assert.equal(count,2);
});
test('nearby GPS jitter maps to same shared area and invalid locations reject',()=>{
 assert.equal(leonardArea({latitude:-38.4501,longitude:145.2401}).id,leonardArea({latitude:-38.4502,longitude:145.2402}).id);
 assert.throws(()=>leonardArea({latitude:100,longitude:0}));
});
