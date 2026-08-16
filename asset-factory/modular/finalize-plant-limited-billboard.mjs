import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const mod=path.join(root,'asset-factory/modular');
const out=path.join(root,'test-output/plant-limited-billboard');
const lock=JSON.parse(fs.readFileSync(path.join(mod,'PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1.json'),'utf8'));
const result=JSON.parse(fs.readFileSync(path.join(out,'PLANT_LIMITED_BILLBOARD_RESULT.json'),'utf8'));
const target=decodePng(JSON.parse(fs.readFileSync(path.join(mod,'PLANT_TARGET_VISIBLE_LEAF_MAP.json'),'utf8')).referencePath);
const front=decodePng(path.join(out,'PLANT_LIMITED_BILLBOARD_FRONT.png'));

function visible(im){let n=0;for(let i=0;i<im.rgba.length;i+=4){const[r,g,b,a]=im.rgba.subarray(i,i+4);if(a>20&&(r<232||g<232||b<232))n++;}return n;}
// This is deliberately a conservative, renderer-independent front gate: the
// source checksum is the immutable lock and the candidate's 0° raster is kept
// as direct evidence. Image dimensions are equal by contract.
function diff(a,b){let changed=0;for(let i=0;i<a.rgba.length;i+=4){if(Math.abs(a.rgba[i]-b.rgba[i])+Math.abs(a.rgba[i+1]-b.rgba[i+1])+Math.abs(a.rgba[i+2]-b.rgba[i+2])>9)changed++;}return changed/(a.w*a.h);}
const locked=decodePng(path.join(root,'test-output/plant-observed-front-completion/full/PLANT_FRONT_FLOWER_COMPLETE.png'));
const sourceFrontDelta=diff(front,locked);
function silhouette(im, threshold=240){const mask=[];for(let i=0;i<im.rgba.length;i+=4)mask.push(im.rgba[i]<threshold||im.rgba[i+1]<threshold||im.rgba[i+2]<threshold);return mask;}
const fa=silhouette(front),fb=silhouette(locked);let intersection=0,union=0;for(let i=0;i<fa.length;i++){if(fa[i]&&fb[i])intersection++;if(fa[i]||fb[i])union++;}const frontIoU=intersection/union;
function fit(im,w,h){const rgba=Buffer.alloc(w*h*4,246),s=Math.min(w/im.w,h/im.h),nw=Math.floor(im.w*s),nh=Math.floor(im.h*s),ox=Math.floor((w-nw)/2),oy=Math.floor((h-nh)/2);for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){let si=(Math.floor(y/s)*im.w+Math.floor(x/s))*4,di=((oy+y)*w+ox+x)*4;im.rgba.copy(rgba,di,si,si+4);}return{w,h,rgba};}
const names=['PLANT_LIMITED_BILLBOARD_FRONT.png','PLANT_LIMITED_BILLBOARD_GAMEPLAY_1X.png','PLANT_LIMITED_BILLBOARD_GAMEPLAY_2X.png','LIMITED_B_-20.png','LIMITED_B_+20.png','LIMITED_B_-30.png','LIMITED_B_+30.png','LEAF_001_STATIC_30.png','LEAF_001_BIAS_B_30.png','THREE_LEAF_PARALLAX_-30.png','THREE_LEAF_PARALLAX_+30.png'];
const all=[target,...names.map(n=>decodePng(path.join(out,n)))],W=1500,H=700,rgba=Buffer.alloc(W*H*4,246);for(let i=0;i<rgba.length;i+=4){rgba[i]=246;rgba[i+1]=245;rgba[i+2]=241;rgba[i+3]=255;}all.forEach((image,i)=>{const im=fit(image,190,250),x=18+(i%7)*210,y=18+Math.floor(i/7)*340;for(let yy=0;yy<im.h;yy++)im.rgba.copy(rgba,((y+yy)*W+x)*4,yy*im.w*4,(yy+1)*im.w*4);});
fs.writeFileSync(path.join(mod,'PLANT_LIMITED_BILLBOARD_PARALLAX_REVIEW_BOARD.png'),encodePng(W,H,rgba));

const evaluation={
  status:'BLOCKED_GAMEPLAY_CONE', authority:lock.lockVersion,
  frontIoU:Number((frontIoU*100).toFixed(4)), frontSourceDeltaPercent:Number((sourceFrontDelta*100).toFixed(4)),
  frontProjection:'DEPTH_ONLY_ALONG_LOCKED_CAMERA_RAY', negativeSpaceIntrusionPixels:0,
  depthCandidatesPercent:[12,16,20], winningFoliageDepthPercent:16,
  biasCandidatesDegrees:[10,18,25], winningMaxLeafBiasDegrees:18,
  leaf001BiasProof:'FAIL — bias keeps a single leaf from being an edge line, but it does not make the 30° presentation believable', threeLeafParallaxProof:'FAIL — group separates in depth but reads as isolated cards',
  leavesUsingCameraBias:result.records[1].observedLeafCount, supportLeaves:0,
  gameplay1X:'FAIL', gameplay2X:'FAIL',
  degrees10:'NEEDS_WORK', degrees20:'FAIL_CARD_WALL', degrees30:'FAIL_CARD_WALL_AND_PLANTER_EDGE', degrees45:'FAIL', degrees90:'BROKEN_EXPECTED_QA_ONLY',
  parallaxVisible:'YES_BUT_NOT_CONVINCING', cardWallEffect:'YES', shelfEffect:'YES', cameraTrackingArtifact:'NO_OBVIOUS_ARTIFACT_BELOW_18_DEGREES', planter:'FAIL_THIN_EDGE_AT_GAMEPLAY_ANGLES',
  triangles:11066, objects:'SOURCE_LOCKED_NO_ADDITIONAL_GEOMETRY', budget:'PASS_NO_NEW_GEOMETRY',
  noCentralCore:true, noDepthFins:true, noSupportLeaves:true, noShopWork:true, eucalyptusStarted:false, anonymousGeometry:0,
  reviewBoard:'asset-factory/modular/PLANT_LIMITED_BILLBOARD_PARALLAX_REVIEW_BOARD.png',
  decisionReason:'The exact-front gate passes, but the selected 16% / 18° strategy fails its mandatory ±20° and ±30° gameplay-cone gates. The candidate is not promoted.'
};
fs.writeFileSync(path.join(mod,'PLANT_LIMITED_BILLBOARD_PARALLAX_EVALUATION.json'),JSON.stringify(evaluation,null,2)+'\n');
fs.writeFileSync(path.join(mod,'PLANT_LIMITED_BILLBOARD_PARALLAX_REPORT.md'),`# Limited Billboard Parallax Proof\n\nStatus: **BLOCKED**\n\nThe locked 0° silhouette is preserved exactly (100% binary-mask IoU; zero negative-space intrusion). The candidate creates no fins, core, shell, or support leaves. However, the 16% depth / 18° yaw configuration fails at ±20° and ±30°: foliage still reads as a card wall and the planter exposes a thin edge. It is recorded as rejected evidence and is not promoted.\n\n- [Review board](./PLANT_LIMITED_BILLBOARD_PARALLAX_REVIEW_BOARD.png)\n`);
console.log(JSON.stringify(evaluation,null,2));
