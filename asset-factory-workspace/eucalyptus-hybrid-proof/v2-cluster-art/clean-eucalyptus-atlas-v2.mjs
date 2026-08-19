import fs from 'node:fs';
import { decodePng, encodePng } from '../../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('usage: node clean-eucalyptus-atlas-v2.mjs input.png output.png');
const { w, h, rgba } = decodePng(input);
const seen = new Uint8Array(w * h), keep = new Uint8Array(w * h);
const idx = (x, y) => y * w + x;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const start = idx(x,y); if (seen[start] || rgba[start*4+3] < 32) continue;
  const queue=[start]; seen[start]=1; const component=[];
  while (queue.length) {
    const i=queue.pop(); component.push(i); const px=i%w, py=(i-px)/w;
    for (const [nx,ny] of [[px-1,py],[px+1,py],[px,py-1],[px,py+1]]) {
      if(nx<0||ny<0||nx>=w||ny>=h) continue; const n=idx(nx,ny);
      if(!seen[n]&&rgba[n*4+3]>=32){seen[n]=1;queue.push(n);}
    }
  }
  // Keeps authored leaf/branch forms while dropping isolated model-generated green flecks.
  if (component.length >= 120) for (const i of component) keep[i]=1;
}
for (let i=0;i<keep.length;i++) if(!keep[i]) rgba[i*4+3]=0;
fs.writeFileSync(output, encodePng(w,h,rgba));
console.log(JSON.stringify({ input, output, width:w, height:h, alphaComponentsRetained:[...keep].reduce((a,x)=>a+x,0) },null,2));
