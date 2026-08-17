import fs from 'node:fs';
import {decodePng,encodePng} from '../golden-reference/golden-reference-raster-analysis.mjs';
const [refPath,hybridPath,out]=process.argv.slice(2),r=decodePng(refPath),h=decodePng(hybridPath),ref=Buffer.alloc(h.w*h.h*4),overlay=Buffer.alloc(ref.length),diff=Buffer.alloc(ref.length);
for(let y=0;y<h.h;y++)for(let x=0;x<h.w;x++){const sx=Math.min(r.w-1,Math.floor(x*r.w/h.w)),sy=Math.min(r.h-1,Math.floor(y*r.h/h.h)),s=(sy*r.w+sx)*4,d=(y*h.w+x)*4;for(let c=0;c<3;c++){ref[d+c]=r.rgba[s+c];overlay[d+c]=(r.rgba[s+c]+h.rgba[d+c])>>1;diff[d+c]=Math.abs(r.rgba[s+c]-h.rgba[d+c]);}ref[d+3]=overlay[d+3]=diff[d+3]=255;}
fs.writeFileSync(out+'/DOOR_REFERENCE_SCALED.png',encodePng(h.w,h.h,ref));fs.writeFileSync(out+'/SHOP_DOOR_HYBRID_OVERLAY_50.png',encodePng(h.w,h.h,overlay));fs.writeFileSync(out+'/SHOP_DOOR_HYBRID_DIFFERENCE.png',encodePng(h.w,h.h,diff));
