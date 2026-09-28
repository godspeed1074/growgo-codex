import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const {startLeonardIntroduction:start}=createRequire(import.meta.url)('../lib/domain/quests/leonardStart.js');
test('separate players and locations get personal runs; existing completed run is never reset',async()=>{
 const saved=new Map();const db={collection:c=>({doc:id=>`${c}/${id}`}),runTransaction:async fn=>fn({get:async ref=>({exists:ref.startsWith('players/')||saved.has(ref),data:()=>ref.startsWith('players/')?{profileComplete:true}:saved.get(ref)}),create:(ref,data)=>saved.set(ref,data)})};
 const evidence=origin=>{const p=id=>({id,...origin,safe:true});const targets=Array.from({length:6},(_,i)=>({...p('pin'+i),previouslyCapturedByPlayer:true}));return{churches:[{...p('church'),basePins:targets}],parks:[{...p('park'),basePins:targets}],shops:[p('shop')]};};
 const a={uid:'player-a',email:'a@example.test',emailVerified:true},b={...a,uid:'player-b'};
 const oa={latitude:0,longitude:0},ob={latitude:-38.45,longitude:145.24};
 const ra=await start(db,a,oa,async()=>evidence(oa),true),rb=await start(db,b,ob,async()=>evidence(ob),true);
 assert.notEqual(ra.run.runId,rb.run.runId);assert.equal(saved.size,2);assert.deepEqual(rb.run.origin,ob);
 saved.set('leonardIntroductionPlayers/player-a',{...ra.run,stage:'completed',rewardBirdId:'leonard-introduction-dove'});
 const resumed=await start(db,a,ob,async()=>{throw Error('must not relocate a saved run');},true);
 assert.equal(resumed.started,false);assert.equal(resumed.run.stage,'completed');assert.deepEqual(resumed.run.origin,oa);
 await assert.rejects(start(db,{...b,emailVerified:false},ob,async()=>evidence(ob),true));
});
