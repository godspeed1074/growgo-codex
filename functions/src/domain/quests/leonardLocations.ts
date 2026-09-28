import { calculateHaversineDistanceMetres as distance } from '../pins/canonicalPinGenerator';

export interface LeonardPlace { id: string; latitude: number; longitude: number; safe: boolean }
export interface LeonardTarget extends LeonardPlace { previouslyCapturedByPlayer: boolean }
export interface LeonardLandmark extends LeonardPlace { basePins: LeonardTarget[] }
// Input MUST come from a canonical server resolver, never from client claims.
// basePins are the resolver's nearby, accessible base pins for that landmark.
// This pure planner does not query OSM, generate pins, or alter normal captures.
export function selectLeonardLocations(origin: {latitude:number;longitude:number},
  snapshot: {churches:LeonardLandmark[];parks:LeonardLandmark[];shops:LeonardPlace[]}) {
  const valid = (p: {latitude:number;longitude:number}) => Number.isFinite(p.latitude)
    && Number.isFinite(p.longitude) && Math.abs(p.latitude)<=90 && Math.abs(p.longitude)<=180;
  if(!valid(origin)) throw Error('Valid player location required');
  const eligible=(p:LeonardPlace)=>valid(p)&&!!p.id&&p.safe===true&&distance(origin,p)<=7000;
  const ordered=<T extends LeonardPlace>(items:T[],from=origin)=>[...items].sort((a,b)=>distance(from,a)-distance(from,b)||a.id.localeCompare(b.id));
  // Reject ambiguous identities instead of silently choosing conflicting positions.
  const seen=new Map<string,string>();
  for(const p of [...snapshot.churches,...snapshot.parks,...snapshot.shops,
    ...snapshot.churches.flatMap(p=>p.basePins),...snapshot.parks.flatMap(p=>p.basePins)]) {
    const signature=JSON.stringify([p.latitude,p.longitude,p.safe,
      'previouslyCapturedByPlayer' in p ? p.previouslyCapturedByPlayer : null]);
    if(seen.has(p.id)&&seen.get(p.id)!==signature)throw Error('Conflicting map evidence');
    seen.set(p.id,signature);
  }
  function choose(items:LeonardLandmark[],requireCapture:boolean) {
    for(const place of ordered(items.filter(eligible))) {
      const unique=new Map(place.basePins.filter(p=>eligible(p)&&(!requireCapture||p.previouslyCapturedByPlayer===true)).map(p=>[p.id,p]));
      const targets=ordered([...unique.values()],place).slice(0,6);
      if(targets.length===6)return {place,targets};
    }
    return null;
  }
  const church=choose(snapshot.churches,false),park=choose(snapshot.parks,true);
  const shop=ordered(snapshot.shops.filter(eligible))[0]??null;
  if(!church||!park||!shop)return {ready:false as const,missing:[
    ...(!church?['church with six eligible base pins']:[]),
    ...(!park?['park with six previously captured base pins']:[]),...(!shop?['shop']:[])]};
  return {ready:true as const,church:church.place.id,eggPins:church.targets.map(p=>p.id),
    park:park.place.id,stickPins:park.targets.map(p=>p.id),shop:shop.id};
}
