import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url);
const {buildLeonardLandmarkQuery:query,extractLeonardLandmarks:extract,assembleLeonardEvidence:assemble}=require('../lib/domain/quests/leonardDiscovery.js');
const {selectLeonardLocations:select}=require('../lib/domain/quests/leonardLocations.js');
const origin={latitude:0,longitude:0};
const row=(id,tags,lon=0)=>({type:'node',id,lat:0,lon,tags});
test('bounded start lookup includes churches parks woods and stores; rejects invalid origin',()=>{
 assert.match(query(origin),/around:7000/);assert.match(query(origin),/center 501/);
 assert.match(query(origin),/natural/);assert.match(query(origin,1500),/around:1500/);assert.throws(()=>query(origin,8010));assert.throws(()=>query({latitude:NaN,longitude:0}));
});
test('closed/private/incomplete/out-of-range evidence cannot start a quest',()=>{
 assert.throws(()=>extract({elements:[],remark:'timeout'},origin));
 assert.throws(()=>extract({elements:Array(501).fill({})},origin));
 const groups=extract({elements:[row(1,{shop:'grocery',access:'private'}),row(2,{shop:'grocery','disused:shop':'grocery'}),row(3,{shop:'grocery'},1)]},origin);
 assert.deepEqual(groups,{churches:[],parks:[],shops:[]});
});
test('nearest unsuitable park is skipped and each player needs their own capture evidence',()=>{
 const groups=extract({elements:[row(1,{amenity:'place_of_worship',religion:'christian'}),row(2,{leisure:'park'},0.01),row(3,{natural:'wood'},0.02),row(4,{shop:'convenience'})]},origin);
 const pins=[...Array.from({length:6},(_,i)=>({id:'e'+i,latitude:0,longitude:i*0.0001,safe:true,previouslyCapturedByPlayer:false})),...Array.from({length:6},(_,i)=>({id:'s'+i,latitude:0,longitude:0.02+i*0.0001,safe:true,previouslyCapturedByPlayer:true}))];
 const plan=select(origin,assemble(origin,groups,pins));assert.equal(plan.ready,true);assert.equal(plan.park,'poi:osm:node:3');assert.equal(plan.stickPins.length,6);
 const other=select(origin,assemble(origin,groups,pins.map(p=>({...p,previouslyCapturedByPlayer:false}))));assert.equal(other.ready,false);
});
test('duplicate conflicting landmark positions are rejected',()=>{
 assert.throws(()=>extract({elements:[row(1,{shop:'grocery'}),row(1,{shop:'grocery'},0.01)]},origin));
});
test('quest parks need a proper name; woods remain eligible',()=>{
 const groups=extract({elements:[row(10,{leisure:'park'}),row(11,{leisure:'park',name:'  PARK  '}),row(12,{leisure:'park',name:'Smith Reserve'}),row(13,{leisure:'park',official_name:'Memorial Gardens'}),row(14,{natural:'wood'})]},origin);
 assert.deepEqual(groups.parks.map(p=>p.id),['poi:osm:node:12','poi:osm:node:13','poi:osm:node:14']);
});
