import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const outDir = path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only');
const targetPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const target = decodePng(targetPath);
const geometry = decodePng(path.join(outDir, 'PLANT_26LEAF_GEOMETRY_FRONT.png'));
const ids = decodePng(path.join(outDir, 'PLANT_26LEAF_COMPONENT_ID.png'));
const wire = decodePng(path.join(outDir, 'PLANT_26LEAF_WIREFRAME_FRONT.png'));
const annotation = decodePng(path.join(workspaceRoot, 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png'));

const BW = 1800, BH = 1100, PW = 560, PH = 300;
const board = Buffer.alloc(BW * BH * 4, 245);

function fit(im, w, h) {
  const out = Buffer.alloc(w * h * 4, 250);
  const scale = Math.min(w / im.w, h / im.h);
  const nw = Math.max(1, Math.floor(im.w * scale));
  const nh = Math.max(1, Math.floor(im.h * scale));
  const ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = Math.min(im.w - 1, Math.floor(x / scale));
    const sy = Math.min(im.h - 1, Math.floor(y / scale));
    const s = (sy * im.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w, h, rgba: out };
}
function crop(im, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4, 250);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(im.w - 1, Math.max(0, x0 + x));
    const sy = Math.min(im.h - 1, Math.max(0, y0 + y));
    const s = (sy * im.w + sx) * 4, d = (y * w + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w, h, rgba: out };
}
function blend(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 250);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.round(a.rgba[i] * 0.5 + b.rgba[i] * 0.5);
    out[i + 1] = Math.round(a.rgba[i + 1] * 0.5 + b.rgba[i + 1] * 0.5);
    out[i + 2] = Math.round(a.rgba[i + 2] * 0.5 + b.rgba[i + 2] * 0.5);
    out[i + 3] = 255;
  }
  return { w: a.w, h: a.h, rgba: out };
}
function difference(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 255);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.abs(a.rgba[i] - b.rgba[i]);
    out[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]);
    out[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]);
    out[i + 3] = 255;
  }
  return { w: a.w, h: a.h, rgba: out };
}
function paste(im, x, y) {
  for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * BW + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4);
}
function frame(x, y, w, h) {
  for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) {
    const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 70; board[d + 3] = 255;
  }
  for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) {
    const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 70; board[d + 3] = 255;
  }
}

const panels = [
  ['EXACT TARGET CROP', target],
  ['ACTUAL GEOMETRY FRONT', geometry],
  ['50% OVERLAY', blend(target, geometry)],
  ['TARGET LEAF-ID MAP', annotation],
  ['BLENDER COMPONENT-ID MAP', ids],
  ['BLENDER WIREFRAME FRONT', wire],
  ['DIFFERENCE VIEW', difference(target, geometry)],
  ['TARGET FLOWERS CLOSEUP', crop(target, 0, 138, target.w, 48)],
  ['BLENDER FLOWERS CLOSEUP', crop(geometry, 0, 138, geometry.w, 48)]
];
const positions = panels.map((p, i) => ({
  label: p[0], x: (i % 3) * 600 + 20, y: Math.floor(i / 3) * 350 + 25, width: PW, height: PH
}));
for (let i = 0; i < panels.length; i++) {
  const [label, im] = panels[i];
  paste(fit(im, PW, PH), positions[i].x, positions[i].y);
  frame(positions[i].x, positions[i].y, PW, PH);
}
const out = path.join(root, 'asset-factory/modular/PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png');
fs.writeFileSync(out, encodePng(BW, BH, board));
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.json'), JSON.stringify({
  status: 'PASS_BOARD_CREATED',
  sourceTarget: targetPath,
  panels: positions,
  beautyInputs: {
    referenceTextureUsed: false,
    referencePlaneVisible: false,
    foliageCompositeUsed: false,
    bakedTargetFoliageUsed: false
  }
}, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS_BOARD_CREATED', output: out, panels: positions }, null, 2));
