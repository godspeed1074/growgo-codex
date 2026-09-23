import {calculateHaversineDistanceMetres as distance} from '../pins/canonicalPinGenerator';
import type {LeonardLandmark,LeonardPlace,LeonardTarget} from './leonardLocations';

type Origin={latitude:number;longitude:number};
export const LEONARD_DISCOVERY_LIMIT=500;
export const LEONARD_DISCOVERY_RADII=Object.freeze([1500,4000,8000]);
const valid=(p:Origin)=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180;
// Query only once at explicit quest start, never on map movement or status reads.
export function buildLeonardLandmarkQuery(origin:Origin,radius=7000){
 if(!valid(origin))throw Error('Valid quest location required');
 if(!Number.isInteger(radius)||radius<750||radius>8000)throw Error('Invalid discovery radius');
 const area=`(around:${radius},${origin.latitude},${origin.longitude})`;
 return `[out:json][timeout:18];(nwr["amenity"="place_of_worship"]["religion"="christian"]${area};nwr["leisure"="park"]${area};nwr["landuse"="forest"]${area};nwr["natural"="wood"]${area};nwr["shop"~"^(supermarket|grocery|convenience)$"]${area};);out tags center ${LEONARD_DISCOVERY_LIMIT+1};`;
}
export function extractLeonardLandmarks(payload:unknown,origin:Origin){
 if(!valid(origin))throw Error('Valid quest location required');
 const root=payload as {elements?:unknown;remark?:unknown};
 if(!root||root.remark||!Array.isArray(root.elements)||root.elements.length>LEONARD_DISCOVERY_LIMIT)
  throw Error('Quest location lookup incomplete; no quest started');
 const groups:{churches:LeonardPlace[];parks:LeonardPlace[];shops:LeonardPlace[]}={churches:[],parks:[],shops:[]};
 const seen=new Map<string,string>();
 for(const row of root.elements){
  if(!row||typeof row!=='object')continue;
  const e=row as Record<string,any>,t=e.tags;
  if(!t||typeof t!=='object'||!['node','way','relation'].includes(e.type)||!/^[1-9]\d{0,18}$/.test(String(e.id)))continue;
  // Quest landmark selection only: a generic label is not a useful park name.
  // OSM name is accepted when official_name is absent; it is not proof of legal status.
  if(t.leisure==='park'){
   const names=[t.official_name,t.name].filter((name):name is string=>typeof name==='string');
   if(!names.some(name=>{const normalized=name.normalize('NFKC').trim().toLowerCase();return normalized.length>0&&normalized!=='park';}))continue;
  }
  if(['private','no','customers_only'].includes(t.access)||['private','no'].includes(t.foot)
   ||t.disused==='yes'||t.abandoned==='yes'||t.construction||Object.keys(t).some(k=>/^(disused|abandoned|construction):/.test(k)))continue;
  const p={id:`poi:osm:${e.type}:${e.id}`,latitude:e.lat??e.center?.lat,longitude:e.lon??e.center?.lon,safe:true};
  if(!valid(p)||distance(origin,p)>7000)continue;
  const signature=JSON.stringify([p.latitude,p.longitude,t]);
  if(seen.has(p.id)){if(seen.get(p.id)!==signature)throw Error('Conflicting quest landmarks');continue;}
  seen.set(p.id,signature);
  if(t.amenity==='place_of_worship'&&t.religion==='christian')groups.churches.push(p);
  else if(t.leisure==='park'||t.landuse==='forest'||t.natural==='wood')groups.parks.push(p);
  else if(['supermarket','grocery','convenience'].includes(t.shop))groups.shops.push(p);
 }
 for(const group of Object.values(groups))group.sort((a,b)=>distance(origin,a)-distance(origin,b)||a.id.localeCompare(b.id));
 return groups;
}
// Caller supplies only server-verified canonical base pins and server capture
// receipts. These are not accepted in callable input. No normal pins are written.
export function assembleLeonardEvidence(origin:Origin,landmarks:ReturnType<typeof extractLeonardLandmarks>,pins:LeonardTarget[]){
 const unique=new Map<string,LeonardTarget>();
 for(const p of pins){
  if(!p.id||!valid(p)||!p.safe||distance(origin,p)>7000)continue;
  const old=unique.get(p.id);
  if(old&&JSON.stringify(old)!==JSON.stringify(p))throw Error('Conflicting canonical quest targets');
  unique.set(p.id,p);
 }
 // Keep resources close to their landmark, rather than spreading them over 7 km.
 const attach=(places:LeonardPlace[]):LeonardLandmark[]=>places.map(place=>({...place,
  basePins:[...unique.values()].filter(p=>distance(place,p)<=300)
   .sort((a,b)=>distance(place,a)-distance(place,b)||a.id.localeCompare(b.id))}));
 return {churches:attach(landmarks.churches),parks:attach(landmarks.parks),shops:landmarks.shops};
}
