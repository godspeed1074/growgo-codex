import fs from 'node:fs';
import { decodePng, encodePng } from '../../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';
const input='asset-factory-workspace/eucalyptus-hybrid-proof/v2-cluster-art/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png';
const output='asset-factory-workspace/eucalyptus-hybrid-proof/v4-worker-output/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_FINAL_CLEAN.png';
const image=decodePng(input),{w,h,rgba}=image,seen=new Uint8Array(w*h),keep=new Uint8Array(w*h);
// The eight card UV cells. Components below 5000px are confirmed crop debris only when
// disconnected inside their own cell; this preserves the main foliage/branch masses.
const cells=[[0,.53,.37,1],[.36,.55,.68,1],[.66,.5,1,1],[0,.33,.55,.6],[.57,.35,.82,.58],[.75,.32,1,.6],[0,0,.55,.38],[.5,0,.77,.35]];
const report=[];
for(const [u0,v0,u1,v1] of cells){const x0=Math.floor(u0*w),x1=Math.ceil(u1*w),y0=Math.floor(v0*h),y1=Math.ceil(v1*h);let removed=0,retained=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const start=y*w+x;if(seen[start]||rgba[start*4+3]<32)continue;const q=[start],part=[];seen[start]=1;
  while(q.length){const i=q.pop();part.push(i);const px=i%w,py=(i-px)/w;for(const[nx,ny]of[[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){if(nx<x0||nx>=x1||ny<y0||ny>=y1)continue;const n=ny*w+nx;if(!seen[n]&&rgba[n*4+3]>=32){seen[n]=1;q.push(n)}}}
  if(part.length>=5000){for(const i of part)keep[i]=1;retained+=part.length}else removed+=part.length;
 } report.push({cell:[u0,v0,u1,v1],removedPixels:removed,retainedPixels:retained});}
for(let i=0;i<w*h;i++)if(!keep[i])rgba[i*4+3]=0;
fs.writeFileSync(output,encodePng(w,h,rgba));fs.writeFileSync('asset-factory-workspace/eucalyptus-hybrid-proof/v4-worker-output/EUCALYPTUS_FINAL_ALPHA_AUDIT.json',JSON.stringify({source:input,output,rule:'per-atlas-cell disconnected component <5000 alpha>=32 pixels removed',cells:report},null,2));console.log(JSON.stringify(report));
