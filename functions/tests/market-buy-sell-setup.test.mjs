import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './market-release-harness.mjs';

test('selling retains inventory checks and replay protection while setup stays warm',async t=>{
 const h=harness(t);h.rows.set('playerMarketInventories/market-test',{items:{wheat:6}});
 const request={requestId:'selling-setup-001',itemId:'wheat',quantity:2,price:20};
 await h.create(request);
 const reads=h.reads.filter(p=>p===h.marker).length;
 assert.equal(h.rows.get('playerMarketInventories/market-test').items.wheat,4);
 await h.create(request);
 assert.equal(h.rows.get('playerMarketInventories/market-test').items.wheat,4);
 await assert.rejects(h.create({...request,requestId:'selling-setup-002',quantity:5}),{code:'failed-precondition'});
 await assert.rejects(h.create({...request,price:21}),{code:'already-exists'});
 assert.equal(h.reads.filter(p=>p===h.marker).length,reads);
 assert.equal(h.checks(),4);
});
test('selling reads current price limits on every new transaction',async t=>{
 const h=harness(t);h.rows.set('playerMarketInventories/market-test',{items:{wheat:6}});
 await h.create({requestId:'selling-price-001',itemId:'wheat',quantity:1,price:20});
 h.rows.set('marketplacePriceStats/wheat',{referencePrice:1000});
 await assert.rejects(h.create({requestId:'selling-price-002',itemId:'wheat',quantity:1,price:20}),{code:'failed-precondition'});
 assert.equal(h.rows.get('playerMarketInventories/market-test').items.wheat,5);
});
test('buying awards once and checks current stock and coins while setup stays warm',async t=>{
 const h=harness(t);const request={requestId:'buying-setup-001',itemId:'wheat',quantity:2,price:20};
 await h.purchase(request);await h.purchase(request);
 assert.equal(h.rows.get('players/market-test').coins,960);
 assert.equal(h.rows.get('playerMarketInventories/market-test').items.wheat,2);
 assert.equal(h.rows.get(h.listing).quantity,5);
 h.rows.get('players/market-test').coins=0;
 await assert.rejects(h.purchase({...request,requestId:'buying-setup-002'}),{code:'failed-precondition'});
 h.rows.get('players/market-test').coins=960;h.rows.get(h.listing).quantity=0;
 await assert.rejects(h.purchase({...request,requestId:'buying-setup-003'}),{code:'failed-precondition'});
 assert.equal(h.rows.get('playerMarketInventories/market-test').items.wheat,2);
 assert.equal(h.reads.filter(p=>p===h.marker).length,1);
 assert.equal(h.checks(),4);
});
test('failed initial setup is retried without partial seed writes',async t=>{
 const h=harness(t,{seeded:false,restocked:false});h.fail(true);
 await assert.rejects(h.snapshot(),/commit failure/);assert.equal(h.rows.has(h.marker),false);
 h.fail(false);await h.snapshot();assert.equal(h.rows.has(h.marker),true);
 const quantity=h.rows.get(h.listing).quantity;
 // Different production generations have different seed migrations. This
 // test asserts the shared guarantee: failed setup leaves no partial writes.
 assert.ok(quantity>0);
});
