import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(process.cwd(), 'asset-factory-workspace/phillip-island-tree-proof');
const beforeDir = path.join(root, 'rich-v4-output');
const afterDir = path.join(root, 'rich-v4-top-corrected-output');
const before = decodePng(path.join(beforeDir, 'TREE_NATIVE_ROUNDED_001_V4_RICH_GAMEPLAY_CAMERA.png'));
const after = decodePng(path.join(afterDir, 'TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_GAMEPLAY.png'));
const beforeReceipt = JSON.parse(fs.readFileSync(path.join(beforeDir, 'TREE_NATIVE_ROUNDED_001_V4_RICH_RECEIPT.json')));
const afterReceipt = JSON.parse(fs.readFileSync(path.join(afterDir, 'TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_RECEIPT.json')));

const W = 1800, H = 1080, board = Buffer.alloc(W * H * 4, 255);
const px = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) board.set(c, (y * W + x) * 4); };
const fill = (x, y, w, h, c) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c); };
const draw = (src, dx, dy, dw, dh, crop = {x: 0, y: 0, w: src.w, h: src.h}) => {
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.min(src.w - 1, crop.x + Math.floor(x * crop.w / dw));
    const sy = Math.min(src.h - 1, crop.y + Math.floor(y * crop.h / dh));
    const i = (sy * src.w + sx) * 4; px(dx + x, dy + y, [src.rgba[i], src.rgba[i + 1], src.rgba[i + 2], src.rgba[i + 3]]);
  }
};
const font = {A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01110'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','11110','00001','00001','10001','01110'],'6':['01110','10000','11110','10001','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],':':['00000','00100','00100','00000','00100','00100','00000'],'-':['00000','00000','00000','11111','00000','00000','00000'],' ':['00000','00000','00000','00000','00000','00000','00000']};
const text = (s, x, y, scale = 3, c = [244, 239, 218, 255]) => { for (const ch of s) { const glyph = font[ch] || font[' ']; glyph.forEach((row, yy) => [...row].forEach((v, xx) => { if (v === '1') fill(x + xx * scale, y + yy * scale, scale, scale, c); })); x += 6 * scale; } };
fill(0, 0, W, H, [236, 231, 211, 255]); fill(0, 0, W, 90, [18, 54, 41, 255]);
text('UPPER CROWN LEAF SCALE - V4 COMPARISON', 55, 25, 5);
text('BEFORE: OVERSIZED BRIGHT TOP LEAVES', 70, 120, 4, [40, 40, 40, 255]); text('AFTER: SMALLER MIXED LEAF TOP CLUSTER', 960, 120, 4, [40, 40, 40, 255]);
draw(before, 50, 170, 800, 450); draw(after, 950, 170, 800, 450);
// The crops intentionally include the same 0..55% of the locked gameplay render.
text('TOP CROWN CLOSE CROP', 70, 670, 4, [40, 40, 40, 255]); text('TOP CROWN CLOSE CROP', 960, 670, 4, [40, 40, 40, 255]);
draw(before, 50, 720, 800, 300, {x: 260, y: 0, w: 760, h: 390}); draw(after, 950, 720, 800, 300, {x: 260, y: 0, w: 760, h: 390});
text('SOURCE 2  4.50 X 5.20  BRIGHT LARGE LEAVES', 70, 1035, 3, [85, 45, 25, 255]); text('SOURCE 1  4.20 X 5.15  MIXED SMALLER LEAVES', 960, 1035, 3, [22, 82, 50, 255]);
fs.writeFileSync(path.join(afterDir, 'TREE_NATIVE_ROUNDED_001_V4_TOP_LEAF_COMPARISON.png'), encodePng(W, H, board));
const performance = {assetId: 'TREE_NATIVE_ROUNDED_001', state: 'REVIEW_CANDIDATE', correction: afterReceipt.upperCrownCorrection, before: beforeReceipt.lods, after: afterReceipt.lods, costNeutral: Object.keys(beforeReceipt.lods).every(k => ['cards','triangles','materials','textures'].every(x => beforeReceipt.lods[k][x] === afterReceipt.lods[k][x])), glbBytesDelta: Object.fromEntries(Object.keys(beforeReceipt.lods).map(k => [k, afterReceipt.lods[k].glbBytes - beforeReceipt.lods[k].glbBytes])), protected: {carcassUnchanged: afterReceipt.carcassReused, sourceUnchanged: afterReceipt.approvedSource === beforeReceipt.approvedSource, cameraUnchanged: afterReceipt.cameraContract === beforeReceipt.cameraContract}};
fs.writeFileSync(path.join(afterDir, 'TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_PERFORMANCE.json'), JSON.stringify(performance, null, 2) + '\n');
console.log(JSON.stringify(performance, null, 2));
