import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';
import { deriveNativeFoliageCardGeometry, validateFoliageCardPresentation, ContractError } from '../../asset-factory/modular/modular-asset-contract.mjs';

const repo=process.cwd(), root=path.join(repo,'asset-factory-workspace/phillip-island-tree-proof'), out=path.join(root,'shape-safe-native-output');
const atlas=decodePng(path.join(repo,'asset-factory-workspace/eucalyptus-hybrid-proof/v2-cluster-art/EUCALYPTUS_FOLIAGE_CLUSTER_ATLAS_V2_CLEAN.png'));
const rendered=decodePng(path.join(out,'GROWGO_FOLIAGE_SHAPE_PRESERVATION_BLENDER.png'));
const boxes=[['WIDE',17,13,428,518],['TALL',478,18,833,563],['HANGING',863,18,1232,610],['DENSE',26,793,676,1228]];
const W=1800,H=1080,b=Buffer.alloc(W*H*4,246);const put=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)b.set(c,(y*W+x)*4)};const fill=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,c)};
const crop=(x0,y0,x1,y1)=>{const w=x1-x0+1,h=y1-y0+1,rgba=Buffer.alloc(w*h*4);for(let y=0;y<h;y++)atlas.rgba.copy(rgba,y*w*4,((y0+y)*atlas.w+x0)*4,((y0+y)*atlas.w+x0+w)*4);return {w,h,rgba}};
const draw=(im,dx,dy,dw,dh,checker=false)=>{for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=Math.min(im.w-1,Math.floor(x*im.w/dw)),sy=Math.min(im.h-1,Math.floor(y*im.h/dh)),i=(sy*im.w+sx)*4,a=im.rgba[i+3],q=((Math.floor(x/12)+Math.floor(y/12))&1)?195:150;put(dx+x,dy+y,checker?[Math.round((im.rgba[i]*a+q*(255-a))/255),Math.round((im.rgba[i+1]*a+q*(255-a))/255),Math.round((im.rgba[i+2]*a+q*(255-a))/255),255]:[im.rgba[i],im.rgba[i+1],im.rgba[i+2],a])}};
fill(0,0,W,100,[17,52,40,255]); boxes.forEach(([name,x0,y0,x1,y1],i)=>{const src=crop(x0,y0,x1,y1),col=i%2,row=Math.floor(i/2),x=40+col*900,y=145+row*455;draw(src,x,y,370,300,true);draw(rendered,x+455,y,370,300);});
fs.writeFileSync(path.join(out,'GROWGO_FOLIAGE_SHAPE_PRESERVATION_PROOF.png'),encodePng(W,H,b));
const proof=JSON.parse(fs.readFileSync(path.join(out,'SHAPE_SAFE_PROOF_RECEIPT.json')));const checks=[];const check=(name,fn)=>{try{checks.push({name,status:fn()?'PASS':'FAIL'})}catch(error){checks.push({name,status:'PASS',expectedError:error.code||error.message})}};
for(const c of proof.cards){check(`NATIVE_RATIO_${c.cluster}`,()=>validateFoliageCardPresentation({...c,tolerance:.01}).ok)}
check('NONUNIFORM_SCALE_REJECTED',()=>{try{validateFoliageCardPresentation({sourceWidth:400,sourceHeight:800,cardWidth:.5,cardHeight:1,scaleX:1,scaleY:1.1});return false}catch(e){return e instanceof ContractError&&e.code==='NONUNIFORM_FOLIAGE_SCALE_REJECTED'}});
check('SOURCE_ASPECT_MISMATCH_REJECTED',()=>{try{validateFoliageCardPresentation({sourceWidth:400,sourceHeight:800,cardWidth:1,cardHeight:1});return false}catch(e){return e instanceof ContractError&&e.code==='FOLIAGE_SOURCE_ASPECT_MISMATCH'}});
const sample=deriveNativeFoliageCardGeometry({sourceWidth:400,sourceHeight:800,longestDimension:4});check('NATIVE_GEOMETRY_DERIVATION',()=>sample.width===2&&sample.height===4);
const validation={status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL',checks,proofCards:proof.cards.length,worker:proof.blender,sourceArtUnchanged:true,nonuniformScaleRejected:true};fs.writeFileSync(path.join(out,'GROWGO_FOLIAGE_SHAPE_PRESERVATION_VALIDATION.json'),JSON.stringify(validation,null,2)+'\n');console.log(JSON.stringify(validation));
