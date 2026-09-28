import { calculateHaversineDistanceMetres as distance } from '../pins/canonicalPinGenerator';

type Origin = { latitude: number; longitude: number };
const valid = (p: Origin) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
  && Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180;
export const LEONARD_SHOP_LIMIT = 250;
export function buildLeonardShopQuery(origin: Origin) {
  if (!valid(origin)) throw Error('Valid quest location required');
  return `[out:json][timeout:18];nwr["shop"~"^(supermarket|grocery|convenience)$"](around:7000,${origin.latitude},${origin.longitude});out tags center ${LEONARD_SHOP_LIMIT + 1};`;
}

// Server-acquired OSM data only. This does not create normal capturable POIs.
// A map listing cannot prove physical accessibility; explicit restrictions fail
// closed, and the eventual quest UI must still allow relocating/restarting.
export function extractLeonardShops(payload: unknown, origin: Origin) {
  if (!valid(origin)) throw Error('Valid quest location required');
  const elements = (payload as {elements?:unknown})?.elements;
  if (!Array.isArray(elements)) throw Error('Shop lookup returned invalid data');
  if (elements.length > LEONARD_SHOP_LIMIT) throw Error('Shop lookup was truncated; cannot choose the nearest reliably');
  if ((payload as {remark?:unknown}).remark) throw Error('Shop lookup was incomplete');
  const shops = new Map<string, {id:string;latitude:number;longitude:number;safe:true;name:string}>();
  for (const row of elements) {
    if (!row || typeof row !== 'object') continue;
    const e = row as Record<string, any>, tags = e.tags;
    if (!tags || typeof tags !== 'object' || !['supermarket','grocery','convenience'].includes(tags.shop)) continue;
    if (['no','private','customers_only'].includes(tags.access) || tags.disused === 'yes' || tags.abandoned === 'yes'
      || tags['disused:shop'] || tags['abandoned:shop'] || tags.construction) continue;
    if (!['node','way','relation'].includes(e.type) || !/^[1-9]\d{0,18}$/.test(String(e.id))) continue;
    const position = {latitude: e.lat ?? e.center?.lat, longitude: e.lon ?? e.center?.lon};
    if (!valid(position) || distance(origin, position) > 7000) continue;
    const id = `poi:osm:${e.type}:${e.id}`;
    const previous = shops.get(id);
    if (previous && (previous.latitude !== position.latitude || previous.longitude !== position.longitude)) throw Error('Conflicting shop locations');
    shops.set(id, {...position,id,safe:true,name:typeof tags.name === 'string' ? tags.name.trim().slice(0,160) : 'Local store'});
  }
  return [...shops.values()].sort((a,b)=>distance(origin,a)-distance(origin,b)||a.id.localeCompare(b.id));
}

// Called once during quest setup, outside any retrying Firestore transaction.
// Supply the trusted configured transport, never a client-provided endpoint.
export async function acquireLeonardShops(origin: Origin,
  transport: (query:string,signal:AbortSignal)=>Promise<unknown>) {
  const signal=AbortSignal.timeout(20000);
  const response=await transport(buildLeonardShopQuery(origin),signal);
  signal.throwIfAborted();
  return extractLeonardShops(response,origin);
}
