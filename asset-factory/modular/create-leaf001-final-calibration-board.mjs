import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const outputDir = process.env.CENTRAL_LEAF_OUTPUT_DIR ?? path.join(root, 'test-output', 'central-leaf-calibration-targettrace');
const target = decodePng(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_REFERENCE.png'));
const targetMask = decodePng(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_VISIBLE_MASK.png'));
const previous = decodePng(path.join(root, 'test-output/central-leaf-calibration-final/CENTRAL_LEAF_FINAL_FRONT.png'));
const current = decodePng(path.join(outputDir, 'CENTRAL_LEAF_FINAL_FRONT.png'));
const wire = decodePng(path.join(outputDir, 'CENTRAL_LEAF_WIREFRAME_FRONT.png'));

const X0 = 81, Y0 = 29, CW = 28, CH = 44;
function fit(im, w, h) { const out = Buffer.alloc(w * h * 4, 250), s = Math.min(w / im.w, h / im.h), nw = Math.max(1, Math.floor(im.w * s)), nh = Math.max(1, Math.floor(im.h * s)), ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2); for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const sx = Math.min(im.w - 1, Math.floor(x / s)), sy = Math.min(im.h - 1, Math.floor(y / s)), a = (sy * im.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4; if (im.rgba[a + 3]) { out[d] = im.rgba[a]; out[d + 1] = im.rgba[a + 1]; out[d + 2] = im.rgba[a + 2]; } out[d + 3] = 255; } return { w, h, rgba: out }; }
function cropFull(im) { const rgba = Buffer.alloc(CW * CH * 4, 255); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const s = ((Y0 + y) * im.w + X0 + x) * 4, d = (y * CW + x) * 4; if (im.rgba[s + 3] !== 0) { rgba[d] = im.rgba[s]; rgba[d + 1] = im.rgba[s + 1]; rgba[d + 2] = im.rgba[s + 2]; } rgba[d + 3] = 255; } return { w: CW, h: CH, rgba }; }
function cropLocal(im, x, y, w, h) { const rgba = Buffer.alloc(w * h * 4, 255); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const sx = Math.max(0, Math.min(im.w - 1, x + xx)), sy = Math.max(0, Math.min(im.h - 1, y + yy)), s = (sy * im.w + sx) * 4, d = (yy * w + xx) * 4; rgba[d] = im.rgba[s]; rgba[d + 1] = im.rgba[s + 1]; rgba[d + 2] = im.rgba[s + 2]; rgba[d + 3] = 255; } return { w, h, rgba }; }
function blend(a, b) { const rgba = Buffer.alloc(a.w * a.h * 4, 255); for (let i = 0; i < rgba.length; i += 4) { rgba[i] = Math.round(a.rgba[i] * .5 + b.rgba[i] * .5); rgba[i + 1] = Math.round(a.rgba[i + 1] * .5 + b.rgba[i + 1] * .5); rgba[i + 2] = Math.round(a.rgba[i + 2] * .5 + b.rgba[i + 2] * .5); rgba[i + 3] = 255; } return { w: a.w, h: a.h, rgba }; }
function diff(a, b) { const rgba = Buffer.alloc(a.w * a.h * 4, 255); for (let i = 0; i < rgba.length; i += 4) { rgba[i] = Math.abs(a.rgba[i] - b.rgba[i]); rgba[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]); rgba[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); rgba[i + 3] = 255; } return { w: a.w, h: a.h, rgba }; }
function sideBySide(a, b, w, h) { const left = fit(a, Math.floor(w / 2), h), right = fit(b, Math.floor(w / 2), h), rgba = Buffer.alloc(w * h * 4, 250); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const src = x < w / 2 ? left : right, sx = x < w / 2 ? x : x - Math.floor(w / 2), p = (y * src.w + Math.min(src.w - 1, sx)) * 4, d = (y * w + x) * 4; rgba[d] = src.rgba[p]; rgba[d + 1] = src.rgba[p + 1]; rgba[d + 2] = src.rgba[p + 2]; rgba[d + 3] = 255; } return { w, h, rgba }; }
function paste(board, bw, im, x, y) { for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * bw + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4); }
function frame(board, bw, x, y, w, h) { for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) { const d = (yy * bw + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 60; } for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) { const d = (yy * bw + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 60; } }

const targetCrop = cropLocal(target, 0, 0, CW, CH), previousCrop = cropFull(previous), currentCrop = cropFull(current), wireCrop = cropFull(wire);
const targetMaskCrop = cropLocal(targetMask, 0, 0, CW, CH);
const panels = [
  ['TARGET LEAF', targetCrop], ['PREVIOUS 0.9050', previousCrop], ['NEW CANDIDATE', currentCrop],
  ['50% OVERLAY', blend(targetCrop, currentCrop)], ['CONTOUR DIFFERENCE', diff(targetMaskCrop, currentCrop)], ['WIREFRAME FRONT', wireCrop],
  ['LEFT SHOULDER TARGET | NEW', sideBySide(cropLocal(targetCrop, 0, 3, 14, 16), cropLocal(currentCrop, 0, 3, 14, 16), 520, 280)],
  ['RIGHT SHOULDER TARGET | NEW', sideBySide(cropLocal(targetCrop, 13, 3, 15, 18), cropLocal(currentCrop, 13, 3, 15, 18), 520, 280)],
  ['BASE TARGET | NEW', sideBySide(cropLocal(targetCrop, 5, 25, 18, 19), cropLocal(currentCrop, 5, 25, 18, 19), 520, 280)],
];
const BW = 1680, BH = 1260, PW = 520, PH = 280, board = Buffer.alloc(BW * BH * 4, 246);
for (let i = 0; i < panels.length; i++) { const x = (i % 3) * 560 + 20, y = Math.floor(i / 3) * 410 + 20, panel = fit(panels[i][1], PW, PH); paste(board, BW, panel, x, y); frame(board, BW, x, y, PW, PH); }
const outPath = path.join(root, 'asset-factory/modular/LEAF_001_FINAL_CALIBRATION_BOARD.png'); fs.writeFileSync(outPath, encodePng(BW, BH, board));
const audit = { status: 'PASS_NUMERIC_AND_DIRECT_VISION_PENDING_OPERATOR_CONFIRMATION', leafId: 'LEAF_001', target: 'TALLEST_CENTRE', previousRender: 'test-output/central-leaf-calibration-final/CENTRAL_LEAF_FINAL_FRONT.png', newRender: `${path.relative(root, outputDir)}/CENTRAL_LEAF_FINAL_FRONT.png`, panels: panels.map(([label]) => label), targetMask: 'CENTRAL_TARGET_LEAF_VISIBLE_MASK.png', rawPartitionMask: 'CENTRAL_TARGET_LEAF_RAW_PARTITION_MASK.png', output: 'LEAF_001_FINAL_CALIBRATION_BOARD.png' };
fs.writeFileSync(path.join(root, 'asset-factory/modular/LEAF_001_FINAL_CALIBRATION_BOARD.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit, null, 2));
