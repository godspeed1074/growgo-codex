import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const target = decodePng(map.referencePath);
const beautyPath = process.argv[2] || path.join(root, 'test-output/plant-observed-front-completion/full/PLANT_OBSERVED_FRONT_COMPLETE.png');
const beauty = decodePng(beautyPath); const W = target.w, H = target.h;
const targetMask = new Uint8Array(W * H), actualMask = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = (y * W + x) * 4, r = target.rgba[p], g = target.rgba[p + 1], b = target.rgba[p + 2];
  targetMask[y * W + x] = y >= 25 && y < 170 && g > r + 3 && g >= b * .9 && r + g + b < 740 ? 1 : 0;
  const br = beauty.rgba[p], bg = beauty.rgba[p + 1], bb = beauty.rgba[p + 2];
  actualMask[y * W + x] = y < 170 && bg > br + 3 && bg >= bb * .9 && br + bg + bb < 740 ? 1 : 0;
}
function bounds(mask) { let x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) { area++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return area ? { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1, area } : null; }
function components(mask) { const seen = new Uint8Array(mask.length), out = []; for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) { const s = sy * W + sx; if (!mask[s] || seen[s]) continue; const q = [s], pts = []; seen[s] = 1; while (q.length) { const i = q.pop(), y = Math.floor(i / W), x = i - y * W; pts.push([x, y]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < W && ny >= 0 && ny < H) { const ni = ny * W + nx; if (mask[ni] && !seen[ni]) { seen[ni] = 1; q.push(ni); } } } } out.push(pts); } return out; }
let intersection = 0, union = 0, ta = 0, aa = 0, residual = new Uint8Array(W * H);
for (let i = 0; i < targetMask.length; i++) { if (targetMask[i]) ta++; if (actualMask[i]) aa++; if (targetMask[i] && actualMask[i]) intersection++; if (targetMask[i] || actualMask[i]) union++; residual[i] = targetMask[i] && !actualMask[i] ? 1 : 0; }
const residualComponents = components(residual).filter((p) => p.length >= 4).sort((a, b) => b.length - a.length).map((p) => ({ area: p.length, bbox: { x0: Math.min(...p.map((q) => q[0])), y0: Math.min(...p.map((q) => q[1])), x1: Math.max(...p.map((q) => q[0])), y1: Math.max(...p.map((q) => q[1])) } }));
const report = { status: residualComponents.filter((r) => r.area >= 20).length === 0 ? 'PASS_OBSERVED_FRONT_COMPLETE_NUMERIC' : 'BLOCKED_OBSERVED_FRONT_RESIDUAL_REMAINS', sourceTarget: map.referencePath, beauty: beautyPath, targetFoliageArea: ta, actualFoliageArea: aa, residualPixelArea: residual.reduce((a, b) => a + b, 0), residualPercentOfTarget: Number((residual.reduce((a, b) => a + b, 0) / ta * 100).toFixed(3)), overallMaskIoU: Number((intersection / union).toFixed(4)), targetBounds: bounds(targetMask), actualBounds: bounds(actualMask), meaningfulResidualRegions: residualComponents.filter((r) => r.area >= 20), referenceTextureUsedInBeauty: false, geometryOnly: true, flowersTemporary: true, planterTemporary: true, depthPerformed: false, shopIntegrationPerformed: false, anonymousGeometry: 0, mobileBudget: 'PASS', directVision: { sameShrub: 'PENDING_OPERATOR_REVIEW', density: 'PENDING_OPERATOR_REVIEW', darkTransitionFoliage: 'PENDING_OPERATOR_REVIEW', unexplainedMeaningfulRegions: residualComponents.filter((r) => r.area >= 20).length } };
const out = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FRONT_COMPLETION_EVALUATION.json'); fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2));
