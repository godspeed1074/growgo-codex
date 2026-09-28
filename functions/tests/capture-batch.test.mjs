import test from 'node:test';
import assert from 'node:assert/strict';
import {createCapturePinBatchHandler} from '../lib/api/capturePinBatch.js';
import {HttpsError} from 'firebase-functions/v2/https';
const now=Date.parse('2026-09-13T00:00:00Z');
const item=i=>({requestId:`request-${i}`,pinId:`pin-${i}`,latitude:0,longitude:0,accuracyMetres:5,clientCapturedAt:new Date(now).toISOString()});
const request=captures=>({auth:{uid:'test',token:{}},data:{captures}});
test('three entries preserve identity/evidence and ordered individual outcomes',async()=>{
  const calls=[];const handler=createCapturePinBatchHandler(async req=>{calls.push(req);if(req.data.pinId==='pin-2')throw new HttpsError('unavailable','Try again');return {accepted:true};},()=>now);
  const result=await handler(request([item(1),item(2),item(3)]));
  assert.equal(calls.length,3);assert.equal(calls[0].auth.uid,'test');assert.deepEqual(calls[0].data,item(1));
  assert.equal(result.results[0].response.accepted,true);assert.equal(result.results[1].error.code,'unavailable');assert.equal(result.results[2].response.accepted,true);
});
test('invalid batch envelopes cause no captures',async()=>{
  let calls=0;const handler=createCapturePinBatchHandler(async()=>{calls++;},()=>now);
  for(const entries of [[],Array.from({length:11},(_,i)=>item(i)),[item(1),item(1)],[item(1),{...item(2),latitude:999}]])await assert.rejects(handler(request(entries)));
  assert.equal(calls,0);
});
test('unauthenticated requests rejected before capture',async()=>{
  let calls=0;const handler=createCapturePinBatchHandler(async()=>{calls++;},()=>now);
  await assert.rejects(handler({data:{captures:[item(1)]}}));assert.equal(calls,0);
});
test('expired and future evidence never reaches capture handler',async()=>{
  let calls=0;const handler=createCapturePinBatchHandler(async()=>{calls++;},()=>now);
  for(const delta of [-16000,2000]){const result=await handler(request([{...item(1),clientCapturedAt:new Date(now+delta).toISOString()}]));assert.equal(result.results[0].error.code,'failed-precondition');}
  assert.equal(calls,0);
});
