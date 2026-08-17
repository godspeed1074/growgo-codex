import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const contourMap = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
const visibleMap = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const selected = [
  { id: 'LEAF_005', role: 'BROAD_LEFT_SHOULDER', family: 'BROAD' },
  { id: 'LEAF_007', role: 'NARROW_ANGLED_FAR_LEFT_EDGE', family: 'NARROW_ANGLED' }
];
const candidateCounts = [16, 20, 24, 28, 32];
const outDir = path.join(root, 'test-output/two-leaf-calibration/specs');
fs.mkdirSync(outDir, { recursive: true });

function perimeter(points) {
  const lengths = [];
  const total = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    lengths.push(d);
    return sum + d;
  }, 0);
  return { lengths, total };
}
function resampleClosed(points, count) {
  const { lengths, total } = perimeter(points);
  const out = [];
  for (let k = 0; k < count; k++) {
    let distance = total * k / count;
    let index = 0;
    while (index < lengths.length - 1 && distance > lengths[index]) {
      distance -= lengths[index];
      index++;
    }
    const p = points[index], q = points[(index + 1) % points.length];
    const t = lengths[index] ? distance / lengths[index] : 0;
    out.push([Number((p[0] + (q[0] - p[0]) * t).toFixed(3)), Number((p[1] + (q[1] - p[1]) * t).toFixed(3))]);
  }
  return out;
}
function cleanGreenMask(image) {
  const raw = new Uint8Array(image.w * image.h);
  for (let i = 0; i < raw.length; i++) {
    const p = i * 4, r = image.rgba[p], g = image.rgba[p + 1], b = image.rgba[p + 2], a = image.rgba[p + 3];
    raw[i] = a >= 128 && g > r + 4 && g >= b * .95 && r + g + b < 730 ? 1 : 0;
  }
  const seen = new Uint8Array(raw.length), components = [];
  for (let i = 0; i < raw.length; i++) if (raw[i] && !seen[i]) {
    const queue = [i], points = [];
    seen[i] = 1;
    while (queue.length) {
      const current = queue.pop(), x = current % image.w, y = Math.floor(current / image.w);
      points.push([x, y]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= image.w || yy >= image.h) continue;
        const index = yy * image.w + xx;
        if (raw[index] && !seen[index]) { seen[index] = 1; queue.push(index); }
      }
    }
    components.push(points);
  }
  const main = components.sort((a, b) => b.length - a.length)[0] ?? [];
  const mask = new Uint8Array(image.w * image.h);
  for (const [x, y] of main) mask[y * image.w + x] = 1;
  return mask;
}
function boundaryContour(mask, w, h, box) {
  const edges = [], filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (filled(x, y)) {
    const gx = box[0] + x, gy = box[1] + y;
    if (!filled(x, y - 1)) edges.push([[gx, gy], [gx + 1, gy]]);
    if (!filled(x + 1, y)) edges.push([[gx + 1, gy], [gx + 1, gy + 1]]);
    if (!filled(x, y + 1)) edges.push([[gx + 1, gy + 1], [gx, gy + 1]]);
    if (!filled(x - 1, y)) edges.push([[gx, gy + 1], [gx, gy]]);
  }
  const key = (p) => `${p[0]},${p[1]}`, next = new Map(edges.map((edge) => [key(edge[0]), edge[1]]));
  const startKey = next.keys().next().value;
  if (!startKey) return [];
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

const specs = [];
for (const selection of selected) {
  const mapLeaf = visibleMap.leaves.find((leaf) => leaf.id === selection.id);
  const contourLeaf = contourMap.leaves.find((leaf) => leaf.id === selection.id);
  if (!mapLeaf || !contourLeaf) throw new Error(`Missing contour/map entry for ${selection.id}`);
  const sourceImage = decodePng(path.join(workspaceRoot, 'test-output/plant-target-leaf-crops/input', contourLeaf.filename));
  const cleanMask = cleanGreenMask(sourceImage);
  const sourceContour = boundaryContour(cleanMask, sourceImage.w, sourceImage.h, contourLeaf.cropBox);
  const cleanReferenceRgba = Buffer.alloc(sourceImage.w * sourceImage.h * 4, 0);
  for (let i = 0; i < cleanMask.length; i++) { const p = i * 4; cleanReferenceRgba[p] = sourceImage.rgba[p]; cleanReferenceRgba[p + 1] = sourceImage.rgba[p + 1]; cleanReferenceRgba[p + 2] = sourceImage.rgba[p + 2]; cleanReferenceRgba[p + 3] = cleanMask[i] ? 255 : 0; }
  const cleanReferencePath = path.join(root, 'asset-factory/modular', `TWO_LEAF_TARGET_${selection.id}_REFERENCE.png`);
  const cleanMaskPath = path.join(root, 'asset-factory/modular', `TWO_LEAF_TARGET_${selection.id}_VISIBLE_MASK.png`);
  const cleanMaskRgba = Buffer.alloc(sourceImage.w * sourceImage.h * 4, 0);
  for (let i = 0; i < cleanMask.length; i++) { const a = cleanMask[i] ? 255 : 0, p = i * 4; cleanMaskRgba[p] = cleanMaskRgba[p + 1] = cleanMaskRgba[p + 2] = cleanMaskRgba[p + 3] = a; }
  fs.writeFileSync(cleanReferencePath, encodePng(sourceImage.w, sourceImage.h, cleanReferenceRgba));
  fs.writeFileSync(cleanMaskPath, encodePng(sourceImage.w, sourceImage.h, cleanMaskRgba));
  const countsForLeaf = selection.family === 'NARROW_ANGLED' ? [...candidateCounts, 40, 48, 64] : candidateCounts;
  const candidates = countsForLeaf.map((vertexCount) => ({
    candidateId: `${selection.id}_${selection.family}_C${vertexCount}`,
    vertexCount,
    contour: resampleClosed(sourceContour, vertexCount),
    source: 'TARGET_RASTER_BOUNDARY_CONTOUR_RESAMPLED'
  }));
  if (selection.id === 'LEAF_007') {
    const base = candidates.find((candidate) => candidate.vertexCount === 64);
    const taperThreshold = mapLeaf.tip_y_px + mapLeaf.visible_height_px * .72;
    candidates.push({
      candidateId: 'LEAF_007_NARROW_ANGLED_C64_BASE_TAPER',
      vertexCount: 64,
      contour: base.contour.map(([x, y]) => [x, y > taperThreshold ? Number((y + 1).toFixed(3)) : y]),
      source: 'TARGET_RASTER_BOUNDARY_CONTOUR_RESAMPLED_BASE_TAPER_MICRO_CALIBRATION'
    });
    const baseTaper = candidates.at(-1);
    const shoulderThreshold = mapLeaf.centre_x_px - mapLeaf.visible_width_px * .2;
    candidates.push({
      candidateId: 'LEAF_007_NARROW_ANGLED_C64_BASE_TAPER_WIDTH',
      vertexCount: 64,
      contour: baseTaper.contour.map(([x, y]) => [x < shoulderThreshold ? Number((x - 1).toFixed(3)) : x, y]),
      source: 'TARGET_RASTER_BOUNDARY_CONTOUR_RESAMPLED_BASE_TAPER_WIDTH_MICRO_CALIBRATION'
    });
  }
  const base = {
    targetLeafId: selection.id,
    targetRole: selection.role,
    targetFamily: selection.family,
    targetMap: mapLeaf,
    cropBox: contourLeaf.cropBox,
    referenceCrop: cleanReferencePath,
    visibleMask: cleanMaskPath,
    contourSource: 'TARGET_GREEN_FAMILY_CLEANED_BOUNDARY_CONTOUR',
    targetSpecificColour: contourLeaf.baseColourRgb,
    lightSide: contourLeaf.lightSide,
    colourClass: contourLeaf.colourClass,
    targetAngleDeg: mapLeaf.angle_deg,
    targetTipPx: [mapLeaf.tip_x_px, mapLeaf.tip_y_px],
    targetCentrePx: [mapLeaf.centre_x_px, mapLeaf.centre_y_px],
    targetVisibleWidthPx: mapLeaf.visible_width_px,
    targetVisibleHeightPx: mapLeaf.visible_height_px,
    sourceContourVertexCount: sourceContour.length,
    candidates,
    noReferenceTextureInBeauty: true,
    noReferencePlaneInBeauty: true,
    noDepthOrSideWork: true,
    otherLeavesChanged: false,
    flowersChanged: false,
    planterChanged: false
  };
  fs.writeFileSync(path.join(outDir, `${selection.id}.json`), JSON.stringify(base, null, 2) + '\n');
  specs.push({ id: selection.id, family: selection.family, candidateCount: candidates.length, sourceContourVertexCount: sourceContour.length, candidateIds: candidates.map((c) => c.candidateId) });
}
const manifest = { status: 'PASS_TWO_LEAF_TARGET_SPECIFIC_SPECS', selected, candidates: specs, method: 'TARGET_RASTER_BOUNDARY_CONTOUR_RESAMPLED', candidateCounts, depthPerformed: false, otherLeavesChanged: false };
fs.writeFileSync(path.join(root, 'asset-factory/modular/TWO_LEAF_CALIBRATION_SPEC_MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
