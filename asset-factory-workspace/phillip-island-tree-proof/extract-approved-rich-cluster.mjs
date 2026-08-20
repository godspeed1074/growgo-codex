import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const repo = process.cwd();
const sourcePath = path.join(repo, 'asset-factory-workspace/eucalyptus-hybrid-proof/v2-cluster-art/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png');
const root = path.join(repo, 'asset-factory-workspace/phillip-island-tree-proof');
const outputPath = path.join(root, 'GROWGO_RICH_FOLIAGE_APPROVED_CLUSTER_RGBA.png');
fs.mkdirSync(path.join(root, 'rich-v4-output'), { recursive: true });
const { w, h, rgba } = decodePng(sourcePath), seen = new Uint8Array(w * h), threshold = 32, components = [];
for (let start = 0; start < w * h; start += 1) {
  if (seen[start] || rgba[start * 4 + 3] < threshold) continue;
  const pixels = [], stack = [start]; seen[start] = 1; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  while (stack.length) { const i = stack.pop(), x = i % w, y = (i - x) / w; pixels.push(i); x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x); y1=Math.max(y1,y);
    for(let dy=-1;dy<=1;dy+=1)for(let dx=-1;dx<=1;dx+=1){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[n]&&rgba[n*4+3]>=threshold){seen[n]=1;stack.push(n);}}
  }
  components.push({pixels,x0,y0,x1,y1,area:pixels.length});
}
// Cluster 03: the rich light/dark hanging group reviewed by the operator.
const selected = components.find((c) => c.x0 === 863 && c.y0 === 18 && c.x1 === 1232 && c.y1 === 610);
if (!selected) throw new Error('approved_cluster_03_missing');
const padding=20, cw=selected.x1-selected.x0+1+padding*2, ch=selected.y1-selected.y0+1+padding*2, clean=Buffer.alloc(cw*ch*4);
for(const i of selected.pixels){const x=i%w,y=(i-x)/w,tx=x-selected.x0+padding,ty=y-selected.y0+padding;rgba.copy(clean,(ty*cw+tx)*4,i*4,i*4+4);}
fs.writeFileSync(outputPath,encodePng(cw,ch,clean));
const meta={approvedSource:path.relative(repo,sourcePath),approvedLibraryCluster:'CLUSTER 03 HANGING LIGHT',sourceBounds:{left:selected.x0,top:selected.y0,right:selected.x1,bottom:selected.y1},output:path.relative(repo,outputPath),dimensions:{width:cw,height:ch},transparentPaddingPx:padding,sourceArtRedrawn:false,sourceArtSimplified:false,componentArea:selected.area};
fs.writeFileSync(path.join(root,'rich-v4-output','APPROVED_RICH_CLUSTER_SOURCE.json'),JSON.stringify(meta,null,2)+'\n');console.log(JSON.stringify(meta,null,2));
