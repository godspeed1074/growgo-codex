import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Timestamp}=require('firebase-admin/firestore');
const {ownedLongitudeBand,ownedLongitudeBands,readBandedOwnedPinStates}=require('../lib/infrastructure/pins/bandedOwnedPinStates.js');
const bounds={south:-38.02,north:-37.98,west:145,east:145.04};
const row=(pinId,longitude=145.01)=>({pinId,longitude,longitudeBandV1:ownedLongitudeBand(longitude),latitude:-38,ownerUid:'owner',ownerName:'Owner',ownedAt:Timestamp.now(),updatedAt:Timestamp.now(),level:1,plant:null});
function database(rows=[]){
 let calls=0;const filters=[];
 const query={where:(field,op,value)=>{filters.push([field,op,value]);return query;},get:async()=>{
  calls++;return {docs:rows.filter(r=>filters.every(([f,op,v])=>op==='in'?v.includes(r[f]):op==='>='?r[f]>=v:r[f]<=v)).map(r=>({data:()=>r}))};
 }};
 return {collection:()=>query,calls:()=>calls,filters};
}
const run=(db,ids,b=bounds,coverageVerified=true)=>readBandedOwnedPinStates({db,pinIds:ids,bounds:b,coverageVerified});
test('empty 350-pin view needs one query, not twelve',async()=>{
 const db=database();const r=await run(db,Array.from({length:350},(_,i)=>'p'+i));
 assert.equal(r.queries,1);assert.equal(r.documentsRead,0);assert.equal(db.calls(),1);
 assert.deepEqual(db.filters.map(([f,op])=>[f,op]),[['longitudeBandV1','in'],['latitude','>='],['latitude','<=']]);
});
test('bands exclude distant latitude-strip records and preserve every visible owned pin',async()=>{
 const rows=[...Array.from({length:600},(_,i)=>row('far'+i,-120)),...Array.from({length:650},(_,i)=>row('near'+i))];
 const r=await run(database(rows),rows.slice(600).map(r=>r.pinId));
 assert.equal(r.states.size,650);assert.equal(r.documentsRead,650);
 // Completeness can cost more than the old, incorrect 500-result cap.
});
test('partial edge bands keep exact final bounds and requested IDs',async()=>{
 const b={...bounds,west:145.005,east:145.015};
 const r=await run(database([row('left',145.004),row('yes',145.01),row('unrequested',145.01)]),['left','yes'],b);
 assert.deepEqual([...r.states.keys()],['yes']);assert.equal(r.documentsRead,3);
});
test('longitude edges, wraparound and changing bounds retain coverage',async()=>{
 for(const west of [-180,-179.99,-0.02,0,145,179.97]){
  const east=Math.min(180,west+0.02),bands=ownedLongitudeBands({...bounds,west,east});
  for(const lng of [west,(west+east)/2,east])assert.ok(bands.includes(ownedLongitudeBand(lng)));
 }
 const b={...bounds,west:179.99,east:-179.99};
 const r=await run(database([row('east',180),row('west',-180),row('far',0)]),['east','west','far'],b);
 assert.equal(r.states.size,2);
});
test('unverified migration or broad viewport fails before any query',async()=>{
 const db=database();await assert.rejects(run(db,['pin'],bounds,false),/migration/);
 await assert.rejects(run(db,['pin'],{...bounds,west:-180,east:180}),/budget/);
 assert.equal(db.calls(),0);assert.throws(()=>ownedLongitudeBand(NaN),/Invalid/);
});
test('fresh owner changes are read, query failures are never an empty success',async()=>{
 const r=row('pin');let result=await run(database([r]),['pin']);assert.equal(result.states.get('pin').ownerUid,'owner');
 r.ownerUid='changed';result=await run(database([r]),['pin']);assert.equal(result.states.get('pin').ownerUid,'changed');
 const q={where:()=>q,get:async()=>{throw Error('unavailable');}};
 await assert.rejects(run({collection:()=>q},['pin']),/unavailable/);
});
