import fs from 'node:fs';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';
const input='asset-factory-workspace/eucalyptus-hybrid-proof/v6-authored-art/GROWGO_EUCALYPTUS_V6_CLUSTER_ATLAS.png';
const output='asset-factory-workspace/phillip-island-tree-proof/GROWGO_FOLIAGE_CLUSTER_ATLAS_V3_NO_TWIG.png';
const image=decodePng(input), out=Buffer.from(image.rgba);let removed=0, lifted=0;
for(let i=0;i<out.length;i+=4){const [r,g,b,a]=[out[i],out[i+1],out[i+2],out[i+3]];const brown=a>0&&r>g*1.25&&g>b*1.35&&r>45&&g<150&&b<110;if(brown){out[i+3]=0;removed++;continue}
 // Preserve the artwork's hue relationships but lift only the deep foliage
 // floor: gameplay can then distinguish rear paper layers from black gaps.
 if(a>0){out[i]=Math.min(255,Math.round(r*1.16+8));out[i+1]=Math.min(255,Math.round(g*1.18+11));out[i+2]=Math.min(255,Math.round(b*1.12+6));lifted++}}
fs.writeFileSync(output,encodePng(image.w,image.h,out));
fs.writeFileSync('asset-factory-workspace/phillip-island-tree-proof/GROWGO_FOLIAGE_CLUSTER_ATLAS_V3_NO_TWIG.json',JSON.stringify({source:input,output,method:'DETERMINISTIC_BROWN_BRANCHLET_ALPHA_KEY_PLUS_GAMEPLAY_TONE_LIFT',sourceModified:false,removedBrownPixels:removed,liftedFoliagePixels:lifted,width:image.w,height:image.h},null,2)+'\n');
console.log(JSON.stringify({output,removed,lifted},null,2));
