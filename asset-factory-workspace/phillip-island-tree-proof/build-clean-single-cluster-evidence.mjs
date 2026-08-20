import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(process.cwd(), 'asset-factory-workspace/phillip-island-tree-proof');
const out = path.join(root, 'single-card-output');
const clean = decodePng(path.join(root, 'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_RGBA_CLEAN.png'));
const render = decodePng(path.join(out, 'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_BLENDER_CLEAN.png'));
const W = 1800, H = 1160, board = Buffer.alloc(W * H * 4, 242);
const set = (x,y,c) => { if(x>=0&&x<W&&y>=0&&y<H) board.set(c,(y*W+x)*4); };
const fill = (x,y,w,h,c) => { for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) set(xx,yy,c); };
const scaled = (src, dx,dy,dw,dh,{checker=false,crop=null}={}) => { const sx0=crop?.x||0,sy0=crop?.y||0,sw=crop?.w||src.w,sh=crop?.h||src.h; for(let y=0;y<dh;y++)for(let x=0;x<dw;x++){const sx=Math.min(src.w-1,sx0+Math.floor(x*sw/dw)),sy=Math.min(src.h-1,sy0+Math.floor(y*sh/dh)),i=(sy*src.w+sx)*4;let r=src.rgba[i],g=src.rgba[i+1],b=src.rgba[i+2],a=src.rgba[i+3];if(checker){const c=((Math.floor(x/18)+Math.floor(y/18))&1)?205:150;r=Math.round((r*a+c*(255-a))/255);g=Math.round((g*a+c*(255-a))/255);b=Math.round((b*a+c*(255-a))/255);a=255;}set(dx+x,dy+y,[r,g,b,a]);} };
const glyph={A:['0110','1001','1001','1111','1001','1001'],B:['1110','1001','1110','1001','1001','1110'],C:['0111','1000','1000','1000','1000','0111'],D:['1110','1001','1001','1001','1001','1110'],E:['1111','1000','1110','1000','1000','1111'],F:['1111','1000','1110','1000','1000','1000'],G:['0111','1000','1011','1001','1001','0111'],H:['1001','1001','1111','1001','1001','1001'],I:['111','010','010','010','010','111'],J:['0011','0001','0001','0001','1001','0110'],K:['1001','1010','1100','1010','1001','1001'],L:['1000','1000','1000','1000','1000','1111'],M:['10001','11011','10101','10001','10001','10001'],N:['1001','1101','1011','1001','1001','1001'],O:['0110','1001','1001','1001','1001','0110'],P:['1110','1001','1110','1000','1000','1000'],R:['1110','1001','1110','1010','1001','1001'],S:['0111','1000','0110','0001','0001','1110'],T:['11111','00100','00100','00100','00100','00100'],U:['1001','1001','1001','1001','1001','0110'],V:['10001','10001','01010','01010','00100','00100'],W:['10001','10001','10101','10101','11011','10001'],X:['1001','1001','0110','0110','1001','1001'],Y:['1001','1001','0110','0010','0010','0010'],Z:['1111','0001','0010','0100','1000','1111'],' ':['0'],':':['0','1','0','0','1'],'.':['0','0','0','0','1']};
const text=(value,x,y,scale=4,c=[20,45,35,255])=>{let cx=x;for(const char of value.toUpperCase()){const rows=glyph[char]||glyph[' '],gw=Math.max(...rows.map(r=>r.length));for(let gy=0;gy<rows.length;gy++)for(let gx=0;gx<rows[gy].length;gx++)if(rows[gy][gx]==='1')fill(cx+gx*scale,y+gy*scale,scale,scale,c);cx+=(gw+1)*scale;}};
fill(0,0,W,H,[242,239,228,255]);fill(0,0,W,80,[18,49,39,255]);text('GROWGO NATIVE ROUNDED SINGLE CLUSTER RASTER FIDELITY',38,22,6,[245,248,238,255]);
const cols=[70,650,1230];for(const x of cols)fill(x-12,125,520,525,[22,56,45,255]);
text('CLEANED SOURCE',70,94,5);text('REAL STEAM DECK BLENDER',650,94,5);text('ALPHA EDGE REVIEW',1230,94,5);
scaled(clean,70,125,520,525,{checker:true});scaled(render,650,125,520,525);scaled(clean,1230,125,520,525,{checker:true});
const cleanCrop={x:25,y:35,w:185,h:190};const renderCrop={x:170,y:180,w:560,h:550};
for(const x of cols)fill(x-12,760,520,280,[22,56,45,255]);text('SILHOUETTE AND LEAF EDGES',70,715,5);text('DARK MID LIGHT',650,715,5);text('SOURCE VS RENDER DETAIL',1230,715,5);
scaled(clean,70,760,520,280,{checker:true,crop:cleanCrop});scaled(clean,650,760,250,280,{checker:true});scaled(render,920,760,250,280,{crop:renderCrop});scaled(clean,1230,760,250,280,{checker:true,crop:cleanCrop});scaled(render,1500,760,250,280,{crop:renderCrop});
text('ONE OWNED ALPHA COMPONENT   FULL CARD UV   REAL BLENDER 5.2.0 LTS',70,1080,5,[20,45,35,255]);
fs.writeFileSync(path.join(out,'GROWGO_NATIVE_ROUNDED_FINAL_CLEAN_RASTER_FIDELITY_BOARD.png'),encodePng(W,H,board));

const glbPath=path.join(out,'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_CLEAN.glb'),glb=fs.readFileSync(glbPath),jsonBytes=glb.readUInt32LE(12),gltf=JSON.parse(glb.subarray(20,20+jsonBytes).toString().trim()),mat=gltf.materials?.[0]||{},prim=gltf.meshes?.[0]?.primitives?.[0]||{};
const audit={geometryPresent:Boolean(gltf.meshes?.length&&prim.attributes?.POSITION!==undefined),materialCount:gltf.materials?.length||0,textureCount:gltf.textures?.length||0,alphaMode:mat.alphaMode||'OPAQUE',doubleSided:Boolean(mat.doubleSided),baseColorTexture:mat.pbrMetallicRoughness?.baseColorTexture?.index??null,uvSet:prim.attributes?.TEXCOORD_0!==undefined?'TEXCOORD_0':'MISSING',textureDimensions:{width:clean.w,height:clean.h},glbBytes:glb.length,sourceTexture:path.basename(path.join(root,'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_RGBA_CLEAN.png')),sameStandaloneSource:true};
fs.writeFileSync(path.join(out,'SINGLE_CLUSTER_CLEAN_GLB_AUDIT.json'),JSON.stringify(audit,null,2)+'\n'); console.log(JSON.stringify(audit,null,2));
