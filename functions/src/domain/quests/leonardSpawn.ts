// North-up map: right is east. Save this once; never move him with the player.
export function leonardSpawn(origin:{latitude:number;longitude:number}) {
 if(!Number.isFinite(origin.latitude)||Math.abs(origin.latitude)>90||!Number.isFinite(origin.longitude)||Math.abs(origin.longitude)>180)throw Error('Invalid quest origin');
 const lat=origin.latitude*Math.PI/180,lon=origin.longitude*Math.PI/180,d=30/6371000;
 const nextLat=Math.asin(Math.sin(lat)*Math.cos(d));
 const nextLon=lon+Math.atan2(Math.sin(d)*Math.cos(lat),Math.cos(d)-Math.sin(lat)*Math.sin(nextLat));
 return {latitude:nextLat*180/Math.PI,longitude:((nextLon*180/Math.PI+540)%360)-180};
}
