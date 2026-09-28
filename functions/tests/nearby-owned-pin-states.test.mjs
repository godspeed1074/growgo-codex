import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Timestamp}=require('firebase-admin/firestore');
const {readNearbyOwnedPinStates}=require('../lib/infrastructure/pins/nearbyOwnedPinStates.js');
function state(id,longitude=145){return {pinId:id,latitude:-38,longitude,ownerUid:'owner',ownerName:'Owner',ownedAt:Timestamp.now(),updatedAt:Timestamp.now(),level:2,plant:{seedId:'wheat_seed',plantedAt:Timestamp.now()},replantEnabled:true};}
function database(rows=new Map(),fail=false){
 let pending=0,peak=0;const calls=[];
 return {calls,peak:()=>peak,collection:name=>{
  assert.equal(name,'sharedBasePinStates');
  return {where:(field,op,ids)=>{
   assert.equal(field,'pinId');assert.equal(op,'in');assert.ok(ids.length<=30&&ids.length>0);calls.push(ids);
   return {get:async()=>{pending++;peak=Math.max(peak,pending);await new Promise(resolve=>setTimeout(resolve,1));pending--;if(fail)throw Error('database unavailable');return {docs:ids.filter(id=>rows.has(id)).map(id=>({data:()=>rows.get(id)}))};}};
  }};
 }};
}
test('nearby ownership beyond 500 unrelated latitude-strip records is not lost',async()=>{
 const rows=new Map(Array.from({length:600},(_,i)=>['far-'+i,state('far-'+i,-120)]));
 rows.set('visible',state('visible'));const db=database(rows);
 const r=await readNearbyOwnedPinStates(db,['visible']);
 assert.equal(r.states.size,1);assert.equal(r.documentsRead,1);assert.equal(r.states.get('visible').plant.seedId,'wheat_seed');
});
test('large views are complete, deduplicated and concurrency bounded',async()=>{
 const ids=Array.from({length:751},(_,i)=>'pin-'+i),db=database(new Map(ids.map(id=>[id,state(id)])));
 const r=await readNearbyOwnedPinStates(db,[...ids,ids[0]]);
 assert.equal(r.states.size,751);assert.equal(r.queries,26);assert.equal(r.documentsRead,751);assert.ok(db.peak()<=4);
 assert.equal(db.calls.flat().length,751);
});
test('empty inputs avoid queries; sparse areas expose the empty-query tradeoff',async()=>{
 const db=database();assert.equal((await readNearbyOwnedPinStates(db,[])).queries,0);
 const r=await readNearbyOwnedPinStates(db,Array.from({length:350},(_,i)=>'pin-'+i));
 assert.equal(r.queries,12);assert.equal(r.documentsRead,0);assert.equal(r.states.size,0);
});
test('owner, crop and level changes are fresh; there is no completed-state cache',async()=>{
 const rows=new Map([['pin',state('pin')]]),db=database(rows);
 assert.equal((await readNearbyOwnedPinStates(db,['pin'])).states.get('pin').ownerUid,'owner');
 rows.set('pin',{...state('pin'),ownerUid:'new-owner',level:4,plant:null});
 const updated=(await readNearbyOwnedPinStates(db,['pin'])).states.get('pin');
 assert.equal(updated.ownerUid,'new-owner');assert.equal(updated.level,4);assert.equal(updated.plant,null);
});
test('coordinate boundaries do not omit IDs; malformed documents are ignored',async()=>{
 const rows=new Map([['east',state('east',180)],['west',state('west',-180)],['bad',{pinId:'bad'}]]);
 const r=await readNearbyOwnedPinStates(database(rows),['east','west','bad']);
 assert.deepEqual([...r.states.keys()],['east','west']);
});
test('database failures reject the request rather than pretending pins are unowned',async()=>{
 await assert.rejects(readNearbyOwnedPinStates(database(new Map(),true),['pin']),/database unavailable/);
});
