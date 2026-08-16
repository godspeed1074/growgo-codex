import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const statusPath = path.join(root, 'asset-factory/modular/PLANT_26_LEAF_PRODUCTION_STATUS.json');
const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const targetPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const target = decodePng(targetPath);
const beauty = decodePng(path.join(root, 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png'));
const W = target.w, H = target.h;
const targetMask = new Uint8Array(W * H), actualMask = new Uint8Array(W * H);
for (const leaf of map.leaves) {
  const spec = JSON.parse(fs.readFileSync(path.join(root, 'test-output/plant-26-leaf-production/specs', `${leaf.id}.json`), 'utf8'));
  const mask = decodePng(spec.visibleMask), [x0, y0] = spec.cropBox;
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.rgba[(y * mask.w + x) * 4 + 3] >= 128) targetMask[(y0 + y) * W + x0 + x] = 1;
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = (y * W + x) * 4, r = beauty.rgba[p], g = beauty.rgba[p + 1], b = beauty.rgba[p + 2];
  // Limit to foliage height so the green planter is not counted as foliage.
  actualMask[y * W + x] = y < 170 && g > r + 3 && g >= b * .9 && r + g + b < 740 ? 1 : 0;
}
function bounds(mask) {
  const points = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) points.push([x, y]);
  if (!points.length) return null;
  const x0 = Math.min(...points.map((p) => p[0])), x1 = Math.max(...points.map((p) => p[0])), y0 = Math.min(...points.map((p) => p[1])), y1 = Math.max(...points.map((p) => p[1]));
  return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1, area: points.length };
}
let intersection = 0, union = 0, targetArea = 0, actualArea = 0;
for (let i = 0; i < targetMask.length; i++) { if (targetMask[i]) targetArea++; if (actualMask[i]) actualArea++; if (targetMask[i] && actualMask[i]) intersection++; if (targetMask[i] || actualMask[i]) union++; }
const targetBounds = bounds(targetMask), actualBounds = bounds(actualMask);
status.fullFoliage = {
  targetBounds, actualBounds,
  targetOccupancy: targetArea / (W * H),
  actualOccupancy: actualArea / (W * H),
  overallMaskIoU: union ? Number((intersection / union).toFixed(4)) : 0,
  directVision: status.leavesBelowPoint90.length ? 'BLOCKED_HARD_LEAF_GATES' : 'PENDING_OPERATOR_REVIEW',
  targetTextureUsedInBeauty: false,
  referencePlaneVisible: false
};
status.fullFrontEvidence = {
  beauty: 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png',
  componentId: 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png',
  wireframe: 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png',
  blend: 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.blend',
  reviewBoard: 'asset-factory/modular/PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.png'
};
fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');
console.log(JSON.stringify(status.fullFoliage, null, 2));
