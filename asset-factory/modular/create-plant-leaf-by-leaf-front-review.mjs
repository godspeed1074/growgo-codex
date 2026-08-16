import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const refPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const outDir = path.join(workspaceRoot, 'test-output/plant-leaf-by-leaf-front');
const target = decodePng(refPath);
const front = decodePng(path.join(outDir, 'output/PLANT_LEAF_BY_LEAF_FRONT.png'));
const ids = decodePng(path.join(outDir, 'output/PLANT_LEAF_ID_RENDER.png'));
const annotation = decodePng(path.join(workspaceRoot, 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png'));

const W = 1800, H = 1100, panelW = 560, panelH = 470;
const board = Buffer.alloc(W * H * 4, 245);

function fit(im, w, h) {
  const out = Buffer.alloc(w * h * 4, 248);
  const scale = Math.min(w / im.w, h / im.h);
  const nw = Math.max(1, Math.floor(im.w * scale));
  const nh = Math.max(1, Math.floor(im.h * scale));
  const ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = Math.min(im.w - 1, Math.floor(x / scale));
    const sy = Math.min(im.h - 1, Math.floor(y / scale));
    const s = (sy * im.w + sx) * 4;
    const d = ((oy + y) * w + ox + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w, h, rgba: out };
}

function blend(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 248);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.round(a.rgba[i] * 0.5 + b.rgba[i] * 0.5);
    out[i + 1] = Math.round(a.rgba[i + 1] * 0.5 + b.rgba[i + 1] * 0.5);
    out[i + 2] = Math.round(a.rgba[i + 2] * 0.5 + b.rgba[i + 2] * 0.5);
    out[i + 3] = 255;
  }
  return { w: a.w, h: a.h, rgba: out };
}

function paste(im, x, y) {
  for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * W + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4);
}

const targetFit = fit(target, panelW, panelH);
const frontFit = fit(front, panelW, panelH);
const overlay = blend(targetFit, frontFit);
const annotationFit = fit(annotation, panelW, panelH);
const idsFit = fit(ids, panelW, panelH);
paste(targetFit, 40, 55);
paste(frontFit, 620, 55);
paste(overlay, 1200, 55);
paste(annotationFit, 330, 565);
paste(idsFit, 910, 565);

// Thin panel dividers keep the review board legible without altering the
// source images or asserting a pass/fail score in the pixels.
for (let x = 0; x < W; x++) for (const y of [40, 535, 1040]) {
  const d = (y * W + x) * 4; board[d] = 80; board[d + 1] = 80; board[d + 2] = 80; board[d + 3] = 255;
}
for (let y = 40; y < 1040; y++) for (const x of [20, 600, 1180, 1780]) {
  const d = (y * W + x) * 4; board[d] = 80; board[d + 1] = 80; board[d + 2] = 80; board[d + 3] = 255;
}

const output = path.join(root, 'asset-factory/modular/PLANT_LEAF_BY_LEAF_FRONT_REVIEW.png');
fs.writeFileSync(output, encodePng(W, H, board));
console.log(JSON.stringify({ status: 'PASS_REVIEW_BOARD_CREATED', output, panels: ['TARGET_CROP', 'BLENDER_FRONT', 'FIFTY_PERCENT_OVERLAY', 'TARGET_LEAF_ID_ANNOTATION', 'BLENDER_LEAF_ID_RENDER'] }, null, 2));
