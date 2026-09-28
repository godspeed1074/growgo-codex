import test from 'node:test';import assert from 'node:assert/strict';import {createRequire}from'node:module';
const {birdDeploymentDocument:key,changeOwnedBirdDeployment:change}=createRequire(import.meta.url)('../lib/domain/quests/ownedBirdDeployment.js');
function fixture(){const rows={'birdQuestPlayers/owner':{schemaVersion:1,uid:'owner',bird:{id:'alpha-dove-owner',level:1}},'playerBirdhouses/owner/birds/earned':{schemaVersion:1,uid:'owner',id:'earned',level:1,species:'dove'},'players/owner':{displayName:'Owner'}};
 const ref=path=>({path,collection:c=>({doc:id=>ref(`${path}/${c}/${id}`)})});
 const db={collection:c=>({doc:id=>ref(`${c}/${id}`)}),async runTransaction(fn){const pending=[];const r=await fn({get:async r=>({data:()=>structuredClone(rows[r.path])}),set:(r,v)=>pending.push(()=>rows[r.path]=v),update:(r,v)=>pending.push(()=>Object.assign(rows[r.path],v))});pending.forEach(w=>w());return r;}};return{db,rows};}
const input=birdId=>({uid:'owner',birdId,action:'deploy'});
const choose=async()=>({id:'plot',lat:-38.45,lng:145.24});
test('two birds use separate records; recalling earned bird leaves test dove deployed',async()=>{
 const f=fixture();const a=await change(f.db,input('alpha-dove-owner'),new Date(1000),choose),b=await change(f.db,input('earned'),new Date(1000),choose);
 assert.notEqual(key('owner','earned'),key('owner','alpha-dove-owner'));assert.equal(key('owner','alpha-dove-owner'),'alpha-dove-pilot');
 await change(f.db,{...input('earned'),action:'recall',expectedVisitId:b.id},new Date(2000),choose);
 assert.equal(f.rows['birdQuestDeployments/alpha-dove-pilot'].id,a.id);assert.equal(f.rows['birdQuestDeployments/alpha-dove-pilot'].status,'deployed');
});
test('relocation after six hours moves only selected bird and stale replay is a no-op',async()=>{
 const f=fixture();const a=await change(f.db,input('earned'),new Date(1000),choose);
 let calls=0;const next=async opts=>{calls++;assert.equal(opts.excludePinId,'plot');return{id:'next',lat:0,lng:0};};
 const request={...input('earned'),action:'relocate',expectedVisitId:a.id};
 const b=await change(f.db,request,new Date(a.expiresAt),next);assert.equal(b.landing.id,'next');
 await change(f.db,request,new Date(a.expiresAt+1),next);assert.equal(calls,1);
});
test('wrong ownership, stale recall and missing landing cannot overwrite visits',async()=>{
 const f=fixture();await assert.rejects(change(f.db,{...input('earned'),uid:'other'},new Date(1000),choose));
 await assert.rejects(change(f.db,input('earned'),new Date(1000),async()=>null));
 const a=await change(f.db,input('earned'),new Date(1000),choose);
 await assert.rejects(change(f.db,{...input('earned'),action:'recall',expectedVisitId:'old'},new Date(2000),choose));
 assert.equal(f.rows[`birdQuestDeployments/${key('owner','earned')}`].id,a.id);
});
