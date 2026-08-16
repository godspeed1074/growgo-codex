import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const targetPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const target = decodePng(targetPath);
const outDir = path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only');
const geometry = decodePng(path.join(outDir, 'PLANT_26LEAF_GEOMETRY_FRONT.png'));
const ids = decodePng(path.join(outDir, 'PLANT_26LEAF_COMPONENT_ID.png'));
const annotation = decodePng(path.join(workspaceRoot, 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png'));
const contours = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
const metrics = JSON.parse(fs.readFileSync(path.join(outDir, 'GEOMETRY_LEAF_METRICS.json'), 'utf8')).leafProjection;
const BW = 1500, BH = 1400, PW = 470, PH = 250, GAPX = 20, GAPY = 22;
const board = Buffer.alloc(BW * BH * 4, 246);

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
function crop(im, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4, 250);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.max(0, Math.min(im.w - 1, x0 + x)), sy = Math.max(0, Math.min(im.h - 1, y0 + y));
    const s = (sy * im.w + sx) * 4, d = (y * w + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
  }
  return { w, h, rgba: out };
}
function blend(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 250);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.round(a.rgba[i] * .5 + b.rgba[i] * .5);
    out[i + 1] = Math.round(a.rgba[i + 1] * .5 + b.rgba[i + 1] * .5);
    out[i + 2] = Math.round(a.rgba[i + 2] * .5 + b.rgba[i + 2] * .5); out[i + 3] = 255;
  }
  return { w: a.w, h: a.h, rgba: out };
}
function difference(a, b) {
  const out = Buffer.alloc(a.w * a.h * 4, 255);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = Math.abs(a.rgba[i] - b.rgba[i]); out[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]); out[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); out[i + 3] = 255;
  }
  return { w: a.w, h: a.h, rgba: out };
}
function drawLine(im, x0, y0, x1, y1, colour, width = 1) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let k = 0; k <= steps; k++) {
    const x = Math.round(x0 + (x1 - x0) * k / steps), y = Math.round(y0 + (y1 - y0) * k / steps);
    for (let dy = -width; dy <= width; dy++) for (let dx = -width; dx <= width; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= im.w || yy >= im.h) continue;
      const d = (yy * im.w + xx) * 4; im.rgba[d] = colour[0]; im.rgba[d + 1] = colour[1]; im.rgba[d + 2] = colour[2]; im.rgba[d + 3] = 255;
    }
  }
}
function contourOverlay() {
  const im = { w: target.w, h: target.h, rgba: Buffer.from(target.rgba) };
  const byId = new Map(metrics.map((m) => [m.id, m]));
  for (const c of contours.leaves) {
    const m = byId.get(c.id);
    for (let i = 0; i < c.contourPx.length; i++) {
      const a = c.contourPx[i], b = c.contourPx[(i + 1) % c.contourPx.length]; drawLine(im, a[0], a[1], b[0], b[1], [215, 35, 35], 1);
      const p = m.projectedPolygonPx[i % m.projectedPolygonPx.length], q = m.projectedPolygonPx[(i + 1) % m.projectedPolygonPx.length]; drawLine(im, p[0], p[1], q[0], q[1], [25, 105, 235], 1);
    }
  }
  return im;
}
function paste(im, x, y) {
  for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * BW + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4);
}
function frame(x, y, w, h) {
  for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 65; board[d + 3] = 255; }
  for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 65; board[d + 3] = 255; }
}

const panels = [
  ['TARGET', target], ['FINAL GEOMETRY FRONT', geometry], ['50% OVERLAY', blend(target, geometry)],
  ['DIFF', difference(target, geometry)], ['TARGET LEAF-ID MAP', annotation], ['FINAL COMPONENT IDs', ids],
  ['TARGET / BLENDER CONTOUR OVERLAY', contourOverlay()],
  ['CENTRAL TARGET LEAF', crop(target, 76, 24, 40, 52)], ['CENTRAL BLENDER LEAF', crop(geometry, 76, 24, 40, 52)],
  ['TARGET FLOWERS', crop(target, 14, 138, 164, 34)], ['BLENDER FLOWERS', crop(geometry, 14, 138, 164, 34)],
  ['TARGET PLANTER', crop(target, 0, 168, 189, 93)], ['BLENDER PLANTER', crop(geometry, 0, 168, 189, 93)]
];
const positions = panels.map((p, i) => ({ label: p[0], x: (i % 3) * (PW + GAPX) + 20, y: Math.floor(i / 3) * (PH + GAPY) + 20, width: PW, height: PH }));
for (let i = 0; i < panels.length; i++) { const p = positions[i]; paste(fit(panels[i][1], PW, PH), p.x, p.y); frame(p.x, p.y, PW, PH); }
const out = path.join(root, 'asset-factory/modular/PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.png');
fs.writeFileSync(out, encodePng(BW, BH, board));
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_GEOMETRY_FRONT_FIDELITY_BOARD.json'), JSON.stringify({ status: 'PASS_FRONT_FIDELITY_BOARD_CREATED', sourceTarget: targetPath, panelCount: panels.length, panels }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS_FRONT_FIDELITY_BOARD_CREATED', output: out, panelCount: panels.length }, null, 2));
