import {createHash} from 'node:crypto';
import type {Firestore} from 'firebase-admin/firestore';
import {createNearbyMapProvider} from '../../infrastructure/pins/nearbyMapProvider';

const PUBLIC_FALLBACK_ENDPOINT='https://overpass.private.coffee/api/interpreter';
// Probe confirmed on 22 September 2026. Keep this first so an old optional
// configured mirror cannot make a player-facing quest wait for its timeout.
const PREFERRED_ENDPOINT='https://overpass-api.de/api/interpreter';
const LEGACY_ENDPOINTS=['https://overpass.kumi.systems/api/interpreter'];
const LEONARD_PROVIDER_USER_AGENT='GrowGoQuest/1.0 (+https://growgo-account-profile.vercel.app/)';
// Landmark discovery is substantially larger than normal pin geometry. Give
// the verified provider enough time to complete one real quest lookup while
// preserving room below the callable's 60-second ceiling.
export const LEONARD_REQUEST_TIMEOUT_MS=40_000;
const LEONARD_PROVIDER_ATTEMPT_MS=18_000;
export const LEONARD_SOURCE_MAX_AGE_MS=86400000;
const LEONARD_LOOKUP_JOIN_WINDOW_MS=22_000;
const LEONARD_LOOKUP_JOIN_POLL_MS=400;
export function freshLeonardSource(payload:any,now:number){
 const timestamp=payload?.osm3s?.timestamp_osm_base;
 const at=typeof timestamp==='string'?Date.parse(timestamp):NaN;
 return Number.isFinite(at)&&at<=now+300000&&now-at<LEONARD_SOURCE_MAX_AGE_MS;
}
export function retryDelay(value:string|null,now=Date.now()){
 const seconds=value&&/^\d+$/.test(value)?Number(value):value?(Date.parse(value)-now)/1000:60;
 return Math.max(60,Math.min(3600,Number.isFinite(seconds)?seconds:60))*1000;
}
// Shared, bounded cache; never caches player receipts. Lease stops concurrent
// duplicate requests across instances. No immediate retries after throttling.
export function createLeonardLookupTransport(db:Firestore,http:typeof fetch=fetch,clock=Date.now,
 options:{cacheFailures?:boolean;endpoints?:readonly string[];joinWindowMs?:number;joinPollMs?:number;sleep?:(ms:number)=>Promise<void>}={}){
 const endpoints=options.endpoints??readLeonardMapEndpoints();
 const request=createNearbyMapProvider(clock);
 const joinWindowMs=options.joinWindowMs??LEONARD_LOOKUP_JOIN_WINDOW_MS;
 const joinPollMs=options.joinPollMs??LEONARD_LOOKUP_JOIN_POLL_MS;
 const sleep=options.sleep??(ms=>new Promise<void>(resolve=>setTimeout(resolve,ms)));
 return async(query:string,signal:AbortSignal)=>{
   signal.throwIfAborted();
   const ref=db.collection('leonardLookupCache').doc(createHash('sha256').update(query).digest('hex'));
  type Claim={kind:'cached';payload:any}|{kind:'owner'}|{kind:'busy'};
  const claim=async():Promise<Claim>=>db.runTransaction(async tx=>{
   const data=(await tx.get(ref)).data(),now=clock();
   if(data&&data.expiresAt>now&&freshLeonardSource(data.payload,now))return {kind:'cached',payload:data.payload};
   if(data?.retryAt>now)return {kind:'busy'};
   tx.set(ref,{retryAt:now+60000},{merge:true});return {kind:'owner'};
  });
  let ownership=await claim();
  if(ownership.kind==='cached')return ownership.payload;
  if(ownership.kind==='busy'){
   // A quiet pre-warm and an explicit player start often ask for the same
   // OSM query. Join that one short request instead of falsely rejecting the
   // player as "busy". If it fails, its retry marker clears and this request
   // can safely become the one owner.
   const deadline=clock()+joinWindowMs;
   while(clock()<deadline){
    signal.throwIfAborted();
    await sleep(Math.min(joinPollMs,Math.max(1,deadline-clock())));
    signal.throwIfAborted();
    const data=(await ref.get()).data(),now=clock();
    if(data&&data.expiresAt>now&&freshLeonardSource(data.payload,now))return data.payload;
    if(!data?.retryAt||data.retryAt<=now)break;
   }
   ownership=await claim();
   if(ownership.kind==='cached')return ownership.payload;
   if(ownership.kind==='busy')throw Error('Map lookup is still preparing. Please try again in a moment. Your quest has not changed.');
  }
  try{
   const payload=await request({
    endpoints,body:query,userAgent:LEONARD_PROVIDER_USER_AGENT,fetch:http,
    totalMs:LEONARD_REQUEST_TIMEOUT_MS,attemptMs:LEONARD_PROVIDER_ATTEMPT_MS,backupDelayMs:1_500,signal,
    normalize:(value:unknown)=>{
     if(!value||typeof value!=='object'||(value as any).remark||!Array.isArray((value as any).elements))throw Error('Map lookup incomplete');
     if(!freshLeonardSource(value,clock()))throw Error('Map source is outdated or missing its timestamp.');
     return value;
    }
   });
   signal.throwIfAborted();
   const expiresAt=Math.min(clock()+LEONARD_SOURCE_MAX_AGE_MS,Date.parse((payload as any).osm3s.timestamp_osm_base)+LEONARD_SOURCE_MAX_AGE_MS);
   await ref.set({payload,expiresAt,retryAt:0});return payload;
  }catch(e){
   // A failed background warm-up must not put a real player into a cooldown
   // before they have even started the quest.
   await ref.set({retryAt:options.cacheFailures===false?0:clock()+60000},{merge:true});
   if(e instanceof Error&&e.message.includes('Map source is outdated'))throw e;
   throw Error('Map service is unavailable. Please try again later. Your quest has not changed.');
  }
 };
}
function readLeonardMapEndpoints(): string[] {
 const configured=[
  process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_ENDPOINT,
  process.env.GROWGO_PRIVATE_ALPHA_OVERPASS_FALLBACK_ENDPOINT
 ];
 const endpoints=new Set<string>();
 for(const value of configured){
  const candidate=value?.trim();if(!candidate)continue;
  try{const parsed=new URL(candidate);if(parsed.protocol==='https:')endpoints.add(parsed.toString());}catch{/* Ignore an invalid optional endpoint. */}
 }
 endpoints.add(PREFERRED_ENDPOINT);
 // Always prefer the verified endpoint. The configured mirrors remain real
 // fallbacks, rather than becoming a single point of failure for a quest.
 const configuredEndpoints=[...endpoints].filter(endpoint=>endpoint!==PREFERRED_ENDPOINT);
 const ordered=[PREFERRED_ENDPOINT,...configuredEndpoints];
 LEGACY_ENDPOINTS.forEach(endpoint=>{if(!ordered.includes(endpoint))ordered.push(endpoint);});
 if(!ordered.includes(PUBLIC_FALLBACK_ENDPOINT))ordered.push(PUBLIC_FALLBACK_ENDPOINT);
 // The provider runs at most two transports at once. Three choices allow a
 // quick hand-off if a configured mirror is down while keeping the request
 // bounded inside the callable's 60-second limit.
 return ordered.slice(0,3);
}
export async function reserveLeonardStart(db:Firestore,uid:string,now=Date.now()){
 const ref=db.collection('leonardStartLimits').doc(uid);
 await db.runTransaction(async tx=>{const data=(await tx.get(ref)).data();
  if(data?.retryAt>now)throw Error('Please wait a minute before searching again.');
  tx.set(ref,{retryAt:now+60000});});
}
