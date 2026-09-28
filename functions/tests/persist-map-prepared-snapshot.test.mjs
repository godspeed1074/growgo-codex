import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {persistMapPreparedSnapshot}=require('../lib/infrastructure/pins/persistMapPreparedSnapshot.js');
const old={version:1,cellKey:'cell',data:Buffer.from('old')},next={...old,data:Buffer.from('new')};
function db(current=old){let writes=0;return {writes:()=>writes,collection:()=>({doc:()=>({})}),runTransaction:async(fn,options)=>{
 assert.equal(options.maxAttempts,1);
 return fn({get:async()=>({exists:!!current,data:()=>current}),set:()=>writes++});
}};}
test('conditional save reads once and writes only exact matching saved bytes',async()=>{
 const d=db(),counts=[];
 assert.equal(await persistMapPreparedSnapshot(d,'cell',old,next,new AbortController().signal,x=>counts.push(x)),true);
 assert.deepEqual(counts,['read','write']);assert.equal(d.writes(),1);
});
test('missing or changed generation is not overwritten',async()=>{
 for(const value of [null,{...old,version:2},{...old,data:Buffer.from('refreshed')}]){
  const d=db(value);assert.equal(await persistMapPreparedSnapshot(d,'cell',old,next,new AbortController().signal),false);assert.equal(d.writes(),0);
 }
});
test('aborted preparation cannot begin persistence',async()=>{
 const d=db(),c=new AbortController();c.abort();
 await assert.rejects(persistMapPreparedSnapshot(d,'cell',old,next,c.signal));assert.equal(d.writes(),0);
});
