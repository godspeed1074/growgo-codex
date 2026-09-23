import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{acquireLeonardAutomaticLocations:acquire}=require('../lib/domain/quests/leonardAutomaticLocations.js');
const {selectLeonardLocations:select}=require('../lib/domain/quests/leonardLocations.js');
const {generateCanonicalPinsForWay:generate}=require('../lib/domain/pins/canonicalPinGenerator.js');
const {createHash}=await import('node:crypto');
const origin={latitude:0,longitude:0};
const coords=[{latitude:0,longitude:0},{latitude:0,longitude:0.0025}];
const pins=generate({generatorVersion:1,sourceType:'osm-way',sourceId:'7',spacingMetres:50,orderedCoordinates:coords});
const byHash=new Map(pins.map(p=>[createHash('sha256').update(p.pinId).digest('hex'),p.pinId]));
function dbFor(uid,captured,water=false){return {collection:name=>({doc:id=>{if(name==='authoritativeWaterPinStates')return {waterId:id};assert.equal(id,uid);return{collection:()=>({doc:hash=>hash})};}}),getAll:async(...ids)=>ids.map(id=>({data:()=>id.waterId?(water?{pinId:id.waterId,type:'water'}:undefined):captured?{pinId:byHash.get(id),capturedAt:1}:undefined}))};}
const transport=async query=>query.includes('out tags')?{elements:[
 {type:'node',id:1,lat:0,lon:0,tags:{amenity:'place_of_worship',religion:'christian'}},
 {type:'node',id:2,lat:0,lon:0,tags:{leisure:'park',name:'Test Reserve'}},
 {type:'node',id:3,lat:0,lon:0,tags:{shop:'grocery'}}
]}:{elements:[{type:'way',id:7,tags:{highway:'residential'},geometry:coords.map(p=>({lat:p.latitude,lon:p.longitude}))}]};
test('automatic evidence uses exactly two lookups and personal canonical capture receipts',async()=>{
 let calls=0;const evidence=await acquire(dbFor('a',true),'a',origin,async(...args)=>{calls++;return transport(...args);});
 assert.equal(calls,2);const plan=select(origin,evidence);assert.equal(plan.ready,true);assert.equal(plan.stickPins.length,6);
 const other=await acquire(dbFor('b',false),'b',origin,transport);assert.equal(select(origin,other).ready,false);
});
test('missing landmark expands only through the three bounded landmark radii before roads or receipt reads',async()=>{
 let calls=0;await assert.rejects(acquire({},'a',origin,async()=>{calls++;return{elements:[]};}));assert.equal(calls,3);
});
test('incomplete road response fails closed',async()=>{
 await assert.rejects(acquire({},'a',origin,async q=>q.includes('out tags')?transport(q):{remark:'runtime timeout',elements:[]}));
});
test('known water pins cannot host quest resources',async()=>{
 const evidence=await acquire(dbFor('a',true,true),'a',origin,transport);
 assert.equal(select(origin,evidence).ready,false);
});
test('many parks do not block a suitable nearest route',async()=>{
 let calls=0;
 const evidence=await acquire(dbFor('a',true),'a',origin,async q=>{
  calls++;const payload=await transport(q);
  if(q.includes('out tags'))for(let i=0;i<85;i++)payload.elements.push({type:'node',id:100+i,lat:0,lon:0.01+i*0.0001,tags:{natural:'wood'}});
  return payload;
 });
 assert.equal(select(origin,evidence).ready,true);assert.equal(calls,2);
});
test('background warming never reads capture history and uses a shared area query',async()=>{
 const db=dbFor('unused',false);const original=db.collection;db.collection=name=>{assert.notEqual(name,'playerCaptureStates');return original(name);};
 const queries=[];await acquire(db,'unused',{latitude:0.0001,longitude:0.0001},async q=>{queries.push(q);return transport(q);},true);
 assert.equal(queries.length,2);assert.match(queries[0],/around:1500,0,0/);
});
function denseDb(water=false){const ids=new Map();let reads=0;return {get reads(){return reads;},collection:name=>({doc:id=>{
 if(name==='authoritativeWaterPinStates'){ids.set(createHash('sha256').update(id).digest('hex'),id);return {water:id};}
 return {collection:()=>({doc:hash=>({hash})})};
 }}),getAll:async(...refs)=>{assert.ok(refs.length<=24);reads+=refs.length;return refs.map(r=>({data:()=>r.water?(water?{pinId:r.water,type:'water'}:undefined):{pinId:ids.get(r.hash),capturedAt:1}}));}};}
const dense=async q=>q.includes('out tags')?transport(q):{elements:Array.from({length:150},(_,i)=>({type:'way',id:10000+i,tags:{highway:'residential'},geometry:coords.map(p=>({lat:p.latitude,lon:p.longitude}))}))};
test('more than 600 candidates succeed with only nearest verification batches',async()=>{
 const db=denseDb(),e=await acquire(db,'a',origin,dense);assert.equal(select(origin,e).ready,true);assert.ok(db.reads<=48);
});
test('rejected water candidates still count against the read budget',async()=>{
 const db=denseDb(true);await assert.rejects(acquire(db,'a',origin,dense),/verification budget/);assert.equal(db.reads,600);
});
