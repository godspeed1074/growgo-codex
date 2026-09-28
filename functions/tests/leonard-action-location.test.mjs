import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {verifyLeonardActionLocation:verify}=require('../lib/domain/quests/leonardActionLocation.js');
const state={locations:{eggPins:['egg'],stickPins:['stick']}};
const point={latitude:-38.45,longitude:145.24};
const gps={...point,accuracyMetres:5};
const saved={leonard:point,seller:{latitude:-38.46,longitude:145.24},targets:{egg:point,stick:point}};
test('talk and personal pickups use saved targets, not ordinary daily capture status',()=>{
 for(const action of [{kind:'talk'},{kind:'collect-egg',pinId:'egg'},{kind:'collect-stick',pinId:'stick'}]){
  assert.doesNotThrow(()=>verify(state,action,saved,gps,100));
  assert.throws(()=>verify(state,action,saved,{...gps,latitude:-38.5},100),/closer/);
 }
});
test('cotton purchase requires proximity to the stationary seller',()=>{
 assert.throws(()=>verify(state,{kind:'buy-cotton'},saved,gps,100),/closer/);
 assert.doesNotThrow(()=>verify(state,{kind:'buy-cotton'},saved,{...saved.seller,accuracyMetres:5},100));
});
test('inventory nest actions work without GPS',()=>{
 for(const kind of ['craft-nest','use-nest'])assert.doesNotThrow(()=>verify(state,{kind},saved,undefined,100));
});
test('unknown pins, missing targets, invalid GPS and invalid radius fail closed',()=>{
 assert.throws(()=>verify(state,{kind:'collect-egg',pinId:'stick'},saved,gps,100));
 assert.throws(()=>verify(state,{kind:'collect-stick',pinId:'stick'},{...saved,targets:{}},gps,100));
 for(const accuracyMetres of [-1,101,NaN])assert.throws(()=>verify(state,{kind:'talk'},saved,{...gps,accuracyMetres},100));
 assert.throws(()=>verify(state,{kind:'talk'},saved,undefined,100));
 assert.throws(()=>verify(state,{kind:'talk'},saved,gps,Infinity));
});
