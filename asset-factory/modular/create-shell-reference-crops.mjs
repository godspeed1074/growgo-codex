import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const source = path.join(root, 'test-output/visible-facade-sanity/SHOP_REFERENCE_VISIBLE_FACADE.png');
const out = path.join(root, 'test-output/shell-reference-crops');
fs.mkdirSync(out, { recursive: true });
const src = decodePng(source);
const boxes = {
  WALL_LEFT: [28, 155, 125, 515], WALL_CENTRE: [275, 258, 612, 518], WALL_RIGHT: [560, 155, 645, 515],
  WALL_TOP_LEFT: [25, 12, 150, 178], WALL_TOP_RIGHT: [610, 12, 735, 178],
  FOUNDATION_LEFT: [12, 495, 126, 592], FOUNDATION_ENTRANCE: [280, 495, 610, 592], FOUNDATION_RIGHT: [548, 495, 618, 592],
  UPPER_CORNER_TRIM_LEFT: [28, 125, 112, 210], UPPER_CORNER_TRIM_RIGHT: [648, 125, 738, 210],
  FASCIA_TO_WALL_TRANSITION: [25, 145, 735, 190], AWNING_MOUNTING_REGION: [55, 160, 705, 285]
};
const hero = [[110, 255, 292, 568], [292, 255, 595, 515], [50, 165, 710, 262], [585, 380, 744, 595], [20, 585, 744, 670]];
function inBox(x,y,b){return x>=b[0]&&x<b[2]&&y>=b[1]&&y<b[3]}
for (const [name, box] of Object.entries(boxes)) {
  const rgba = Buffer.alloc(src.w*src.h*4, 0);
  for (let y=box[1]; y<box[3]; y++) for (let x=box[0]; x<box[2]; x++) {
    const p=(y*src.w+x)*4, r=src.rgba[p],g=src.rgba[p+1],b=src.rgba[p+2];
    const nearWhite=r>235&&g>235&&b>235;
    if (nearWhite || hero.some(h=>inBox(x,y,h))) continue;
    rgba[p]=r; rgba[p+1]=g; rgba[p+2]=b; rgba[p+3]=255;
  }
  fs.writeFileSync(path.join(out, `${name}.png`), encodePng(src.w, src.h, rgba));
}
// A white-backed composite is used only as the shell presentation layer. The
// hero regions are explicitly cleared so the protected calibrated artwork is
// still the sole authority for Door/Window/Awning/Fascia/Shrub.
const comp=Buffer.alloc(src.w*src.h*4,255);
for(let y=0;y<590;y++)for(let x=0;x<src.w;x++){
  const inFacade=x>=16&&x<744&&y>=10&&y<590&&!hero.some(h=>inBox(x,y,h));
  if(!inFacade)continue;
  const p=(y*src.w+x)*4;comp[p]=src.rgba[p];comp[p+1]=src.rgba[p+1];comp[p+2]=src.rgba[p+2];comp[p+3]=255;
}
fs.writeFileSync(path.join(out,'SHELL_COMPOSITE.png'),encodePng(src.w,src.h,comp));
boxes.SHELL_COMPOSITE=[16,10,744,590];
fs.writeFileSync(path.join(root,'asset-factory/modular/SHOP_SHELL_REFERENCE_CROPS.json'), JSON.stringify({source, dimensions:[src.w,src.h], crops:Object.fromEntries(Object.entries(boxes).map(([name,box])=>[name,{file:`test-output/shell-reference-crops/${name}.png`,sourceBox:box,alphaMode:'STRAIGHT_RGBA',heroProtected:true}]))},null,2));
