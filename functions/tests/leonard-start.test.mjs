import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {startLeonardPilot:start}=createRequire(import.meta.url)('../lib/domain/quests/leonardStart.js');
const who={uid:'LkR8ugTK6lXGFfUlLvKSiqMoMBh1',email:'godspeed1074@gmail.com',emailVerified:true};
const origin={latitude:-38.45,longitude:145.24};
const p=id=>({id,...origin,safe:true});
const targets=prefix=>Array.from({length:6},(_,i)=>({...p(prefix+i),previouslyCapturedByPlayer:true}));
const evidence=()=>({churches:[{...p('church'),basePins:targets('egg')}],parks:[{...p('park'),basePins:targets('stick')}],shops:[p('shop')]});
function fixture(){let saved;const db={collection:name=>({doc:uid=>`${name}/${uid}`}),async runTransaction(fn){let pending;const result=await fn({get:async ref=>ref.startsWith('players/')?{exists:true,data:()=>({profileComplete:true})}:{exists:!!saved,data:()=>saved},create:(_,run)=>{pending=run;}});if(pending)saved=pending;return result;}};return {db,get:()=>saved};}
test('pilot disabled by default; wrong UID or unverified account rejected',async()=>{
 const f=fixture();await assert.rejects(start(f.db,who,origin,async()=>evidence()));
 await assert.rejects(start(f.db,{...who,uid:'other'},origin,async()=>evidence(),true));
 await assert.rejects(start(f.db,{...who,emailVerified:false},origin,async()=>evidence(),true));assert.equal(f.get(),undefined);
});
test('start saves fixed targets; repeat resumes without resolving or awarding anything',async()=>{
 const f=fixture();const first=await start(f.db,who,origin,async()=>evidence(),true,()=>1000);
 assert.equal(first.started,true);assert.equal(first.run.egg,0);assert.equal(first.run.stage,'meet-leonard');
 const again=await start(f.db,who,origin,async()=>{throw Error('should not run');},true);
 assert.equal(again.started,false);assert.deepEqual(again.run,first.run);
});
test('missing shop creates no partial run',async()=>{
 const f=fixture();await assert.rejects(start(f.db,who,origin,async()=>({...evidence(),shops:[]}),true));assert.equal(f.get(),undefined);
});

function lookupFixture(){
 let saved;
 const snapshot=path=>({exists:path.startsWith('players/')||!!saved,data:()=>path.startsWith('players/')?{profileComplete:true}:saved});
 const db={collection:c=>({doc:id=>({path:`${c}/${id}`,get:async()=>snapshot(`${c}/${id}`)})}),async runTransaction(fn){
   let pending;const tx={get:async ref=>snapshot(ref.path),create:(_,v)=>{pending=v;}};
   // Simulate an optimistic retry: only the final attempt is committed.
   await fn(tx);pending=undefined;const result=await fn(tx);if(pending)saved=pending;return result;
 }};
 return{db,get:()=>saved};
}
test('shop lookup runs once outside transaction retries; resume preserves seller without searching',async()=>{
 const f=lookupFixture();let lookups=0;
 const transport=async()=>{lookups++;return{elements:[{id:123,type:'node',lat:origin.latitude,lon:origin.longitude,tags:{shop:'supermarket'}}]};};
 const first=await start(f.db,who,origin,async()=>({...evidence(),shops:[]}),true,()=>1000,transport);
 assert.equal(lookups,1);assert.equal(first.run.locations.shop,'poi:osm:node:123');
 assert.deepEqual(first.run.sellerLocation,{id:'poi:osm:node:123',...origin});
 const again=await start(f.db,who,{latitude:0,longitude:0},async()=>{throw Error('no resolution on resume');},true,()=>2000,transport);
 assert.equal(lookups,1);assert.deepEqual(again.run,first.run);
});
test('unavailable shop lookup leaves no partial quest, and disabled pilot does not search',async()=>{
 const f=lookupFixture();let lookups=0;
 const transport=async()=>{lookups++;return{elements:[]};};
 await assert.rejects(start(f.db,who,origin,async()=>evidence(),false,()=>1000,transport));assert.equal(lookups,0);
 await assert.rejects(start(f.db,who,origin,async()=>evidence(),true,()=>1000,transport));assert.equal(f.get(),undefined);
});
