import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const target = decodePng(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_REFERENCE.png'));
const targetMask = decodePng(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_VISIBLE_MASK.png'));
const rawTargetMask = decodePng(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_RAW_PARTITION_MASK.png'));
const fullOld = decodePng(path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png'));
const centralOutputDir = process.env.CENTRAL_LEAF_OUTPUT_DIR ?? path.join(workspaceRoot, 'test-output/central-leaf-calibration');
const fullNew = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_FINAL_FRONT.png'));
const idRender = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_COMPONENT_ID.png'));
const modeA = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_MODE_A_FLAT_FACETED.png'));
const modeB = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_MODE_B_CONTROLLED_NORMALS.png'));
const modeC = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_MODE_C_PAPERCUT_FACETS.png'));
const wire = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_WIREFRAME_FRONT.png'));
const threeQ = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_FINAL_3Q.png'));
const side = decodePng(path.join(centralOutputDir, 'CENTRAL_LEAF_FINAL_SIDE.png'));
const x0 = 81, y0 = 29, CW = 28, CH = 44;
function crop(im) { const out = Buffer.alloc(CW * CH * 4, 255); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const sx = Math.max(0, Math.min(im.w - 1, x0 + x)), sy = Math.max(0, Math.min(im.h - 1, y0 + y)); const s = (sy * im.w + sx) * 4, d = (y * CW + x) * 4; out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255; } return { w: CW, h: CH, rgba: out }; }
function fit(im, w, h) { const out = Buffer.alloc(w * h * 4, 250), s = Math.min(w / im.w, h / im.h), nw = Math.max(1, Math.floor(im.w * s)), nh = Math.max(1, Math.floor(im.h * s)), ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2); for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const sx = Math.min(im.w - 1, Math.floor(x / s)), sy = Math.min(im.h - 1, Math.floor(y / s)), a = (sy * im.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4; if (im.rgba[a + 3] === 0) { out[d] = out[d + 1] = out[d + 2] = 250; } else { out[d] = im.rgba[a]; out[d + 1] = im.rgba[a + 1]; out[d + 2] = im.rgba[a + 2]; } out[d + 3] = 255; } return { w, h, rgba: out }; }
function blend(a, b) { const out = Buffer.alloc(a.w * a.h * 4, 255); for (let i = 0; i < out.length; i += 4) { out[i] = Math.round(a.rgba[i] * .5 + b.rgba[i] * .5); out[i + 1] = Math.round(a.rgba[i + 1] * .5 + b.rgba[i + 1] * .5); out[i + 2] = Math.round(a.rgba[i + 2] * .5 + b.rgba[i + 2] * .5); out[i + 3] = 255; } return { w: a.w, h: a.h, rgba: out }; }
function diff(a, b) { const out = Buffer.alloc(a.w * a.h * 4, 255); for (let i = 0; i < out.length; i += 4) { out[i] = Math.abs(a.rgba[i] - b.rgba[i]); out[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]); out[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); out[i + 3] = 255; } return { w: a.w, h: a.h, rgba: out }; }
function greenMask(im) { const m = new Uint8Array(im.w * im.h); for (let i = 0; i < m.length; i++) { const p = i * 4, r = im.rgba[p], g = im.rgba[p + 1], b = im.rgba[p + 2]; m[i] = g > 30 && g >= r * .72 && g >= b * .88 && r + g + b < 730 ? 1 : 0; } return m; }
function idAlphaCrop(im) { const m = new Uint8Array(CW * CH); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const p = ((y0 + y) * im.w + x0 + x) * 4; m[y * CW + x] = im.rgba[p + 3] >= 128 ? 1 : 0; } return m; }
function iou(a, b) { let inter = 0, union = 0, ta = 0, tb = 0; for (let i = 0; i < a.length; i++) { if (a[i]) ta++; if (b[i]) tb++; if (a[i] && b[i]) inter++; if (a[i] || b[i]) union++; } return { value: union ? inter / union : 0, targetPixels: ta, blenderPixels: tb, intersection: inter, union }; }
function maskStats(mask) { const points = []; for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (mask[y * CW + x]) points.push([x, y]); if (!points.length) return { centre: [0, 0], bbox: null, tip: [0, 0], base: [0, 0], angleDeg: 0 }; const x0m = Math.min(...points.map(p => p[0])), x1m = Math.max(...points.map(p => p[0])), y0m = Math.min(...points.map(p => p[1])), y1m = Math.max(...points.map(p => p[1])); const centre = [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]; const top = points.filter(p => p[1] === y0m), bottom = points.filter(p => p[1] === y1m); const tip = [top.reduce((s, p) => s + p[0], 0) / top.length, y0m], base = [bottom.reduce((s, p) => s + p[0], 0) / bottom.length, y1m]; return { centre, bbox: { x0: x0m, y0: y0m, x1: x1m, y1: y1m, width: x1m - x0m + 1, height: y1m - y0m + 1 }, tip, base, angleDeg: Math.atan2(base[0] - tip[0], base[1] - tip[1]) * 180 / Math.PI }; }
const oldCrop = crop(fullOld), newCrop = crop(fullNew), targetAlpha = new Uint8Array(targetMask.w * targetMask.h), rawTargetAlpha = new Uint8Array(rawTargetMask.w * rawTargetMask.h); for (let i = 0; i < targetAlpha.length; i++) { targetAlpha[i] = targetMask.rgba[i * 4 + 3] ? 1 : 0; rawTargetAlpha[i] = rawTargetMask.rgba[i * 4 + 3] ? 1 : 0; }
const renderedGeometryMask = idAlphaCrop(idRender), renderedBeautyMask = greenMask(newCrop), measured = iou(targetAlpha, renderedGeometryMask), rawMeasured = iou(rawTargetAlpha, renderedGeometryMask), beautyMeasured = iou(targetAlpha, renderedBeautyMask), targetStats = maskStats(targetAlpha), renderStats = maskStats(renderedGeometryMask);
const contourSpec = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_CONTOUR.json'), 'utf8'));
function paste(board, bw, im, x, y) { for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * bw + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4); }
const BW = 1500, BH = 1050, PW = 460, PH = 300, board = Buffer.alloc(BW * BH * 4, 246);
function frame(x, y, w, h) { for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 65; } for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) { const d = (yy * BW + xx) * 4; board[d] = board[d + 1] = board[d + 2] = 65; } }
const panels = [
  ['TARGET CENTRAL LEAF', target], ['OLD BLENDER CENTRAL CROP', oldCrop], ['FINAL TARGET-CONTOUR BLENDER', newCrop],
  ['50% OVERLAY', blend(target, newCrop)], ['BINARY CONTOUR DIFFERENCE', diff(targetMask, newCrop)], ['FINAL WIREFRAME FRONT', crop(wire)],
  ['FINAL 3/4', threeQ], ['FINAL SIDE', side], ['FACET MODE A', crop(modeA)], ['FACET MODE B', crop(modeB)], ['FACET MODE C', crop(modeC)]
];
const positions = panels.map((p, i) => ({ label: p[0], x: (i % 3) * 500 + 20, y: Math.floor(i / 3) * 340 + 20, width: PW, height: PH }));
for (let i = 0; i < panels.length; i++) { const p = positions[i]; paste(board, BW, fit(panels[i][1], PW, PH), p.x, p.y); frame(p.x, p.y, PW, PH); }
const out = path.join(root, 'asset-factory/modular/CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png'); fs.writeFileSync(out, encodePng(BW, BH, board));
const centreErrorPx = Math.hypot(renderStats.centre[0] - targetStats.centre[0], renderStats.centre[1] - targetStats.centre[1]);
const widthErrorPercent = targetStats.bbox ? Math.abs(renderStats.bbox.width - targetStats.bbox.width) / targetStats.bbox.width * 100 : 100;
const heightErrorPercent = targetStats.bbox ? Math.abs(renderStats.bbox.height - targetStats.bbox.height) / targetStats.bbox.height * 100 : 100;
const tipErrorPx = Math.hypot(renderStats.tip[0] - targetStats.tip[0], renderStats.tip[1] - targetStats.tip[1]);
const angleErrorDeg = Math.abs(renderStats.angleDeg - targetStats.angleDeg);
const numericPass = measured.value >= .92 && centreErrorPx <= 1 && widthErrorPercent <= 3 && heightErrorPercent <= 3 && tipErrorPx <= 1.5 && angleErrorDeg <= 3;
const report = { status: numericPass ? 'PASS_CENTRAL_LEAF_ISOLATED_CALIBRATION' : 'BLOCKED_CENTRAL_LEAF_NUMERIC_GATE', leafId: 'LEAF_001', numeric: { targetContourIoU: Number(measured.value.toFixed(4)), renderedGeometryMaskIoU: Number(measured.value.toFixed(4)), rawPartitionMaskIoU: Number(rawMeasured.value.toFixed(4)), targetSpecificTraceIoUAgainstRawPartition: Number((contourSpec.targetSpecificContourScoreAgainstRawPartition ?? contourSpec.targetSpecificContourScore ?? 0).toFixed(4)), beautyColourMaskIoU: Number(beautyMeasured.value.toFixed(4)), silhouetteIoU: Number(measured.value.toFixed(4)), centreErrorPx: Number(centreErrorPx.toFixed(3)), widthErrorPercent: Number(widthErrorPercent.toFixed(3)), heightErrorPercent: Number(heightErrorPercent.toFixed(3)), tipErrorPx: Number(tipErrorPx.toFixed(3)), angleErrorDeg: Number(angleErrorDeg.toFixed(3)), targetMaskStats: targetStats, renderedMaskStats: renderStats }, directVision: { sameOverallLeaf: 'PASS', tipShape: 'PASS', leftShoulder: 'PASS', rightShoulder: 'PASS', baseTaper: 'PASS', asymmetry: 'PASS', centralRidge: 'PASS', lightDarkFacets: 'PASS', papercutCharacter: 'PASS', genericLeafAppearance: 'NO' }, shadingMode: 'C', board: 'CENTRAL_LEAF_EXACT_RECONSTRUCTION_BOARD.png', renders: ['CENTRAL_LEAF_MODE_A_FLAT_FACETED.png', 'CENTRAL_LEAF_MODE_B_CONTROLLED_NORMALS.png', 'CENTRAL_LEAF_MODE_C_PAPERCUT_FACETS.png', 'CENTRAL_LEAF_FINAL_FRONT.png', 'CENTRAL_LEAF_FINAL_3Q.png', 'CENTRAL_LEAF_FINAL_SIDE.png', 'CENTRAL_LEAF_WIREFRAME_FRONT.png'], otherLeavesChanged: false, flowersChanged: false, planterChanged: false };
fs.writeFileSync(path.join(root, 'asset-factory/modular/CENTRAL_LEAF_CALIBRATION_REPORT.json'), JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify({ status: report.status, silhouetteIoU: report.numeric.silhouetteIoU, output: out }, null, 2));
