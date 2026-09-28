import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {hatchLeonardDove:hatch}=createRequire(import.meta.url)('../lib/domain/quests/leonardHatch.js');
const input={uid:'owner',runId:'run'};
function fixture(){
 const rows={'leonardIntroductionPlayers/owner':{schemaVersion:1,questId:'a-little-help-from-my-friends',uid:'owner',runId:'run',stage:'incubating',egg:0,nest:0,hatchAt:86401000},'birdQuestPlayers/owner':{bird:{id:'existing-test-dove'}}};
 const ref=path=>({path,collection:c=>({doc:id=>ref(`${path}/${c}/${id}`)})});
 const db={collection:c=>({doc:id=>ref(`${c}/${id}`)}),async runTransaction(fn){const writes=[];const r=await fn({get:async ref=>({exists:!!rows[ref.path],data:()=>structuredClone(rows[ref.path])}),create:(ref,data)=>writes.push(()=>{if(rows[ref.path])throw Error('exists');rows[ref.path]=data;}),update:(ref,data)=>writes.push(()=>Object.assign(rows[ref.path],data))});writes.forEach(w=>w());return r;}};
 return {db,rows};
}
test('exact hatch boundary, one award, existing test bird preserved',async()=>{
 const f=fixture();await assert.rejects(hatch(f.db,input,async()=>{},()=>86400999));
 assert.equal((await hatch(f.db,input,async()=>{},()=>86401000)).awarded,true);
 assert.equal((await hatch(f.db,input,async()=>{},()=>86402000)).awarded,false);
 assert.equal(f.rows['birdQuestPlayers/owner'].bird.id,'existing-test-dove');
 assert.equal(f.rows['leonardIntroductionPlayers/owner'].stage,'completed');
});
test('failed access and wrong run never grant bird',async()=>{
 const f=fixture(),before=structuredClone(f.rows);
 await assert.rejects(hatch(f.db,input,async()=>{throw Error('denied');},()=>86401000));
 await assert.rejects(hatch(f.db,{...input,runId:'other'},async()=>{},()=>86401000));assert.deepEqual(f.rows,before);
});
test('resetting a completed run cannot mint another dove',async()=>{
 const f=fixture();await hatch(f.db,input,async()=>{},()=>86401000);
 Object.assign(f.rows['leonardIntroductionPlayers/owner'],{stage:'incubating',runId:'new-run'});
 await assert.rejects(hatch(f.db,{...input,runId:'new-run'},async()=>{},()=>86401001));
});
