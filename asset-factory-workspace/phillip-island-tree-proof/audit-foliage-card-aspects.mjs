import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const repo = process.cwd();
const root = path.join(repo, 'asset-factory-workspace/phillip-island-tree-proof');
const atlas = path.join(repo, 'asset-factory-workspace/eucalyptus-hybrid-proof/v2-cluster-art/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png');
const boxes = [[17,13,428,518],[478,18,833,563],[863,18,1232,610],[730,561,993,800],[26,793,676,1228],[696,799,896,1235],[917,775,1237,1218],[48,489,652,819]];
const source = decodePng(atlas);
const native = [[0,.34,5.35,4.5,5.2,2,0],[-1.45,.05,4.45,4.45,4.7,0,-10],[1.45,.10,4.45,4.35,4.75,1,11],[0,-.20,3.8,5.0,4.35,4,0],[-1.9,.25,3.95,3.4,3.5,3,-14],[1.9,.22,3.95,3.35,3.5,5,14],[0,.52,4.35,4.65,4.0,6,3],[-.72,-.12,3.2,3.55,3.2,7,-7],[.78,-.15,3.25,3.5,3.25,1,7],[-.9,.46,5.15,3.1,3.6,0,-10],[.95,.45,5.1,3.1,3.6,2,10],[0,-.35,2.95,3.8,2.9,4,0]];
const coastal = [[-1.9,.22,5.2,3.2,3.75,0,-13],[-.75,.26,6.8,3.2,4.0,1,-5],[.85,.25,6.55,3.15,4.05,0,8],[2.05,.23,5.65,3.05,3.65,5,15],[2.7,.30,4.45,2.5,3.0,3,18],[-1.05,-.12,4.6,3.1,3.5,4,-8],[-2.7,.35,4.6,2.45,2.9,5,-18],[.15,.5,7.75,2.55,3.2,1,3],[-.15,-.18,5.35,3.45,3.55,6,0],[-1.35,.4,6.15,2.55,3.2,0,-11],[1.55,.42,6.25,2.55,3.2,1,12],[0,-.3,3.95,3.1,2.8,4,0]];
const wind = [[-1.25,.24,3.2,2.55,2.40,0,-13],[-.15,.18,4.0,2.85,2.65,1,-7],[1.25,.2,4.2,3.0,2.70,0,3],[2.75,.22,3.95,2.95,2.55,5,9],[4.0,.28,3.45,2.55,2.30,1,14],[1.0,-.15,3.1,3.05,2.40,0,0],[-.45,.45,3.65,2.40,2.25,5,-9],[2.15,.48,4.55,2.40,2.35,1,7],[3.45,-.05,3.35,2.35,2.10,0,12],[0,-.25,2.65,2.55,2.00,5,-4],[1.8,.55,3.55,2.35,2.05,1,5],[-1.85,.35,2.9,2.10,1.90,0,-16]];
const all = [['TREE_NATIVE_ROUNDED_001', native], ['TREE_EUCALYPTUS_COASTAL_002', coastal], ['TREE_COASTAL_WIND_001', wind]];
const cards = all.flatMap(([tree, layout]) => layout.map(([, , , width, height, sourceIndex], index) => {
  const [x0,y0,x1,y1] = boxes[sourceIndex], sourceWidth = x1-x0+1, sourceHeight=y1-y0+1;
  const sourceAspectRatio=sourceWidth/sourceHeight, renderedAspectRatio=width/height, ratioError=Math.abs(renderedAspectRatio/sourceAspectRatio-1);
  return { tree, cardIndex:index, sourceFilename:path.basename(atlas), sourceComponent:sourceIndex, sourcePixelBounds:{left:x0,top:y0,right:x1,bottom:y1}, sourceWidth, sourceHeight, sourceAspectRatio, currentCardWidth:width, currentCardHeight:height, renderedAspectRatio, scaleX:1, scaleY:1, uniformScale:true, aspectPreserved:ratioError<=.01, ratioError, distorted:ratioError>.01 };
}));
const audit={schemaVersion:'1.0.0',status:'FAIL_EXPECTED_LEGACY_WORKERS_DISTORT_SOURCE_ASPECT',sourceAtlas:path.relative(repo,atlas),sourceDimensions:{width:source.w,height:source.h},rootCause:{worker:'native_v4_rich_raster_worker.py and camera_authored_rich_next_families_worker.py',finding:'Each card receives independent width and height arguments when its mesh is constructed. These arbitrary mesh dimensions override the UV crop source aspect before any parent transform; scale values are uniform. LOD selection truncates cards only and is not the cause.',cause:'GENERIC_FIXED_CARD_DIMENSIONS'},cards,summary:{cardsAudited:cards.length,distortedCards:cards.filter(c=>c.distorted).length,uniformScaleCards:cards.filter(c=>c.uniformScale).length,sourceAspectTolerance:.01}};
fs.writeFileSync(path.join(root,'GROWGO_FOLIAGE_CARD_ASPECT_RATIO_AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
const W=1800,H=1000,b=Buffer.alloc(W*H*4,244); const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)b.set(c,(y*W+x)*4)};const fill=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,c)};
const draw=(img,dx,dy,dw,dh)=>{for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=Math.min(img.w-1,Math.floor(x*img.w/dw)),sy=Math.min(img.h-1,Math.floor(y*img.h/dh)),i=(sy*img.w+sx)*4;put(dx+x,dy+y,[img.rgba[i],img.rgba[i+1],img.rgba[i+2],img.rgba[i+3]])}};
fill(0,0,W,95,[17,52,40,255]); const picks=[0,1,2,4,5,6,7]; picks.forEach((p,i)=>{const [x0,y0,x1,y1]=boxes[p],cw=x1-x0+1,ch=y1-y0+1,crop={w:cw,h:ch,rgba:Buffer.alloc(cw*ch*4)};for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const si=((y0+y)*source.w+x0+x)*4;source.rgba.copy(crop.rgba,(y*cw+x)*4,si,si+4)};const x=35+(i%4)*440,y=145+Math.floor(i/4)*420;draw(crop,x,y,350,250);const sample=cards.find(c=>c.sourceComponent===p); const rw=320,rh=Math.max(40,Math.round(rw/sample.renderedAspectRatio));fill(x,y+270,rw,Math.min(110,rh),[174,55,45,255]);});
fs.writeFileSync(path.join(root,'GROWGO_FOLIAGE_CARD_ASPECT_RATIO_AUDIT.png'),encodePng(W,H,b));
console.log(JSON.stringify(audit.summary));
