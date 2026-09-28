import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { commitLeonardMaterialAction: commit }=createRequire(import.meta.url)('../lib/domain/quests/leonardTransaction.js');
function fixture(){
 const records={ 'players/owner':{coins:500,xp:987,inventory:{wheat:17}},
 'leonardIntroductionPlayers/owner':{schemaVersion:1,uid:'owner',runId:'run',stage:'materials',sticks:6,cotton:0,egg:1,nest:0,cottonPurchased:false,hatchAt:null}};
 let writes=0;
 const db={collection:c=>({doc:id=>`${c}/${id}`}),async runTransaction(fn){
   const staged=[];const result=await fn({get:async ref=>({exists:!!records[ref],data:()=>structuredClone(records[ref])}),update:(ref,patch)=>staged.push([ref,patch])});
   for(const [ref,patch]of staged){Object.assign(records[ref],patch);writes++;}return result;
 }};
 return {db,records,writes:()=>writes};
}
const input={uid:'owner',runId:'run',action:'buy-cotton'};
test('coin and quest patches save together without touching other progress',async()=>{
 const f=fixture();const r=await commit(f.db,input,async()=>{},()=>1000);
 assert.equal(r.changed,true);assert.equal(f.records['players/owner'].coins,200);
 assert.equal(f.records['players/owner'].xp,987);assert.deepEqual(f.records['players/owner'].inventory,{wheat:17});
 assert.equal(f.records['leonardIntroductionPlayers/owner'].cotton,6);
 assert.equal((await commit(f.db,input,async()=>{},()=>2000)).changed,false);
 assert.equal(f.writes(),2);
});
test('failed eligibility check cannot charge or grant cotton',async()=>{
 const f=fixture();await assert.rejects(commit(f.db,input,async()=>{throw Error('Too far from seller');}));
 assert.equal(f.writes(),0);assert.equal(f.records['players/owner'].coins,500);
});
test('old run, corrupt inventory and missing account write nothing',async()=>{
 const f=fixture();await assert.rejects(commit(f.db,{...input,runId:'old'},async()=>{}));
 f.records['players/owner'].coins=NaN;await assert.rejects(commit(f.db,input,async()=>{}));
 delete f.records['players/owner'];await assert.rejects(commit(f.db,input,async()=>{}));assert.equal(f.writes(),0);
});
