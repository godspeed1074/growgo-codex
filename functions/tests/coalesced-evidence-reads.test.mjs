import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url);
const {createCoalescedEvidenceReads:create}=require('../lib/infrastructure/pins/coalescedEvidenceReads.js');
test('partial overlap reads only missing keys and preserves order',async()=>{
 const calls=[];let release;const gate=new Promise(r=>release=r);
 const read=create(x=>x,async xs=>{calls.push(xs);await gate;return xs.map(x=>x+'!');});
 const a=read(['a','b']),b=read(['b','c','b']);await Promise.resolve();
 assert.deepEqual(calls,[['a','b'],['c']]);release();
 assert.deepEqual(await a,['a!','b!']);assert.deepEqual(await b,['b!','c!','b!']);
 await read(['b']);assert.deepEqual(calls.at(-1),['b']);
});
test('failed or incomplete reads reject every waiter and allow retry',async()=>{
 for(const incomplete of [false,true]){
  let n=0;const read=create(x=>x,async xs=>{n++;if(n===1){if(incomplete)return [];throw Error('failure');}return xs;});
  const outcomes=await Promise.allSettled([read(['a']),read(['a'])]);
  assert.ok(outcomes.every(x=>x.status==='rejected'));assert.equal(n,1);
  assert.deepEqual(await read(['a']),['a']);assert.equal(n,2);
 }
});
test('bounded pending registry falls back to real reads, not missing results',async()=>{
 let release;const gate=new Promise(r=>release=r);let count=0;
 const read=create(x=>x,async xs=>{count+=xs.length;await gate;return xs;},1);
 const a=read(['a','b']),b=read(['a','b']);release();
 assert.deepEqual(await a,['a','b']);assert.deepEqual(await b,['a','b']);assert.equal(count,3);
});
