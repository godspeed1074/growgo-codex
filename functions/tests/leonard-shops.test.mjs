import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {extractLeonardShops:extract,buildLeonardShopQuery:query,acquireLeonardShops:acquire}=createRequire(import.meta.url)('../lib/domain/quests/leonardShops.js');
const origin={latitude:-38.45,longitude:145.24};
const shop=(id,kind='supermarket',lat=-38.45)=>({id,type:'node',lat,lon:145.24,tags:{shop:kind,name:'Store'}});
test('approved store types sorted nearest first, other shops and distant shops excluded',()=>{
 const rows=[shop(1,'supermarket',-38.46),shop(2,'grocery'),shop(3,'convenience',-38.455),shop(4,'clothes'),shop(5,'supermarket',-37)];
 assert.deepEqual(extract({elements:rows},origin).map(s=>s.id),['poi:osm:node:2','poi:osm:node:3','poi:osm:node:1']);
});
test('closed, restricted, malformed and conflicting entries fail safely',()=>{
 const rows=['no','private'].map((access,i)=>({...shop(i+1),tags:{shop:'grocery',access}}));
 rows.push({...shop(3),tags:{shop:'grocery',disused:'yes'}},shop(4,'grocery',NaN));
 assert.deepEqual(extract({elements:rows},origin),[]);
 assert.throws(()=>extract({elements:[shop(1),shop(1,'grocery',-38.46)]},origin));
 assert.throws(()=>extract({elements:[],remark:'timeout'},origin));
 assert.throws(()=>extract({elements:Array.from({length:251},(_,i)=>shop(i+1))},origin));
});
test('way centres supported; identity deduplicated',()=>{
 const way={id:9,type:'way',center:{lat:-38.45,lon:145.24},tags:{shop:'convenience'}};
 assert.equal(extract({elements:[way,way]},origin).length,1);
});
test('bounded lookup is one request; invalid coordinates never reach transport',async()=>{
 let calls=0;const transport=async(q,signal)=>{calls++;assert.match(q,/around:7000/);assert.match(q,/out tags center 251/);assert.equal(signal.aborted,false);return{elements:[shop(1)]};};
 assert.equal((await acquire(origin,transport)).length,1);assert.equal(calls,1);
 assert.throws(()=>query({latitude:Infinity,longitude:0}));
 await assert.rejects(acquire({latitude:100,longitude:0},transport));assert.equal(calls,1);
});
