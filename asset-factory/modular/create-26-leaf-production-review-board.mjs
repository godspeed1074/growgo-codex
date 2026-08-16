import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const targetPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const fullDir = path.join(root, 'test-output/plant-26-leaf-production/full');
const target = decodePng(targetPath);
const beauty = decodePng(path.join(fullDir, 'PLANT_26LEAF_TARGETSPECIFIC_FRONT.png'));
const component = decodePng(path.join(fullDir, 'PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png'));
const wire = decodePng(path.join(fullDir, 'PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png'));
const targetIds = decodePng(path.join(workspaceRoot, 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png'));
const BW = 2400, BH = 2300, PW = 760, PH = 500, GAP = 20;
const board = Buffer.alloc(BW * BH * 4, 246);
for (let i = 0; i < board.length; i += 4) { board[i] = 246; board[i + 1] = 245; board[i + 2] = 241; board[i + 3] = 255; }
function fit(im, w, h) {
  const out = Buffer.alloc(w * h * 4, 250), scale = Math.min(w / im.w, h / im.h);
  const nw = Math.max(1, Math.floor(im.w * scale)), nh = Math.max(1, Math.floor(im.h * scale));
  const ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = Math.min(im.w - 1, Math.floor(x / scale)), sy = Math.min(im.h - 1, Math.floor(y / scale));
    const s = (sy * im.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w, h, rgba: out };
}
function crop(im, y0, y1) {
  const h = Math.max(1, y1 - y0), out = Buffer.alloc(im.w * h * 4, 250);
  for (let y = 0; y < h; y++) for (let x = 0; x < im.w; x++) {
    const sy = Math.min(im.h - 1, Math.max(0, y0 + y)), s = (sy * im.w + x) * 4, d = (y * im.w + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w: im.w, h, rgba: out };
}
function blend(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 250);
  for (let i = 0; i < out.length; i += 4) { out[i] = Math.round(a.rgba[i] * .5 + b.rgba[i] * .5); out[i + 1] = Math.round(a.rgba[i + 1] * .5 + b.rgba[i + 1] * .5); out[i + 2] = Math.round(a.rgba[i + 2] * .5 + b.rgba[i + 2] * .5); out[i + 3] = 255; }
  return { w: a.w, h: a.h, rgba: out };
}
function difference(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 255);
  for (let i = 0; i < out.length; i += 4) { out[i] = Math.abs(a.rgba[i] - b.rgba[i]); out[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]); out[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); out[i + 3] = 255; }
  return { w: a.w, h: a.h, rgba: out };
}
function paste(im, x, y) { for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * BW + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4); }
function frame(x, y, w, h) { for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 70; } for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 70; } }
const panels = [
  ['EXACT TARGET CROP', target], ['FINAL BLENDER FRONT', beauty], ['50% OVERLAY', blend(target, beauty)],
  ['DIFFERENCE VIEW', difference(target, beauty)], ['TARGET LEAF-ID MAP', targetIds], ['BLENDER COMPONENT-ID MAP', component],
  ['WIREFRAME FRONT', wire], ['UPPER CLOSEUP', crop(beauty, 20, 105)], ['MIDDLE CLOSEUP', crop(beauty, 85, 175)], ['LOWER CLOSEUP', crop(beauty, 150, 261)]
];
const positions = panels.map((p, i) => ({ label: p[0], x: (i % 3) * (PW + GAP) + GAP, y: Math.floor(i / 3) * (PH + 55) + 40, width: PW, height: PH }));
for (let i = 0; i < panels.length; i++) { const pos = positions[i]; paste(fit(panels[i][1], PW, PH), pos.x, pos.y); frame(pos.x, pos.y, PW, PH); }
const out = path.join(root, 'asset-factory/modular/PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.png');
fs.writeFileSync(out, encodePng(BW, BH, board));
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.json'), JSON.stringify({ status: 'PASS_BOARD_CREATED', sourceTarget: targetPath, panels: positions, geometryOnly: true, referenceTextureUsedInBeauty: false, referencePlaneVisible: false, depthPerformed: false, flowersFinal: false, planterFinal: false }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS_BOARD_CREATED', output: out, panels: positions }, null, 2));
