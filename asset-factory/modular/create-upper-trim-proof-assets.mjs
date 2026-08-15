import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.join(root,'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png');
const out=path.join(root,'test-output/upper-trim-proof');fs.mkdirSync(out,{recursive:true});
const im=decodePng(source);
const defs={LEFT:{box:[38,140,115,225],art:[52,164,91,210]},RIGHT:{box:[575,140,660,225],art:[607,164,645,220]}};
const crops={};
for(const [side,d] of Object.entries(defs)){
 const [x0,y0,x1,y1]=d.box,w=x1-x0,h=y1-y0;const crop=Buffer.alloc(w*h*4,0),mask=Buffer.alloc(w*h*4,0);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=x0+x,sy=y0+y,s=(sy*im.w+sx)*4,p=(y*w+x)*4;crop[p]=im.rgba[s];crop[p+1]=im.rgba[s+1];crop[p+2]=im.rgba[s+2];crop[p+3]=255;const rr=im.rgba[s],gg=im.rgba[s+1],bb=im.rgba[s+2];const inside=sx>=d.art[0]&&sx<d.art[2]&&sy>=d.art[1]&&sy<d.art[3]&&rr>120&&gg>90&&gg>bb*1.08&&rr>gg*1.08;if(inside){mask[p]=mask[p+1]=mask[p+2]=255;mask[p+3]=255;}}
 const cropName=`UPPER_TRIM_${side}_REFERENCE.png`,maskName=`UPPER_TRIM_${side}_SCOPE_MASK.png`;
 fs.writeFileSync(path.join(out,cropName),encodePng(w,h,crop));fs.writeFileSync(path.join(out,maskName),encodePng(w,h,mask));const art=Buffer.alloc(w*h*4,0),ctx=Buffer.from(crop);for(let i=0;i<art.length;i+=4){if(mask[i+3]){art[i]=crop[i];art[i+1]=crop[i+1];art[i+2]=crop[i+2];art[i+3]=255;}else ctx[i+3]=255;}fs.writeFileSync(path.join(out,`UPPER_TRIM_${side}_ART.png`),encodePng(w,h,art));fs.writeFileSync(path.join(out,`UPPER_TRIM_${side}_CONTEXT.png`),encodePng(w,h,ctx));const stack=Buffer.from(ctx);for(let i=0;i<stack.length;i+=4)if(art[i+3]){stack[i]=art[i];stack[i+1]=art[i+1];stack[i+2]=art[i+2];stack[i+3]=255;}fs.writeFileSync(path.join(out,`UPPER_TRIM_${side}_REASSEMBLED.png`),encodePng(w,h,stack));
 crops[side]={crop:cropName,mask:maskName,sourceBox:d.box,artBox:d.art,visibleArtBounds:{x:d.art[0]-x0,y:d.art[1]-y0,width:d.art[2]-d.art[0],height:d.art[3]-d.art[1]},sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')};
}
fs.writeFileSync(path.join(root,'asset-factory/modular/SHOP_UPPER_TRIM_VISION_ANALYSIS.json'),JSON.stringify({reference:source,dimensions:[im.w,im.h],leftRightIdentical:true,mirrorable:true,visibleSilhouette:'cream rectangular corner return with shallow lower shadow and fascia/post contact',colour:'warm cream/tan',depth:'shallow papercut projection',relationship:{post:'flush contact',fascia:'under-fascia termination',awning:'outer mounting boundary'},crops},null,2));
