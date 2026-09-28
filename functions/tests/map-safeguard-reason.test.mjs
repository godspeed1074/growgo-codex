import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const m=require('../lib/config/developmentBackendOperationalSafeguards.js');
const env={GROWGO_BACKEND_ENVIRONMENT:'development',GROWGO_BACKEND_PROJECT_ID:'growgo-development',
 GROWGO_DEVELOPMENT_BACKEND_ENABLED:'true',GROWGO_DEVELOPMENT_AUTHORITATIVE_PIN_ACQUISITION_ENABLED:'true',
 GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'true',GROWGO_DEVELOPMENT_BACKEND_ROLLBACK_STATE:'development_enabled'};
test('map burst denial carries a server-only reason without changing callable details',()=>{
 const p={env,uid:'test-only',operation:'authoritative_pin_acquisition',now:new Date('2026-09-16T00:00:00Z'),limiter:m.createInMemoryDevelopmentBackendOperationalRateLimiter()};
 for(let i=0;i<30;i++)assert.equal(m.requireDevelopmentBackendOperationalSafeguardAccess(p).allowed,true);
 assert.throws(()=>m.requireDevelopmentBackendOperationalSafeguardAccess(p),e=>{
  assert.equal(m.getOperationalDenialReason(e),'rate_limit_exceeded');
  assert.equal(e.details,undefined);
  assert.equal(JSON.stringify(e.toJSON()).includes('rate_limit_exceeded'),false);
  return true;
 });
 p.now=new Date(+p.now+60_000);
 assert.equal(m.requireDevelopmentBackendOperationalSafeguardAccess(p).allowed,true);
});
test('other denials remain distinguishable and unrelated errors carry no reason',()=>{
 assert.throws(()=>m.requireDevelopmentBackendOperationalSafeguardAccess({env:{...env,GROWGO_DEVELOPMENT_OPERATIONAL_SAFEGUARDS_ENABLED:'false'},uid:'test',operation:'authoritative_pin_acquisition'}),e=>m.getOperationalDenialReason(e)==='operational_safeguards_disabled');
 assert.equal(m.getOperationalDenialReason(new Error('rate_limit_exceeded')),null);
 assert.equal(m.getOperationalDenialReason(null),null);
});
