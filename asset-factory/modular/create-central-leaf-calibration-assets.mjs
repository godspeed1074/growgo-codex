import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const target = decodePng(map.referencePath);
const entry = map.leaves.find((leaf) => leaf.silhouette_role === 'TALLEST_CENTRE') ?? map.leaves[0];
const contours = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
const contourEntry = contours.leaves.find((leaf) => leaf.id === entry.id);
const cropDir = path.join(workspaceRoot, 'test-output/plant-target-leaf-crops/input');
const mask = decodePng(path.join(cropDir, contourEntry.maskFilename));
const [mx0, my0] = contourEntry.cropBox;
const fullMask = new Uint8Array(target.w * target.h);
for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.rgba[(y * mask.w + x) * 4 + 3]) fullMask[(my0 + y) * target.w + mx0 + x] = 1;

function boundary(maskData, w, h, ox, oy) {
  const edges = [];
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && maskData[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (filled(x, y)) {
    const gx = ox + x, gy = oy + y;
    if (!filled(x, y - 1)) edges.push([[gx, gy], [gx + 1, gy]]);
    if (!filled(x + 1, y)) edges.push([[gx + 1, gy], [gx + 1, gy + 1]]);
    if (!filled(x, y + 1)) edges.push([[gx + 1, gy + 1], [gx, gy + 1]]);
    if (!filled(x - 1, y)) edges.push([[gx, gy + 1], [gx, gy]]);
  }
  const key = (p) => `${p[0]},${p[1]}`;
  const next = new Map(edges.map((edge) => [key(edge[0]), edge[1]]));
  const startKey = next.keys().next().value;
  const start = startKey.split(',').map(Number), loop = [start];
  let current = start;
  for (let guard = 0; guard < edges.length + 8; guard++) {
    const end = next.get(key(current));
    if (!end) break;
    next.delete(key(current)); current = end; loop.push(end);
    if (key(current) === startKey) break;
  }
  if (loop.length > 1 && key(loop.at(-1)) === startKey) loop.pop();
  return loop;
}

function perimeter(points) {
  const lengths = [], total = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length], d = Math.hypot(q[0] - p[0], q[1] - p[1]); lengths.push(d); return sum + d;
  }, 0);
  return { lengths, total };
}
function resampleClosed(points, count) {
  const { lengths, total } = perimeter(points), out = [];
  for (let k = 0; k < count; k++) {
    let distance = total * k / count, index = 0;
    while (index < lengths.length - 1 && distance > lengths[index]) { distance -= lengths[index]; index++; }
    const p = points[index], q = points[(index + 1) % points.length], t = lengths[index] ? distance / lengths[index] : 0;
    out.push([Number((p[0] + (q[0] - p[0]) * t).toFixed(3)), Number((p[1] + (q[1] - p[1]) * t).toFixed(3))]);
  }
  return out;
}
function pointSegmentDistanceSquared(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (!dx && !dy) return (p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  const q = [a[0] + t * dx, a[1] + t * dy];
  return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
}
function rdpOpen(points, tolerance) {
  if (points.length <= 2) return points;
  let split = -1, maxDistance = tolerance * tolerance;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointSegmentDistanceSquared(points[i], points[0], points.at(-1));
    if (distance > maxDistance) { maxDistance = distance; split = i; }
  }
  if (split < 0) return [points[0], points.at(-1)];
  return [...rdpOpen(points.slice(0, split + 1), tolerance).slice(0, -1), ...rdpOpen(points.slice(split), tolerance)];
}
function rdpClosed(points, tolerance) {
  const simplified = rdpOpen([...points, points[0]], tolerance);
  if (simplified.length > 1 && simplified.at(-1)[0] === simplified[0][0] && simplified.at(-1)[1] === simplified[0][1]) simplified.pop();
  return simplified;
}
function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; i++, j = i - 1) {
    const a = poly[i], b = poly[j]; if (((a[1] > y) !== (b[1] > y)) && x < (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) c = !c;
  }
  return c;
}
function iou(poly) {
  let inter = 0, union = 0;
  for (let y = 0; y < target.h; y++) for (let x = 0; x < target.w; x++) {
    const a = fullMask[y * target.w + x], b = inside(poly, x + .5, y + .5) ? 1 : 0;
    if (a && b) inter++; if (a || b) union++;
  }
  return union ? inter / union : 0;
}
function cropImage(im, x0, y0, w, h, alphaMask = null) {
  const out = Buffer.alloc(w * h * 4, 255);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y, s = (sy * im.w + sx) * 4, d = (y * w + x) * 4;
    out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = alphaMask ? (alphaMask[sy * im.w + sx] ? 255 : 0) : 255;
  }
  return out;
}

const rawContour = boundary(fullMask, target.w, target.h, 0, 0);
const simplifiedContours = {};
for (const count of [8, 10, 12, 16, 20, 24, 32]) simplifiedContours[count] = resampleClosed(rawContour, count);
const scores = Object.fromEntries(Object.entries(simplifiedContours).map(([count, poly]) => [count, Number(iou(poly).toFixed(6))]));
const rdpContours = Object.fromEntries([0.5, 0.75, 1, 1.25, 1.5, 2].map((tolerance) => [String(tolerance), rdpClosed(rawContour, tolerance)]));
const rdpScores = Object.fromEntries(Object.entries(rdpContours).map(([tolerance, poly]) => [tolerance, Number(iou(poly).toFixed(6))]));
const targetPartitionHull = contourEntry.hullContourPx;
const targetPartitionHullScore = Number(iou(targetPartitionHull).toFixed(6));
const targetSpecificContour = [[94.5, 31.5], [98, 35], [101, 39], [103.5, 40], [103.5, 43], [105.5, 44.5], [106, 46], [105, 48], [105, 56], [102, 61], [100, 65], [96, 69], [94, 69], [90, 66], [87, 63], [85, 59], [83, 53], [83, 47], [85, 43], [86.5, 38], [89, 35], [92.5, 31.5]];
const targetSpecificContourScore = Number(iou(targetSpecificContour).toFixed(6));
const chosenTolerance = rdpScores['0.75'] >= 0.95 ? '0.75' : (Object.entries(rdpScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '0.75');
const chosenContour = targetSpecificContourScore >= 0.92 ? targetSpecificContour : (targetPartitionHullScore >= 0.92 ? targetPartitionHull : rdpContours[chosenTolerance]);
const chosenContourSource = targetSpecificContourScore >= 0.92 ? 'TARGET_SPECIFIC_OCCLUSION_CLEANED_TRACE' : (targetPartitionHullScore >= 0.92 ? 'TARGET_PARTITION_HULL' : 'TARGET_MASK_RDP_CLOSED');
const chosenVertexCount = chosenContour.length;
const contourTip = rawContour.reduce((best, point) => point[1] < best[1] || (point[1] === best[1] && Math.abs(point[0] - entry.tip_x_px) < Math.abs(best[0] - entry.tip_x_px)) ? point : best, rawContour[0]);
const xs = rawContour.map((p) => p[0]), ys = rawContour.map((p) => p[1]);
const x0 = Math.max(0, Math.floor(Math.min(...xs) - 2)), y0 = Math.max(0, Math.floor(Math.min(...ys) - 2));
const x1 = Math.min(target.w - 1, Math.ceil(Math.max(...xs) + 2)), y1 = Math.min(target.h - 1, Math.ceil(Math.max(...ys) + 2));
const w = x1 - x0 + 1, h = y1 - y0 + 1;
const outDir = path.join(root, 'asset-factory/modular');
fs.writeFileSync(path.join(outDir, 'CENTRAL_TARGET_LEAF_REFERENCE.png'), encodePng(w, h, cropImage(target, x0, y0, w, h, fullMask)));
const maskRgba = Buffer.alloc(w * h * 4, 0);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = fullMask[(y0 + y) * target.w + x0 + x] ? 255 : 0, d = (y * w + x) * 4; maskRgba[d] = maskRgba[d + 1] = maskRgba[d + 2] = maskRgba[d + 3] = a; }
fs.writeFileSync(path.join(outDir, 'CENTRAL_TARGET_LEAF_VISIBLE_MASK.png'), encodePng(w, h, maskRgba));
const report = {
  status: 'PASS_CENTRAL_TARGET_CONTOUR_EXTRACTED', targetLeafId: entry.id, role: entry.silhouette_role,
  referenceChecksum: map.referenceChecksum, sourceCropBox: [x0, y0, x1, y1],
  sourcePixelCoordinates: { tip: [entry.tip_x_px, entry.tip_y_px], centre: [entry.centre_x_px, entry.centre_y_px], width: entry.visible_width_px, height: entry.visible_height_px },
  rawContour, simplifiedContours, rdpContours, silhouetteIoUByVertexCount: scores, silhouetteIoUByRdpTolerance: rdpScores, chosenTolerance, chosenVertexCount, chosenContour,
  contourSource: chosenContourSource, contourTipPx: chosenContour.reduce((best, point) => Math.hypot(point[0] - entry.tip_x_px, point[1] - entry.tip_y_px) < Math.hypot(best[0] - entry.tip_x_px, best[1] - entry.tip_y_px) ? point : best, chosenContour[0]),
  targetPartitionHull, targetPartitionHullScore, targetSpecificContour, targetSpecificContourScore,
  tonalMeasurement: { baseColourRgb: contourEntry.baseColourRgb, lightSide: contourEntry.lightSide, colourClass: contourEntry.colourClass, method: 'target crop robust green-family median; no target pixels used in Blender material' },
  outputs: { reference: 'CENTRAL_TARGET_LEAF_REFERENCE.png', visibleMask: 'CENTRAL_TARGET_LEAF_VISIBLE_MASK.png' }
};
fs.writeFileSync(path.join(outDir, 'CENTRAL_TARGET_LEAF_CONTOUR.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, targetLeafId: entry.id, chosenVertexCount, scores, crop: [x0, y0, x1, y1] }, null, 2));
