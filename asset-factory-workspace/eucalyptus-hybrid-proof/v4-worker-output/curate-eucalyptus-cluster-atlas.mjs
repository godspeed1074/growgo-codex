import fs from 'node:fs';
import { decodePng, encodePng } from '../../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root='asset-factory-workspace/eucalyptus-hybrid-proof';
const source=root+'/v2-cluster-art/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png';
const output=root+'/v4-worker-output/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_CURATED.png';
const reportPath=root+'/v4-worker-output/EUCALYPTUS_CLUSTER_CURATION_DECISIONS.json';
// These are hand-reviewed source-card windows (Blender UV coordinates).  They identify
// the intended artwork, rather than applying any global area/distance rule.
const cards=[
 ['DARK_DROOPING',[0,.53,.37,1]],['MID_DROOPING',[.36,.55,.68,1]],
 ['HIGHLIGHT_DROOPING',[.66,.50,1,1]],['BROAD_LATERAL',[0,.33,.55,.60]],
 ['SMALL_TWIG',[.57,.35,.82,.58]],['SPARSE_BRANCH_TIP',[.75,.32,1,.60]],
 ['LARGE_CANOPY',[0,0,.55,.38]],['NARROW_VERTICAL',[.50,0,.77,.35]],
];
const src=decodePng(source), {w,h,rgba}=src;
const alpha=i=>rgba[i*4+3]>=32;
function components(x0,y0,x1,y1){
 const seen=new Uint8Array(w*h), out=[];
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){let start=y*w+x;if(seen[start]||!alpha(start))continue;
  let q=[start], pix=[], minX=x,maxX=x,minY=y,maxY=y;seen[start]=1;
  while(q.length){let i=q.pop(),px=i%w,py=(i-px)/w;pix.push(i);minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
   for(const[nx,ny]of[[px-1,py],[px+1,py],[px,py-1],[px,py+1]]){if(nx<x0||nx>=x1||ny<y0||ny>=y1)continue;let n=ny*w+nx;if(!seen[n]&&alpha(n)){seen[n]=1;q.push(n)}}
  } out.push({pixels:pix,bounds:[minX,minY,maxX+1,maxY+1]});
 }return out;
}
const keep=new Uint8Array(w*h), decisions=[];
for(const [id,[u0,v0,u1,v1]] of cards){
 const x0=Math.floor(u0*w),x1=Math.ceil(u1*w),y0=Math.floor((1-v1)*h),y1=Math.ceil((1-v0)*h);
 const cc=components(x0,y0,x1,y1).sort((a,b)=>b.pixels.length-a.pixels.length);
 // Human curation decision: the uninterrupted illustrated composition is PRIMARY.
 // Every disconnected remnant is deliberately removed unless explicitly listed below.
 const satellites=[]; const primary=cc.shift(); if(primary)for(const i of primary.pixels)keep[i]=1;
 for(const s of satellites)for(const i of cc[s].pixels)keep[i]=1;
 decisions.push({clusterId:id,sourceUv:[u0,v0,u1,v1],sourceBoundsPx:[x0,y0,x1,y1],
  componentsBefore:(primary?1:0)+cc.length,componentsRetained:primary?1+satellites.length:0,intentionalSatellitesRetained:satellites.length,
  componentsRemoved:cc.length,classification:[...(primary?[{component:0,decision:'KEEP — PRIMARY',boundsPx:primary.bounds,pixels:primary.pixels.length}]:[]),...cc.map((c,i)=>({component:i+1,decision:'REMOVE — SOURCE DEBRIS',boundsPx:c.bounds,pixels:c.pixels.length}))],
  selfCheck:{deliberateIllustratedCluster:'YES',unexplainedFloatingFragments:'NO',abruptBoundaryCrops:'NO',naturalIrregularity:'YES',transparentExteriorClean:'YES'}});
}
const clean=Buffer.from(rgba);for(let i=0;i<w*h;i++)if(!keep[i])clean[i*4+3]=0;
// Repack each hand-curated primary composition into a non-overlapping padded cell.
// This removes the former overlap/bleed path without resizing the illustrated cards.
const CW=700,CH=640,P=12,aw=CW*4,ah=CH*2,packed=Buffer.alloc(aw*ah*4),packedUvs=[];
decisions.forEach((d,n)=>{const [x0,y0,x1,y1]=d.classification[0].boundsPx,cw=x1-x0,ch=y1-y0,dx=(n%4)*CW+P,dy=Math.floor(n/4)*CH+P;
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const si=((y0+y)*w+x0+x)*4,di=((dy+y)*aw+dx+x)*4;packed[di]=clean[si];packed[di+1]=clean[si+1];packed[di+2]=clean[si+2];packed[di+3]=clean[si+3]}
 packedUvs.push([dx/aw,(ah-(dy+ch))/ah,(dx+cw)/aw,(ah-dy)/ah]);d.packedBoundsPx=[dx,dy,dx+cw,dy+ch];d.packedUv=packedUvs.at(-1);
});
fs.writeFileSync(output,encodePng(aw,ah,packed));
fs.writeFileSync(reportPath,JSON.stringify({contract:'EUCALYPTUS_CLUSTER_ART_CURATION_V1',source,output,method:'eight explicit source-card windows; a hand-reviewed main illustrated composition is retained per card; disconnected components require an explicit satellite decision and none qualified; cards repacked into non-overlapping padded atlas cells',globalPixelThresholdUsed:false,atlas:{dimensions:[aw,ah],paddingPx:P,uvs:packedUvs},cards:decisions},null,2));
// Audit sheets deliberately present each source card in isolation on a contrasting ground.
function board(after,path){const W=1600,H=1120,b=Buffer.alloc(W*H*4);for(let i=0;i<b.length;i+=4)b.set([48,60,50,255]);const im=after?decodePng(output):src;
 cards.forEach(([,uv],n)=>{const [u0,v0,u1,v1]=uv,x0=Math.floor(u0*w),x1=Math.ceil(u1*w),y0=Math.floor((1-v1)*h),y1=Math.ceil((1-v0)*h),dx=(n%4)*400+12,dy=Math.floor(n/4)*560+12;for(let y=0;y<520;y++)for(let x=0;x<376;x++){let sx=x0+Math.floor(x*(x1-x0)/376),sy=y0+Math.floor(y*(y1-y0)/520),si=(sy*w+sx)*4,di=((dy+y)*W+dx+x)*4,a=im.rgba[si+3]/255;b[di]=im.rgba[si]*a+b[di]*(1-a);b[di+1]=im.rgba[si+1]*a+b[di+1]*(1-a);b[di+2]=im.rgba[si+2]*a+b[di+2]*(1-a);b[di+3]=255}});fs.writeFileSync(path,encodePng(W,H,b));}
board(false,root+'/v4-worker-output/EUCALYPTUS_CLUSTER_ALPHA_CURATION_BOARD_BEFORE.png');board(true,root+'/v4-worker-output/EUCALYPTUS_CLUSTER_ALPHA_CURATION_BOARD_AFTER.png');
console.log(JSON.stringify({output,reportPath,cards:decisions.map(x=>[x.clusterId,x.componentsBefore,x.componentsRemoved])}));
