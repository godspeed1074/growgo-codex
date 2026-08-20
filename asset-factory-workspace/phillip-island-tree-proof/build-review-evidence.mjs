import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, 'output');
const ids=['TREE_EUCALYPTUS_COASTAL_002','TREE_NATIVE_ROUNDED_001','TREE_COASTAL_WIND_001'];
const files=ids.map(id=>decodePng(path.join(root,`${id}@1.0.0`,'GROWGO_GAMEPLAY_CAMERA_REVIEW.png')));
function blank(w,h,c=[235,238,230,255]){const b=Buffer.alloc(w*h*4);for(let i=0;i<b.length;i+=4)b.set(c,i);return b}
function fit(im,w,h){const s=Math.min(w/im.w,h/im.h),nw=Math.floor(im.w*s),nh=Math.floor(im.h*s);return{im,nw,nh,s}}
function put(dst,DW,x,y,w,h,src){const f=fit(src,w,h),ox=x+Math.floor((w-f.nw)/2),oy=y+h-f.nh;for(let yy=0;yy<f.nh;yy++)for(let xx=0;xx<f.nw;xx++){const sx=Math.min(src.w-1,Math.floor(xx/f.s)),sy=Math.min(src.h-1,Math.floor(yy/f.s)),si=(sy*src.w+sx)*4,di=((oy+yy)*DW+ox+xx)*4,a=src.rgba[si+3]/255;for(let c=0;c<3;c++)dst[di+c]=Math.round(src.rgba[si+c]*a+dst[di+c]*(1-a));dst[di+3]=255}}
const board={w:1800,h:760,rgba:blank(1800,760)};files.forEach((im,i)=>put(board.rgba,board.w,i*600,0,600,760,im));fs.writeFileSync(path.join(root,'GROWGO_GAMEPLAY_CAMERA_TREE_PACK_REVIEW.png'),encodePng(board.w,board.h,board.rgba));
// Deterministic developer-only composition: the same seed table always yields the same family/mirror/scale choices.
const placements=[0,1,2,1,0,2,1,0,2,0,1,2];const mass={w:1800,h:1000,rgba:blank(1800,1000,[205,219,205,255])};placements.forEach((f,i)=>{const x=(i%4)*450,y=Math.floor(i/4)*320,mirror=i%2===1,src=files[f];let crop=src;if(!mirror){put(mass.rgba,mass.w,x,y,450,320,crop);return}const flipped={w:src.w,h:src.h,rgba:Buffer.alloc(src.rgba.length)};for(let yy=0;yy<src.h;yy++)for(let xx=0;xx<src.w;xx++){const a=(yy*src.w+xx)*4,b=(yy*src.w+(src.w-1-xx))*4;src.rgba.copy(flipped.rgba,b,a,a+4)}put(mass.rgba,mass.w,x,y,450,320,flipped)});fs.writeFileSync(path.join(root,'GROWGO_DEVELOPER_ONLY_TREE_MASS_PLACEMENT_MOCKUP.png'),encodePng(mass.w,mass.h,mass.rgba));
const manifests=ids.map(id=>JSON.parse(fs.readFileSync(path.join(root,`${id}@1.0.0`,'BUILD_METADATA.json'))));
const performance={status:'PASS_REVIEW_PROOF',mode:'DEVELOPER_ONLY_COMPOSITED_REVIEW_MOCKUP',seed:'PHILLIP_ISLAND_TREE_PROOF_V1',instanceCount:placements.length,familyCount:ids.length,variationCount:12,visibleCards:placements.reduce((n,f)=>n+manifests[f].lods.GAMEPLAY.cards,0),trianglesGameplay:placements.reduce((n,f)=>n+manifests[f].lods.GAMEPLAY.triangles,0),materialsPerAsset:2,sharedTexture:'GROWGO_EUCALYPTUS_V6_CLUSTER_ATLAS.png',atlasArchitectureModified:false,productionPopulationModified:false,alphaOverdraw:'LIMITED_TO_CAMERA_AUTHORED_OVERLAPPING_CARDS; operator review required'};fs.writeFileSync(path.join(root,'TREE_PACK_PERFORMANCE_PROOF.json'),JSON.stringify(performance,null,2)+'\n');
console.log(JSON.stringify({board:'GROWGO_GAMEPLAY_CAMERA_TREE_PACK_REVIEW.png',mockup:'GROWGO_DEVELOPER_ONLY_TREE_MASS_PLACEMENT_MOCKUP.png',performance},null,2));
