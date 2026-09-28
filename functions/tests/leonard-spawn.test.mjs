import test from 'node:test';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{leonardSpawn}=require('../lib/domain/quests/leonardSpawn.js');
test('Leonard spawns 30 metres east of the start, including across the date line',()=>{
 for(const origin of [{latitude:-38.45185,longitude:145.23849},{latitude:51.5,longitude:0},{latitude:0,longitude:179.99999}]){
 const p=leonardSpawn(origin),rad=Math.PI/180,dl=(p.latitude-origin.latitude)*rad,dn=(p.longitude-origin.longitude)*rad;
 const a=Math.sin(dl/2)**2+Math.cos(origin.latitude*rad)*Math.cos(p.latitude*rad)*Math.sin(dn/2)**2;
 assert.ok(Math.abs(2*6371000*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))-30)<0.001);
 assert.ok((p.longitude-origin.longitude+360)%360>0);assert.ok((p.longitude-origin.longitude+360)%360<0.001);
 assert.deepEqual(leonardSpawn(origin),p);
 }
 assert.throws(()=>leonardSpawn({latitude:NaN,longitude:0}));
});
