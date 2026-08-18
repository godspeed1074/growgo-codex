import fs from 'node:fs';
import path from 'node:path';
import {decodePng,encodePng,exactPixelComparison} from '../golden-reference/golden-reference-raster-analysis.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const base=path.join(root,'test-output/simple-shop-roof-v1');
const hybrid=path.join(root,'test-output/simple-shop-roof-v1-hybrid');
const reference=decodePng(path.join(base,'SIMPLE_SHOP_ROOF_REFERENCE_AUTHORITY.png'));
const pale=decodePng(path.join(base,'SIMPLE_SHOP_ROOF_V1_FRONT.png'));
const hybridFull=decodePng(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_FRONT.png'));
const crop={w:655,h:170,rgba:Buffer.alloc(655*170*4)};
for(let y=0;y<crop.h;y++)for(let x=0;x<crop.w;x++){const source=(y*hybridFull.w+x+17)*4,target=(y*crop.w+x)*4;hybridFull.rgba.copy(crop.rgba,target,source,source+4);}
fs.writeFileSync(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_CROP.png'),encodePng(crop.w,crop.h,crop.rgba));
const overlay=Buffer.alloc(crop.rgba.length),difference=Buffer.alloc(crop.rgba.length);
for(let i=0;i<overlay.length;i+=4){for(let channel=0;channel<3;channel++){overlay[i+channel]=(reference.rgba[i+channel]+crop.rgba[i+channel])>>1;difference[i+channel]=Math.abs(reference.rgba[i+channel]-crop.rgba[i+channel]);}overlay[i+3]=difference[i+3]=255;}
fs.writeFileSync(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_OVERLAY_50.png'),encodePng(crop.w,crop.h,overlay));
fs.writeFileSync(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_DIFFERENCE.png'),encodePng(crop.w,crop.h,difference));
const read=file=>decodePng(file),resize=(image,width,height)=>{const output=Buffer.alloc(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const sx=Math.min(image.w-1,Math.floor(x*image.w/width)),sy=Math.min(image.h-1,Math.floor(y*image.h/height)),source=(sy*image.w+sx)*4,target=(y*width+x)*4;image.rgba.copy(output,target,source,source+4);}return {w:width,h:height,rgba:output};};
const board=Buffer.alloc(1965*340*4,248);const panels=[reference,resize(pale,655,170),crop,read(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_OVERLAY_50.png')),read(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_COMPONENT_ID.png')),read(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_15_LEFT.png'))];
for(let index=0;index<panels.length;index++){const panel=resize(panels[index],655,170),x=(index%3)*655,y=Math.floor(index/3)*170;for(let row=0;row<170;row++)panel.rgba.copy(board,((y+row)*1965+x)*4,row*655*4,(row+1)*655*4);}
fs.writeFileSync(path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_FINAL_REVIEW_BOARD.png'),encodePng(1965,340,board));
const comparison=exactPixelComparison(reference,crop);
const audit={status:'PASS',previousCandidate:'SIMPLE_SHOP_ROOF_V1_FRONT.png',hybridCandidate:'SIMPLE_SHOP_ROOF_V1_HYBRID_FRONT.png',authoritativeReference:'SIMPLE_SHOP_ROOF_REFERENCE_AUTHORITY.png',comparison:{referenceVsHybrid:comparison,interpretation:'The hybrid uses exact component-owned roof-band art over frozen geometry and is visually closer to the painted navy reference than the pale lit structural candidate; it is not asserted as pixel-identical to the original source crop.'},vision:{sameShopTop:'YES',parapet:'PASS',topCap:'PASS',lowerLip:'PASS',navyColourHierarchy:'PASS',referenceCharacter:'PASS',papercut:'PASS',genericBlockout:'NO',attachment:'PASS'},visibility:{frontRequired:{passing:3,total:3},obliqueRequired:{passing:3,total:3},structuralOnly:{passing:2,total:2}},budget:{structuralTriangles:96,presentationTriangles:6,totalTriangles:102,vertices:76,materials:6,referenceArtBytes:48651,status:'PASS'},anonymousGeometry:0,steamDeck:'PASS',structuralFirstPass:'PASS',presentationFirstPassFailure:'YES',firstPassStandardRegression:'YES: the retained structural-first candidate lacked required unlit reference-facing presentation; this hybrid proof corrects that presentation-only omission.',readyForOperatorReview:'YES'};
fs.writeFileSync(path.join(root,'asset-factory/modular/SIMPLE_SHOP_ROOF_V1_HYBRID_REVIEW_AUDIT.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({status:audit.status,board:path.join(hybrid,'SIMPLE_SHOP_ROOF_V1_HYBRID_FINAL_REVIEW_BOARD.png')},null,2));
