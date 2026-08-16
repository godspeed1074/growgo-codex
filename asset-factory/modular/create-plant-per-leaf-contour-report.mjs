import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const contours = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
const metricsPath = path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only/GEOMETRY_LEAF_METRICS.json');
const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8')).leafProjection;
const metricById = new Map(metrics.map((m) => [m.id, m]));
const cropDir = path.join(workspaceRoot, 'test-output/plant-target-leaf-crops/input');
const W = map.referenceDimensions[0];
const H = map.referenceDimensions[1];

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi) c = !c;
  }
  return c;
}

function targetMask(entry) {
  const filename = entry.geometryMaskFilename ?? entry.maskFilename;
  const im = decodePng(path.join(cropDir, filename));
  const [x0, y0] = entry.geometryMaskBox ?? entry.cropBox;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const a = im.rgba[(y * im.w + x) * 4 + 3];
    const gx = x0 + x, gy = y0 + y;
    if (a && gx >= 0 && gy >= 0 && gx < W && gy < H) out[gy * W + gx] = 1;
  }
  return out;
}

function polygonMask(poly) {
  const out = new Uint8Array(W * H);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs) - 1));
  const x1 = Math.min(W - 1, Math.ceil(Math.max(...xs) + 1));
  const y0 = Math.max(0, Math.floor(Math.min(...ys) - 1));
  const y1 = Math.min(H - 1, Math.ceil(Math.max(...ys) + 1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(poly, x + .5, y + .5)) out[y * W + x] = 1;
  return out;
}

function iou(a, b) {
  let inter = 0, union = 0, target = 0, projected = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i]) target++;
    if (b[i]) projected++;
    if (a[i] && b[i]) inter++;
    if (a[i] || b[i]) union++;
  }
  return { intersection: inter, union, targetPixels: target, projectedPixels: projected, value: union ? inter / union : 0 };
}

const leaves = contours.leaves.map((entry) => {
  const metric = metricById.get(entry.id);
  const result = iou(targetMask(entry), polygonMask(metric.projectedPolygonPx));
  const sourceLeaf = map.leaves.find((l) => l.id === entry.id);
  const dominant = sourceLeaf.visible_width_px >= 27 && sourceLeaf.visible_height_px >= 26;
  return {
    id: entry.id,
    priority: dominant ? 'DOMINANT' : 'SECONDARY_OCCLUDED',
    targetMask: entry.geometryMaskFilename ?? entry.maskFilename,
    projectedPolygonVertexCount: metric.projectedPolygonPx.length,
    ...result,
    status: result.value >= 0.9 ? 'PASS_CONTOUR_IOU' : result.value >= 0.75 ? 'NEEDS_REVIEW_CONTOUR_IOU' : 'FAIL_CONTOUR_IOU'
  };
});
const dominant = leaves.filter((l) => l.priority === 'DOMINANT');
const mean = leaves.reduce((n, l) => n + l.value, 0) / leaves.length;
const meanDominant = dominant.reduce((n, l) => n + l.value, 0) / (dominant.length || 1);
const worst = [...leaves].sort((a, b) => a.value - b.value)[0];
const report = {
  status: meanDominant >= 0.9 ? 'PASS_TARGET_CONTOUR_OVERLAP' : 'BLOCKED_TARGET_CONTOUR_OVERLAP',
  assetId: 'GG-VEG-PLANTER-SHRUB-001',
  referenceChecksum: map.referenceChecksum,
  measurementBasis: 'projected Blender mesh polygon vs independently extracted target leaf alpha mask (geometry foreground partition where available)',
  targetContourFile: 'PLANT_TARGET_LEAF_CONTOURS.json',
  geometryMetricsFile: 'test-output/plant-26leaf-geometry-only/GEOMETRY_LEAF_METRICS.json',
  visibleLeafCount: leaves.length,
  aggregate: { meanIoU: Number(mean.toFixed(4)), meanDominantIoU: Number(meanDominant.toFixed(4)), lowestIoU: Number(worst.value.toFixed(4)), worstLeaf: worst.id },
  thresholds: { pass: 0.9, review: 0.75 },
  leaves
};
const out = path.join(root, 'asset-factory/modular/PLANT_PER_LEAF_CONTOUR_REPORT.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, output: out, aggregate: report.aggregate }, null, 2));
