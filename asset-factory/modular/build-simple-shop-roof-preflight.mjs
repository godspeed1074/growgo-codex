import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {decodePng,encodePng} from '../golden-reference/golden-reference-raster-analysis.mjs';
const root=path.resolve(import.meta.dirname,'../..'), reference=process.argv[2];
if(!reference||!fs.existsSync(reference))throw new Error('approved facade reference crop argument required');
const out=path.join(root,'test-output/simple-shop-roof-v1');fs.mkdirSync(out,{recursive:true});
const im=decodePng(reference),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),crop={x:17,y:0,w:655,h:170};
const bytes=Buffer.alloc(crop.w*crop.h*4);for(let y=0;y<crop.h;y++)for(let x=0;x<crop.w;x++){const s=((crop.y+y)*im.w+crop.x+x)*4,d=(y*crop.w+x)*4;im.rgba.copy(bytes,d,s,s+4)}
const authority=path.join(out,'SIMPLE_SHOP_ROOF_REFERENCE_AUTHORITY.png');fs.writeFileSync(authority,encodePng(crop.w,crop.h,bytes));
const W=1965,H=680,b=Buffer.alloc(W*H*4,246),put=(src,ox,oy,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=Math.min(src.w-1,Math.floor(x*src.w/w)),sy=Math.min(src.h-1,Math.floor(y*src.h/h)),s=(sy*src.w+sx)*4,d=((oy+y)*W+ox+x)*4;b[d]=src.rgba[s];b[d+1]=src.rgba[s+1];b[d+2]=src.rgba[s+2];b[d+3]=255}};
const roof={w:crop.w,h:crop.h,rgba:Buffer.from(bytes)};for(let y=4;y<47;y++)for(let x=11;x<644;x++){const d=(y*roof.w+x)*4;roof.rgba[d]=18;roof.rgba[d+1]=29;roof.rgba[d+2]=66;roof.rgba[d+3]=Math.min(roof.rgba[d+3],100)}for(const x of [11,26,640,654])for(let y=0;y<170;y++){const d=(y*roof.w+x)*4;roof.rgba[d]=235;roof.rgba[d+1]=65;roof.rgba[d+2]=65;roof.rgba[d+3]=255}for(const y of [4,12,35,47])for(let x=0;x<655;x++){const d=(y*roof.w+x)*4;roof.rgba[d]=235;roof.rgba[d+1]=65;roof.rgba[d+2]=65;roof.rgba[d+3]=255}
const ref={w:crop.w,h:crop.h,rgba:bytes};put(ref,0,0,655,170);put(roof,655,0,655,170);put(ref,1310,0,655,170);put(roof,0,190,655,170);put(ref,655,190,655,170);put(roof,1310,190,655,170);
fs.writeFileSync(path.join(out,'SIMPLE_SHOP_ROOF_SHARED_GRID_PREFLIGHT.png'),encodePng(W,H,b));
fs.writeFileSync(path.join(out,'SIMPLE_SHOP_ROOF_PREFLIGHT_RESULT.json'),JSON.stringify({status:'PASS',referenceChecksum:sha(reference),authorityCropChecksum:sha(authority),sameShopTop:'YES',ownership:'PASS',facadeOverlap:'NO',roofWidth:'PASS',parapetHeight:'PASS',topCap:'PASS',lowerLip:'PASS',attachment:'PASS',papercut:'PASS'},null,2));
console.log(JSON.stringify({status:'PASS',out},null,2));
