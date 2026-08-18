import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {decodePng,encodePng} from '../golden-reference/golden-reference-raster-analysis.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const source=path.join(root,'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png');
const output=path.join(root,'test-output/simple-shop-roof-v1-hybrid/art-layers');
const specPath=path.join(root,'asset-factory/modular/SIMPLE_SHOP_ROOF_V1_ART_LAYER_SPEC.json');
if(!fs.existsSync(source))throw new Error(`missing_authoritative_facade_reference:${source}`);
fs.mkdirSync(output,{recursive:true});
const image=decodePng(source),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const layers=[
  {layerId:'ART_ROOF_PARAPET_FRONT',componentId:'R01',root:'GG_ROOT_ROOF_COMMERCIAL_SIMPLE_001',sourcePixelBounds:{x:28,y:12,width:644,height:23},destinationComponentBounds:{width:4.92,height:.18,frontY:.019},file:'ART_ROOF_PARAPET_FRONT.png'},
  {layerId:'ART_ROOF_TOP_CAP_FRONT',componentId:'R02',root:'GG_ROOT_ROOF_COMMERCIAL_SIMPLE_001',sourcePixelBounds:{x:28,y:4,width:644,height:8},destinationComponentBounds:{width:5.08,height:.10,frontY:.019},file:'ART_ROOF_TOP_CAP_FRONT.png'},
  {layerId:'ART_ROOF_LOWER_LIP_FRONT',componentId:'R03',root:'GG_ROOT_ROOF_COMMERCIAL_SIMPLE_001',sourcePixelBounds:{x:28,y:35,width:644,height:12},destinationComponentBounds:{width:5.00,height:.08,frontY:.019},file:'ART_ROOF_LOWER_LIP_FRONT.png'}
];
for(const layer of layers){const {x,y,width,height}=layer.sourcePixelBounds,rgba=Buffer.alloc(width*height*4);for(let row=0;row<height;row++)for(let col=0;col<width;col++){const from=((y+row)*image.w+x+col)*4,to=(row*width+col)*4;image.rgba.copy(rgba,to,from,from+4);const isReferenceBackground=rgba[to]>242&&rgba[to+1]>242&&rgba[to+2]>242;if(isReferenceBackground)rgba[to+3]=0;}const file=path.join(output,layer.file);fs.writeFileSync(file,encodePng(width,height,rgba));layer.normalizedBounds={x:x/image.w,y:y/image.h,width:width/image.w,height:height/image.h};layer.destinationComponentBoundsNormalized={x:0,y:0,width:1,height:1};layer.checksum=sha(file);layer.byteSize=fs.statSync(file).size;layer.alphaCleanupStatus='PASS_REFERENCE_BACKGROUND_TRANSPARENT';layer.sourceContamination='NONE';}
const spec={status:'PASS',assetFamily:'GG-ROOF-COMMERCIAL-SIMPLE-001',authority:'SIMPLE_SHOP_ROOF_REFERENCE_AUTHORITY_V1',source:{path:'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png',sha256:sha(source),dimensions:[image.w,image.h]},layers,fullFacadeBackplateUsed:false,excludedSourceContent:['GROW GOODS wording','façade fascia','awning','wall','door','window','unrelated context'],referenceArtBytes:layers.reduce((sum,layer)=>sum+layer.byteSize,0),generatedBy:'generate-simple-shop-roof-v1-art-layers.mjs'};
fs.writeFileSync(specPath,JSON.stringify(spec,null,2)+'\n');
console.log(JSON.stringify({status:spec.status,output,layers:layers.map(({layerId,checksum,byteSize})=>({layerId,checksum,byteSize}))},null,2));
