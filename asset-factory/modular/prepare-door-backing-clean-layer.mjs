import fs from 'node:fs';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const source = '/tmp/door.png';
const out = 'test-output/door-root-correction/DOOR_REPAIRED_FIDELITY_FRONT_TRANSPARENT.png';
const im = decodePng(source); const rgba = Buffer.from(im.rgba); const seen = new Uint8Array(im.w * im.h); const queue = [];
const isBacking = (x, y) => { const i=(y*im.w+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2]; return Math.max(r,g,b)-Math.min(r,g,b)<16 && r>=28 && r<=125; };
for (let x=0;x<im.w;x++){queue.push([x,0]);queue.push([x,im.h-1]);} for(let y=0;y<im.h;y++){queue.push([0,y]);queue.push([im.w-1,y]);}
while(queue.length){const [x,y]=queue.pop();if(x<0||y<0||x>=im.w||y>=im.h)continue;const k=y*im.w+x;if(seen[k]||!isBacking(x,y))continue;seen[k]=1;rgba[k*4+3]=0;queue.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
fs.writeFileSync(out, encodePng(im.w, im.h, rgba));
