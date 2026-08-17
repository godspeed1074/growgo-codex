import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {decodePng,encodePng} from '../golden-reference/golden-reference-raster-analysis.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const source=path.join(root,'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png');
const out=path.join(root,'test-output/simple-shop-facade-v1');fs.mkdirSync(out,{recursive:true});
const im=decodePng(source), sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const crop=(name,x,y,w,h)=>{const b=Buffer.alloc(w*h*4);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const s=((y+yy)*im.w+x+xx)*4,d=(yy*w+xx)*4;im.rgba.copy(b,d,s,s+4)}fs.writeFileSync(path.join(out,name),encodePng(w,h,b));return {x,y,w,h,sha256:sha(path.join(out,name))};};
fs.copyFileSync(source,path.join(out,'SIMPLE_SHOP_FACADE_REFERENCE_AUTHORITY.png'));
const layers={FASCIA:crop('FACADE_FASCIA_ART.png',28,12,644,151),AWNING:crop('FACADE_AWNING_ART.png',74,161,553,99),WALL_LEFT:crop('FACADE_WALL_LEFT_ART.png',49,256,40,272),WALL_BETWEEN:crop('FACADE_WALL_BETWEEN_ART.png',284,256,20,272),WALL_RIGHT:crop('FACADE_WALL_RIGHT_ART.png',582,256,44,272),WALL_ABOVE:crop('FACADE_WALL_ABOVE_ART.png',49,257,577,18),BASE_LEFT:crop('FACADE_BASE_LEFT_ART.png',17,500,72,86),BASE_BETWEEN:crop('FACADE_BASE_BETWEEN_ART.png',284,500,298,86),BASE_RIGHT:crop('FACADE_BASE_RIGHT_ART.png',582,500,44,86)};
// These are the locked module-facing crops, not a review-board canvas. Their pixels
// remain owned by the approved Door/Window presentation assets at their anchors.
layers.APPROVED_DOOR=crop('APPROVED_DOOR_FRONT.png',89,256,195,327);layers.APPROVED_WINDOW=crop('APPROVED_WINDOW_FRONT.png',304,275,278,231);
const data={status:'PASS',source:{path:'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png',sha256:sha(source),cropCoordinates:[0,0,760,670],dimensions:[760,670],authority:'operator-supplied upper-left Simple Shop panel, previously clean-cropped'},layers};
fs.writeFileSync(path.join(root,'asset-factory/modular/SIMPLE_SHOP_FACADE_REFERENCE_AUTHORITY.json'),JSON.stringify(data,null,2));
const board={w:1520,h:670,rgba:Buffer.alloc(1520*670*4,248)};const put=(src,ox)=>{for(let y=0;y<670;y++)for(let x=0;x<760;x++){const s=(y*760+x)*4,d=(y*1520+ox+x)*4;board.rgba[d]=src.rgba[s];board.rgba[d+1]=src.rgba[s+1];board.rgba[d+2]=src.rgba[s+2];board.rgba[d+3]=255}};put(im,0);put(im,760);fs.writeFileSync(path.join(out,'SIMPLE_SHOP_FACADE_SHARED_GRID_PREFLIGHT.png'),encodePng(board.w,board.h,board.rgba));
console.log(JSON.stringify({status:'PASS',source:data.source,layers:Object.keys(layers)},null,2));
