import {createHash} from 'node:crypto';
import type {Firestore} from 'firebase-admin/firestore';
import {buildLeonardLandmarkQuery,extractLeonardLandmarks,assembleLeonardEvidence,LEONARD_DISCOVERY_RADII} from './leonardDiscovery';
import {generateCanonicalPinsForWay,calculateHaversineDistanceMetres as distance} from '../pins/canonicalPinGenerator';
import {selectLeonardLocations,type LeonardTarget} from './leonardLocations';
import {isAlbertParkGrandPrixCircuitSpecialPin} from '../routes/albertParkGrandPrixCircuit';
import {isGreatOceanRoadSpecialPin} from '../routes/greatOceanRoad';
type Origin={latitude:number;longitude:number};
type Transport=(query:string,signal:AbortSignal)=>Promise<unknown>;
const MAX_WAYS=500,MAX_TARGETS=600,VERIFY_BATCH=24,MAX_CANDIDATES=20000;
// Explicit quest-start only. Bounded nearest-first batches outside transactions;
// no map-generation writes, reward writes, or client-supplied location evidence.
export function leonardArea(origin:Origin){
 if(!Number.isFinite(origin.latitude)||!Number.isFinite(origin.longitude)||Math.abs(origin.latitude)>90||Math.abs(origin.longitude)>180)throw Error('Invalid location');
 const latitude=Math.round(origin.latitude*100)/100,longitude=Math.round(origin.longitude*100)/100;
 return {id:`v2_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,center:{latitude,longitude}};
}
export async function acquireLeonardAutomaticLocations(db:Firestore,uid:string,origin:Origin,transport:Transport,prepareOnly=false){
 const signal=AbortSignal.timeout(45000);
 // Shared ~1 km cells; the extra kilometre covers the cell's corner. Actual
 // targets/landmarks still obey the player's original 7 km radius.
 const sourceOrigin=leonardArea(origin).center;
 // Start with the nearest area. A single eight-kilometre OSM search can have
 // more than the safe landmark limit in a city, even though the player only
 // needs one church, park and shop. Expand only when an inner circle genuinely
 // lacks one of those categories.
 let landmarks:ReturnType<typeof extractLeonardLandmarks>|null=null;
 for(const radius of LEONARD_DISCOVERY_RADII){
  const candidate=extractLeonardLandmarks(await transport(buildLeonardLandmarkQuery(sourceOrigin,radius),signal),origin);
  landmarks=candidate;
  if(candidate.churches.length&&candidate.parks.length&&candidate.shops.length)break;
 }
 if(!landmarks)throw Error('Quest location lookup incomplete; no quest started');
 if(!landmarks.churches.length||!landmarks.parks.length||!landmarks.shops.length)throw Error('No suitable church, park or store within 7 km. Try starting elsewhere.');
 let evidence=assembleLeonardEvidence(origin,landmarks,[]);
 // Search nearest landmarks first without rejecting a town merely for having
 // many parks. A shared deadline and target/read limits cap external load per start.
 const verified=new Map<string,LeonardTarget>();
 const checked=new Set<string>();
 const resolvedTypes=new Set<string>();
 const allPlaces=[...landmarks.churches,...landmarks.parks];
 for(let offset=0;offset<Math.max(landmarks.churches.length,landmarks.parks.length)&&offset<48;offset+=3){
 const places=[...landmarks.churches.slice(offset,offset+3),...landmarks.parks.slice(offset,offset+3)];
 const around=[...places].sort((a,b)=>a.id.localeCompare(b.id)).map(p=>`way["highway"~"^(residential|living_street|pedestrian|footway|path|service)$"]["access"!~"^(private|no)$"]["foot"!~"^(private|no)$"](around:300,${p.latitude},${p.longitude});`).join('');
 const payload=await transport(`[out:json][timeout:18];(${around});out geom ${MAX_WAYS+1};`,signal) as {elements?:any[];remark?:unknown};
 signal.throwIfAborted();
 if(!payload||payload.remark||!Array.isArray(payload.elements)||payload.elements.length>MAX_WAYS)throw Error('Nearby paths could not be fully verified. No quest started.');
 const targets=new Map<string,LeonardTarget>();
 let vertices=0;
 for(const way of payload.elements){
  if(way?.type!=='way'||!/^[1-9]\d{0,18}$/.test(String(way.id)))continue;
  const tags=way.tags??{};
  if(!['residential','living_street','pedestrian','footway','path','service'].includes(tags.highway)
    ||['no','private','customers','customers_only'].includes(tags.access)||['no','private'].includes(tags.foot)||tags.construction||tags.disused==='yes'
    ||Object.keys(tags).some(k=>/^(disused|abandoned|construction):/.test(k)))continue;
  if(!Array.isArray(way.geometry)||way.geometry.length<2)throw Error('Incomplete path geometry');
  vertices+=way.geometry.length;if(vertices>20000)throw Error('Path lookup exceeds safe size');
  const coordinates=way.geometry.map((p:any)=>({latitude:p?.lat,longitude:p?.lon}));
  // Reject unusually long geometry before generating, bounding CPU as well as IO.
  let length=0;for(let i=1;i<coordinates.length;i++)length+=distance(coordinates[i-1],coordinates[i]);
  if(!Number.isFinite(length)||length>100000)throw Error('Invalid quest path');
  const pins=generateCanonicalPinsForWay({generatorVersion:1,sourceType:'osm-way',sourceId:String(way.id),spacingMetres:50,orderedCoordinates:coordinates});
  for(const pin of pins)if(distance(origin,pin)<=7000&&places.some(p=>distance(p,pin)<=300)){
   if(isAlbertParkGrandPrixCircuitSpecialPin(pin.pinId)||isGreatOceanRoadSpecialPin(pin.pinId))continue;
   const candidate={id:pin.pinId,latitude:pin.latitude,longitude:pin.longitude,safe:true,previouslyCapturedByPlayer:false};
   const prior=verified.get(candidate.id);
   if(prior&&(prior.latitude!==candidate.latitude||prior.longitude!==candidate.longitude))throw Error('Conflicting path geometry');
   const old=targets.get(candidate.id);if(old&&JSON.stringify(old)!==JSON.stringify(candidate))throw Error('Conflicting path geometry');
   targets.set(candidate.id,candidate);
   if(targets.size>MAX_CANDIDATES)throw Error('Path geometry exceeds the candidate safety limit.');
  }
 }
 // Candidate geometry is not a database read. Verify nearest pins per landmark
 // in small batches, counting rejected/water pins against the same 600-pin cap.
 for(const place of places){
 const type=landmarks.parks.some(p=>p.id===place.id)?'park':'church';
 if(resolvedTypes.has(type))continue;
 const needsCapture=!prepareOnly&&type==='park';
 const enough=()=>[...verified.values()].filter(p=>distance(place,p)<=300&&(!needsCapture||p.previouslyCapturedByPlayer)).length>=6;
 const candidates=[...targets.values()].filter(p=>distance(place,p)<=300)
  .sort((a,b)=>distance(place,a)-distance(place,b)||a.id.localeCompare(b.id));
 while(!enough()){
  const remaining=candidates.filter(p=>!checked.has(p.id));if(!remaining.length)break;
  if(checked.size>=MAX_TARGETS)throw Error('Quest search reached its verification budget. Try starting closer to a park where you have captured pins.');
  let pins=remaining.slice(0,Math.min(VERIFY_BATCH,MAX_TARGETS-checked.size));
  pins.forEach(p=>checked.add(p.id));signal.throwIfAborted();
 if(pins.length){
  // Classification reads only. Never turn a known fishing pin into a quest target.
  const water=await db.getAll(...pins.map(p=>db.collection('authoritativeWaterPinStates').doc(p.id)));
  pins=pins.filter((p,i)=>{const data=water[i].data();return !(data?.pinId===p.id&&data?.type==='water');});
 }
 if(pins.length&&!prepareOnly){
  // Read per-player receipts, never another player's captures. Batched and bounded.
  const receipts=await db.getAll(...pins.map(p=>db.collection('playerCaptureStates').doc(uid).collection('pins').doc(createHash('sha256').update(p.id).digest('hex'))));
  receipts.forEach((receipt,i)=>{const data=receipt.data();pins[i].previouslyCapturedByPlayer=data?.pinId===pins[i].id&&Boolean(data?.capturedAt);});
 }
 for(const pin of pins)verified.set(pin.id,pin);
 }
 if(enough())resolvedTypes.add(type);
 }
 evidence=assembleLeonardEvidence(origin,{...landmarks,churches:landmarks.churches.slice(0,offset+3),parks:landmarks.parks.slice(0,offset+3)},[...verified.values()]);
 if(prepareOnly)return evidence;
 if(selectLeonardLocations(origin,evidence).ready)return evidence;
 }
 if(allPlaces.length&&Math.max(landmarks.churches.length,landmarks.parks.length)>48)throw Error('No suitable quest route found in the nearest locations. Try starting closer to a park where you have captured pins.');
 return evidence;
}
