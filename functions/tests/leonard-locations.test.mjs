import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const {selectLeonardLocations:select}=createRequire(import.meta.url)('../lib/domain/quests/leonardLocations.js');
const origin={latitude:-38.45,longitude:145.24};
const place=(id,delta=0)=>({id,...origin,latitude:origin.latitude+delta,safe:true});
const pins=(prefix,count=6)=>Array.from({length:count},(_,i)=>({...place(prefix+i,i*.0001),previouslyCapturedByPlayer:true}));
const fixture=()=>({churches:[{...place('church'),basePins:pins('egg')}],parks:[{...place('park'),basePins:pins('stick')}],shops:[place('shop')]});
test('selects six distinct personal targets and a shop without mutating evidence',()=>{
 const s=fixture(),copy=structuredClone(s),r=select(origin,s);
 assert.equal(r.ready,true);assert.equal(r.eggPins.length,6);assert.equal(r.stickPins.length,6);assert.deepEqual(s,copy);
});
test('checks next closest park if first lacks six previously captured pins',()=>{
 const s=fixture();s.parks[0].basePins[0].previouslyCapturedByPlayer=false;
 s.parks.push({...place('next-park',.001),basePins:pins('next')});
 assert.equal(select(origin,s).park,'next-park');
});
test('duplicates do not satisfy six, unsafe targets and distant shops block start',()=>{
 const s=fixture();s.churches[0].basePins=Array(6).fill(s.churches[0].basePins[0]);assert.equal(select(origin,s).ready,false);
 const t=fixture();t.parks[0].basePins[0].safe=false;assert.equal(select(origin,t).ready,false);
 const u=fixture();u.shops=[place('far',1)];assert.equal(select(origin,u).ready,false);
});
test('conflicting pin identities and invalid origins fail',()=>{
 const s=fixture();s.parks[0].basePins.push({...s.parks[0].basePins[0],latitude:0});
 assert.throws(()=>select(origin,s));assert.throws(()=>select({latitude:NaN,longitude:0},fixture()));
});
