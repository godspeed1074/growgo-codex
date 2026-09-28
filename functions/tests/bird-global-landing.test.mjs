import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {Timestamp}=require('firebase-admin/firestore');
const {chooseGlobalBirdLanding,BIRD_LANDING_WINDOW_LIMIT}=require('../lib/domain/quests/globalBirdLanding.js');
const {serializeSharedBasePinStateForStorage:store,sharedWorldDocumentId:hash}=require('../lib/domain/world/sharedWorld.js');
const now=new Date('2026-09-12T12:00:00Z'),day=86400000;
const plot=(id=1,changes={})=>({pinId:`ggpin:v1:osm-way:99999999:${id}`,latitude:51.5,longitude:-0.1,
  ownerUid:'other',ownerName:'Other',ownedAt:new Date(+now-day),updatedAt:now,level:1,replantEnabled:false,ownerAvatarUrl:null,
  plant:{seedId:'corn_seed',plantedAt:new Date(+now-day),miracleGrownAt:null},...changes});

// Model indexed query boundaries and read limits, never live Firestore.
function fixture(plots,roll=()=>0,bases={}){
  const docs=plots.map(p=>({id:hash(p.pinId),data:()=>store(p)})),reads={queries:0,plots:0,bases:0};
  const fieldValue=(doc,field)=>field.split('.').reduce((v,k)=>v?.[k],doc.data())?.toMillis();
  class Query {
    filters=[];field=null;max=0;
    clone(changes){return Object.assign(new Query(),this,changes);}
    where(field,op,value){return this.clone({filters:[...this.filters,[field,op,value.toMillis()]]});}
    orderBy(field){return this.clone({field});}
    startAt(value){return this.where(this.field,'>=',value);}
    endBefore(value){return this.where(this.field,'<',value);}
    limit(max){assert.ok(max>0&&max<=BIRD_LANDING_WINDOW_LIMIT);return this.clone({max});}
  }
  const db={collection:name=>{
    assert.ok(['sharedBasePinStates','authoritativeWaterPinStates'].includes(name),'No world geometry/player scans');
    if(name==='sharedBasePinStates')return new Query();
    return {doc:id=>({baseId:id})};
  }};
  const tx={get:async request=>{
    if(request.baseId){reads.bases++;const p=plots.find(p=>p.pinId===request.baseId);
      return {data:()=>Object.hasOwn(bases,request.baseId)?bases[request.baseId]:{pinId:p.pinId,type:'base',latitude:p.latitude,longitude:p.longitude}};}
    assert.ok(request instanceof Query);reads.queries++;
    const results=docs.filter(doc=>request.filters.every(([field,op,b])=>{
      const a=fieldValue(doc,field);if(a===undefined)return false;
      return op==='>'?a>b:op==='>='?a>=b:op==='<'?a<b:a<=b;
    })).sort((a,b)=>fieldValue(a,request.field)-fieldValue(b,request.field)||a.id.localeCompare(b.id)).slice(0,request.max);
    reads.plots+=results.length;return {docs:results,size:results.length};
  }};
  return {reads,run:(options={})=>chooseGlobalBirdLanding({db,tx,now,ownerUid:'owner',roll,...options})};
}

test('server can choose own/other plots worldwide in every growing/harvest stage',async()=>{
  for(const ownerUid of ['owner','other'])for(const age of [0,7,14,21,27]){
    const p=plot(1,{ownerUid,plant:{seedId:'wheat_seed',plantedAt:new Date(+now-age*day),miracleGrownAt:null}});
    assert.deepEqual(await fixture([p]).run(),{id:p.pinId,lat:51.5,lng:-0.1});
  }
});
test('wrap-around finds earlier crops; Miracle Grow includes legacy older planting dates',async()=>{
  const p=plot(1,{plant:{seedId:'corn_seed',plantedAt:new Date(+now-50*day),miracleGrownAt:new Date(+now-day)}});
  const f=fixture([p],max=>max-1);assert.equal((await f.run()).id,p.pinId);assert.equal(f.reads.queries,4);
});
test('empty, unowned, expired, future planted and future Miracle Grow plots never land',async()=>{
  const plants=[null,{seedId:'corn_seed',plantedAt:new Date(+now-28*day),miracleGrownAt:null},
    {seedId:'corn_seed',plantedAt:new Date(+now+1),miracleGrownAt:null},
    {seedId:'corn_seed',plantedAt:new Date(+now-day),miracleGrownAt:new Date(+now-7*day)},
    {seedId:'corn_seed',plantedAt:new Date(+now-day),miracleGrownAt:new Date(+now+1)}];
  for(const plant of plants)assert.equal(await fixture([plot(1,{plant})]).run(),null);
  assert.equal(await fixture([plot(1,{ownerUid:''})]).run(),null);
});
test('water, missing classification, displaced coordinates and invented IDs are excluded',async()=>{
  const p=plot();
  for(const base of [undefined,{pinId:p.pinId,type:'water',latitude:p.latitude,longitude:p.longitude},
    {pinId:p.pinId,type:'base',latitude:0,longitude:0}])
    assert.equal(await fixture([p],()=>0,{[p.pinId]:base}).run(),null);
  assert.equal(await fixture([plot(1,{pinId:'made-up'})]).run(),null);
  assert.equal(await fixture([plot(1,{latitude:91})]).run(),null);
});
test('selection can reach multiple eligible plots instead of always choosing nearest/first',async()=>{
  const choices=[plot(1),plot(2,{latitude:-38.45,longitude:145.24})];
  const selected=await Promise.all([()=>0,max=>max-1].map(roll=>fixture(choices,roll).run()));
  assert.equal(new Set(selected.map(p=>p.id)).size,2);
});
test('large crop sets have a fixed read ceiling; no unbounded or repeated global scan',async()=>{
  const plots=Array.from({length:2000},(_,i)=>plot(i,{plant:{seedId:'corn_seed',plantedAt:new Date(+now-day-i),miracleGrownAt:new Date(+now-day-i)}}));
  const f=fixture(plots);assert.ok(await f.run());
  assert.ok(f.reads.plots<=64);assert.ok(f.reads.queries<=4);assert.equal(f.reads.bases,1);
});
test('automatic travel excludes the previous host even if it is the only eligible plot',async()=>{
  const a=plot(1),b=plot(2);
  const only=fixture([a]);assert.equal(await only.run({excludePinId:a.pinId}),null);
  assert.equal(only.reads.bases,0,'Do not even revalidate the excluded host');
  assert.equal((await fixture([a,b]).run({excludePinId:a.pinId})).id,b.pinId);
});
