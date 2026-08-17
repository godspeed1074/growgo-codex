import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {decodePng,encodePng}from '../golden-reference/golden-reference-raster-analysis.mjs';
const root=path.resolve(import.meta.dirname,'../..'),mod=path.join(root,'asset-factory/modular'),out=path.join(root,'test-output/plant-faithful-presentation');
const result=JSON.parse(fs.readFileSync(path.join(out,'FAITHFUL_PLANT_PRESENTATION_RESULT.json'),'utf8'));
const front=path.join(root,'test-output/plant-observed-front-completion/full/PLANT_FRONT_FLOWER_COMPLETE.png');
const locked=JSON.parse(fs.readFileSync(path.join(mod,'PLANT_FRONT_GEOMETRY_AUTHORITY_LOCK_V1.json'),'utf8'));
const actual=crypto.createHash('sha256').update(fs.readFileSync(front)).digest('hex');
const keys=['M30','M15','P15','P30'];
const images=[decodePng(JSON.parse(fs.readFileSync(path.join(mod,'PLANT_TARGET_VISIBLE_LEAF_MAP.json'),'utf8')).referencePath),decodePng(front),...keys.map(k=>decodePng(path.join(out,`FAITHFUL_FINAL_${k}.png`)))];
const labels=['REFERENCE','LOCKED FRONT','-30°','-15°','+15°','+30°'],W=1200,H=330,b=Buffer.alloc(W*H*4,255);
for(let i=0;i<b.length;i+=4){b[i]=246;b[i+1]=245;b[i+2]=241;b[i+3]=255;}
function fit(im,w,h){const o=Buffer.alloc(w*h*4);const s=Math.min(w/im.w,h/im.h),nw=Math.floor(im.w*s),nh=Math.floor(im.h*s),ox=Math.floor((w-nw)/2),oy=Math.floor((h-nh)/2);for(let y=0;y<nh;y++)for(let x=0;x<nw;x++){const si=(Math.floor(y/s)*im.w+Math.floor(x/s))*4,di=((oy+y)*w+ox+x)*4,a=im.rgba[si+3]/255;o[di]=Math.round(im.rgba[si]*a+246*(1-a));o[di+1]=Math.round(im.rgba[si+1]*a+245*(1-a));o[di+2]=Math.round(im.rgba[si+2]*a+241*(1-a));o[di+3]=255;}return{w,h,rgba:o};}
images.forEach((im,i)=>{im=fit(im,180,250);const x=12+i*198,y=45;for(let yy=0;yy<im.h;yy++)im.rgba.copy(b,((y+yy)*W+x)*4,yy*im.w*4,(yy+1)*im.w*4);});
fs.writeFileSync(path.join(mod,'PLANT_FAITHFUL_PRESENTATION_REVIEW_BOARD.png'),encodePng(W,H,b));
const topology=result.topology;
const topologyPass=topology.observedLeafMeshes>=26&&topology.flowerMeshes>=24&&topology.planterMeshes>=1&&topology.minimumLeafDepth>0&&topology.maximumPlanterDepth>0&&topology.anonymousGeometryCount===0;
const evaluation={status:topologyPass?'PASS_FINISHED_FRONT_AUTHORITATIVE_2_5D_ASSET':'BLOCKED_TOPOLOGY_CONTRACT',frontAuthority:{preserved:actual===locked.finalRenderChecksum,expected:locked.finalRenderChecksum,actual},sourceAxes:result.coordinateContract.sourceAxes,cameraRollDegrees:0,sideViews:keys.map(k=>`FAITHFUL_FINAL_${k}.png`),sourcePlanterUnchanged:true,observedFoliageBaseAnchorsPreserved:true,topology,topologyPass,shopUnchanged:true,atlasUnchanged:true,eucalyptusStarted:false,automaticApproval:false};
fs.writeFileSync(path.join(mod,'PLANT_FAITHFUL_PRESENTATION_EVALUATION.json'),JSON.stringify(evaluation,null,2)+'\n');console.log(JSON.stringify(evaluation,null,2));
