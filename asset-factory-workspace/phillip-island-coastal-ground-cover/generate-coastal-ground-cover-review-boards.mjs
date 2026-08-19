import fs from 'node:fs';
import path from 'node:path';
import {decodePng, encodePng} from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root=path.resolve('asset-factory-workspace/phillip-island-coastal-ground-cover');
const outputRoot=path.join(root,'worker-output');
const referencePath='/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-807f0633-cb3b-4530-89bd-39c0432e416c.png';
const packageSpec=JSON.parse(fs.readFileSync(path.join(root,'worker','COASTAL_GROUND_COVER_WORKER_PACKAGE.json')));
const referencePanels=[
  [18,129,238,255], [267,129,242,255], [521,129,240,255],
  [773,129,240,255], [1025,129,239,255], [1276,129,241,255],
];

function paint(canvas,width,x,y,r,g,b,a=255){
  if(x<0||y<0||x>=width||y>=canvas.length/(width*4)) return;
  const i=(y*width+x)*4; canvas[i]=r; canvas[i+1]=g; canvas[i+2]=b; canvas[i+3]=a;
}
function fill(canvas,width,x,y,w,h,colour){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)paint(canvas,width,xx,yy,...colour);}
function frame(canvas,width,x,y,w,h,colour){for(let xx=x;xx<x+w;xx++){paint(canvas,width,xx,y,...colour);paint(canvas,width,xx,y+h-1,...colour);}for(let yy=y;yy<y+h;yy++){paint(canvas,width,x,yy,...colour);paint(canvas,width,x+w-1,yy,...colour);}}
function scaleInto(canvas,width,dstX,dstY,dstW,dstH,image,source={x:0,y:0,w:image.w,h:image.h}){
  for(let y=0;y<dstH;y++)for(let x=0;x<dstW;x++){
    const sx=Math.min(source.x+source.w-1,source.x+Math.floor(x/dstW*source.w));
    const sy=Math.min(source.y+source.h-1,source.y+Math.floor(y/dstH*source.h));
    const si=(sy*image.w+sx)*4,di=((dstY+y)*width+dstX+x)*4;
    image.rgba.copy(canvas,di,si,si+4);
  }
}

const reference=decodePng(referencePath);
const boardWidth=1200, boardHeight=640, padding=28, panelWidth=544, panelHeight=544;
const boardResults=[];
for(let index=0;index<packageSpec.targets.length;index++){
  const target=packageSpec.targets[index];
  const destination=path.join(outputRoot,`${target.assetId}@1.0.0`);
  const renderPath=path.join(destination,'ASSET_REVIEW_FRONT.png');
  const render=decodePng(renderPath);
  const rgba=Buffer.alloc(boardWidth*boardHeight*4);
  fill(rgba,boardWidth,0,0,boardWidth,boardHeight,[243,239,225,255]);
  fill(rgba,boardWidth,18,18,boardWidth-36,50,[31,45,40,255]);
  // The narrow green bars identify source (left) and Blender candidate (right) without altering either image.
  fill(rgba,boardWidth,padding,padding+65,panelWidth,8,[113,133,47,255]);
  fill(rgba,boardWidth,padding+panelWidth+56,padding+65,panelWidth,8,[46,111,81,255]);
  const crop=referencePanels[index];
  scaleInto(rgba,boardWidth,padding,padding+85,panelWidth,panelHeight,reference,{x:crop[0],y:crop[1],w:crop[2],h:crop[3]});
  scaleInto(rgba,boardWidth,padding+panelWidth+56,padding+85,panelWidth,panelHeight,render);
  frame(rgba,boardWidth,padding,padding+85,panelWidth,panelHeight,[75,75,65,255]);
  frame(rgba,boardWidth,padding+panelWidth+56,padding+85,panelWidth,panelHeight,[75,75,65,255]);
  const boardPath=path.join(destination,'REFERENCE_COMPARISON_BOARD.png');
  fs.writeFileSync(boardPath,encodePng(boardWidth,boardHeight,rgba));
  boardResults.push({assetId:target.assetId,boardPath});
}
fs.writeFileSync(path.join(root,'COASTAL_GROUND_COVER_REVIEW_BOARDS.json'),JSON.stringify({referencePath,boardContract:'left=locked approved reference crop; right=Steam Deck Blender front render; green bars distinguish source and candidate',boards:boardResults},null,2)+'\n');
