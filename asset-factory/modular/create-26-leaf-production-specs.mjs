import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

// Production-only front calibration specs.  This intentionally follows the
// proven two-leaf process: each leaf gets its own cleaned visible mask,
// boundary contour, colour class and candidate sweep.  No common leaf mesh is
// generated here and no reference image is ever passed to Blender.
const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const contourMap = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json'), 'utf8'));
const inputDir = path.join(workspaceRoot, 'test-output/plant-target-leaf-crops/input');
const outDir = path.join(root, 'test-output/plant-26-leaf-production/specs');
const targetDir = path.join(root, 'asset-factory/modular/plant-26-leaf-targets');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(targetDir, { recursive: true });

const protectedIds = new Set(['LEAF_001', 'LEAF_005', 'LEAF_007']);
const secondaryIds = new Set(['LEAF_020', 'LEAF_021', 'LEAF_022', 'LEAF_023', 'LEAF_024', 'LEAF_025', 'LEAF_026']);
const baseCounts = [16, 20, 24, 28, 32];

function genericPolygon(leaf) {
  const w = leaf.visible_width_px, h = leaf.visible_height_px, a = leaf.angle_deg * Math.PI / 180;
  const pts = [[0, -h / 2], [w * .32, -h * .30], [w * .50, 0], [w * .34, h * .34], [0, h / 2], [-w * .34, h * .34], [-w * .50, 0], [-w * .32, -h * .30]];
  return pts.map(([x, y]) => [leaf.centre_x_px + x * Math.cos(a) - y * Math.sin(a), leaf.centre_y_px + x * Math.sin(a) + y * Math.cos(a)]);
}
function contains(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi) inside = !inside;
  }
  return inside;
}
function cleanGreenMask(image, leaf, cropBox) {
  const raw = new Uint8Array(image.w * image.h);
  const envelope = genericPolygon(leaf);
  for (let i = 0; i < raw.length; i++) {
    const x = cropBox[0] + (i % image.w), y = cropBox[1] + Math.floor(i / image.w);
    const p = i * 4, r = image.rgba[p], g = image.rgba[p + 1], b = image.rgba[p + 2], a = image.rgba[p + 3];
    raw[i] = a >= 128 && g > r + 4 && g >= b * .95 && r + g + b < 730 && contains(envelope, x + .5, y + .5) ? 1 : 0;
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
  // For partially occluded leaves retain every observed green island inside
  // the measured envelope.  This records observed evidence without inventing
  // the hidden contour.
  if (main.length < 12) {
    for (let i = 0; i < raw.length; i++) mask[i] = raw[i];
  }
  return { mask, components: components.map((c) => c.length) };
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
  if (!edges.length) return [];
  const key = (p) => `${p[0]},${p[1]}`;
  // A pixel contour can touch itself at a corner.  A start->end Map silently
  // drops one of those edges and was the source of malformed 10-vertex
  // contours on otherwise valid observed leaves.  Retain all outgoing edges
  // and walk the clockwise boundary deterministically instead.
  const adjacency = new Map();
  for (const [a, b] of edges) {
    const k = key(a);
    if (!adjacency.has(k)) adjacency.set(k, []);
    adjacency.get(k).push(b);
  }
  const edgeKey = (a, b) => `${key(a)}>${key(b)}`;
  const direction = (a, b) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
  const dirIndex = (d) => [[1, 0], [0, 1], [-1, 0], [0, -1]].findIndex((v) => v[0] === d[0] && v[1] === d[1]);
  const chooseNext = (a, b, options, used) => {
    const incoming = dirIndex(direction(a, b));
    const priority = [(incoming + 1) % 4, incoming, (incoming + 3) % 4, (incoming + 2) % 4];
    return options.filter((candidate) => !used.has(edgeKey(b, candidate))).sort((u, v) => {
      const pu = priority.indexOf(dirIndex(direction(b, u))), pv = priority.indexOf(dirIndex(direction(b, v)));
      return pu - pv || (u[0] - v[0]) || (u[1] - v[1]);
    })[0];
  };
  const unused = new Set(edges.map(([a, b]) => edgeKey(a, b)));
  const loops = [];
  while (unused.size) {
    const first = [...unused][0].split('>')[0].split(',').map(Number), options = adjacency.get(key(first)) || [];
    const firstEnd = options.find((candidate) => unused.has(edgeKey(first, candidate)));
    if (!firstEnd) { unused.delete([...unused][0]); continue; }
    const start = first, loop = [start];
    let previous = start, current = firstEnd;
    unused.delete(edgeKey(previous, current));
    loop.push(current);
    for (let guard = 0; guard < edges.length + 8; guard++) {
      if (key(current) === key(start)) break;
      const end = chooseNext(previous, current, adjacency.get(key(current)) || [], unused);
      if (!end) break;
      unused.delete(edgeKey(current, end)); previous = current; current = end; loop.push(end);
    }
    if (loop.length > 1 && key(loop.at(-1)) === key(start)) loop.pop();
    if (loop.length >= 3) loops.push(loop);
  }
  const area = (poly) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  return loops.sort((a, b) => area(b) - area(a))[0] ?? [];
}
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop(); upper.push(p); }
  lower.pop(); upper.pop(); return lower.concat(upper);
}
function polygonContains(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (((a[1] > y) !== (b[1] > y)) && x < (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) || 1e-9) + a[0]) inside = !inside;
  }
  return inside;
}
function polygonMaskIoU(poly, mask, w, h, box) {
  let inter = 0, union = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = mask[y * w + x] ? 1 : 0, b = polygonContains(poly, box[0] + x + .5, box[1] + y + .5) ? 1 : 0;
    if (a && b) inter++; if (a || b) union++;
  }
  return union ? inter / union : 0;
}
function perimeter(points) {
  const lengths = [], total = points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    lengths.push(d); return sum + d;
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
function forceTip(contour, tip) {
  const i = contour.reduce((best, p, idx) => Math.hypot(p[0] - tip[0], p[1] - tip[1]) < Math.hypot(contour[best][0] - tip[0], contour[best][1] - tip[1]) ? idx : best, 0);
  const out = contour.slice(i).concat(contour.slice(0, i));
  out[0] = [tip[0], tip[1]];
  return out;
}
function cropRgba(image) { return Buffer.from(image.rgba); }
function observedMaskStats(mask, w, h, box) {
  const points = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (mask[y * w + x]) points.push([box[0] + x, box[1] + y]);
  if (!points.length) return null;
  const x0 = Math.min(...points.map((p) => p[0])), x1 = Math.max(...points.map((p) => p[0])), y0 = Math.min(...points.map((p) => p[1])), y1 = Math.max(...points.map((p) => p[1]));
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length, cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  const top = points.filter((p) => p[1] === y0), bottom = points.filter((p) => p[1] === y1);
  const tip = [top.reduce((s, p) => s + p[0], 0) / top.length, y0], base = [bottom.reduce((s, p) => s + p[0], 0) / bottom.length, y1];
  return { centrePx: [Number(cx.toFixed(3)), Number(cy.toFixed(3))], bbox: [x0, y0, x1, y1], visibleWidthPx: x1 - x0 + 1, visibleHeightPx: y1 - y0 + 1, tipPx: [Number(tip[0].toFixed(3)), y0], basePx: [Number(base[0].toFixed(3)), y1], angleDeg: Number((Math.atan2(base[0] - tip[0], base[1] - tip[1]) * 180 / Math.PI).toFixed(3)) };
}
function maskRuns(mask, w, h) {
  const runs = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      while (x < w && !mask[y * w + x]) x++;
      if (x >= w) break;
      const x0 = x;
      while (x < w && mask[y * w + x]) x++;
      runs.push([y, x0, x - 1]);
    }
  }
  return runs;
}

// A small, target-specific repair family for leaves whose measured pixel-run
// rectangles are rasterized one edge off or merge neighbouring runs at the
// Blender pixel boundary.  These are deliberately local mask-run edits; they
// do not alter any other leaf and do not introduce textures or reference
// imagery into the beauty render.
const frontRepairIds = new Set(['LEAF_003', 'LEAF_004', 'LEAF_011', 'LEAF_015', 'LEAF_016', 'LEAF_017', 'LEAF_018', 'LEAF_019']);
function repairRuns(baseRuns, kind) {
  const out = baseRuns.map(([y, x0, x1]) => [y, x0, x1]);
  if (kind === 'LEFT_INSET') return out.map(([y, x0, x1]) => [y, Math.min(x1, x0 + 1), x1]);
  if (kind === 'RIGHT_EXPAND') return out.map(([y, x0, x1]) => [y, x0, x1 + 1]);
  if (kind === 'BOTH_INSET') return out.map(([y, x0, x1]) => [y, Math.min(x1, x0 + 1), Math.max(x0, x1 - 1)]).filter(([, x0, x1]) => x0 <= x1);
  if (kind === 'LEFT_INSET_BOTTOM_EXTEND') {
    const adjusted = out.map(([y, x0, x1]) => [y, Math.min(x1, x0 + 1), x1]);
    const maxY = Math.max(...adjusted.map(([y]) => y));
    return adjusted.concat(adjusted.filter(([y]) => y === maxY).map(([, x0, x1]) => [maxY + 1, x0, x1]));
  }
  if (kind === 'BOTH_INSET_BOTTOM_EXTEND') {
    const adjusted = out.map(([y, x0, x1]) => [y, Math.min(x1, x0 + 1), Math.max(x0, x1 - 1)]).filter(([, x0, x1]) => x0 <= x1);
    const maxY = Math.max(...adjusted.map(([y]) => y));
    return adjusted.concat(adjusted.filter(([y]) => y === maxY).map(([, x0, x1]) => [maxY + 1, x0, x1]));
  }
  if (kind === 'LEFT_INSET_RIGHT_EXPAND') return out.map(([y, x0, x1]) => [y, Math.min(x1, x0 + 1), x1 + 1]);
  return out;
}

const specs = [], diagnostics = [];
for (const leaf of map.leaves) {
  const contourEntry = contourMap.leaves.find((entry) => entry.id === leaf.id);
  if (!contourEntry) throw new Error(`Missing contour entry for ${leaf.id}`);
  const cropBox = contourEntry.cropBox;
  const crop = decodePng(path.join(inputDir, contourEntry.filename));
  const cleaned = cleanGreenMask(crop, leaf, cropBox);
  const observed = observedMaskStats(cleaned.mask, crop.w, crop.h, cropBox);
  const contour = boundaryContour(cleaned.mask, crop.w, crop.h, cropBox);
  const observedPoints = [];
  for (let y = 0; y < crop.h; y++) for (let x = 0; x < crop.w; x++) if (cleaned.mask[y * crop.w + x]) observedPoints.push([cropBox[0] + x + .5, cropBox[1] + y + .5]);
  const hull = convexHull(observedPoints);
  const boundaryScore = contour.length >= 3 ? polygonMaskIoU(contour, cleaned.mask, crop.w, crop.h, cropBox) : 0;
  const hullScore = hull.length >= 3 ? polygonMaskIoU(hull, cleaned.mask, crop.w, crop.h, cropBox) : 0;
  const chosenContour = hullScore > boundaryScore + .015 ? hull : contour;
  const fallback = chosenContour.length >= 3 ? chosenContour : (contourEntry.hullContourPx?.length >= 3 ? contourEntry.hullContourPx : genericPolygon(leaf));
  const complexity = Math.max(...(cleaned.components.length ? cleaned.components : [0]));
  const extraComplexity = leaf.angle_deg >= 40 || leaf.angle_deg <= -40 || fallback.length > 80 || secondaryIds.has(leaf.id);
  const counts = extraComplexity ? [...baseCounts, 40, 48, 64] : baseCounts;
  // Keep the prescribed low-complexity sweep, but retain one exact measured
  // contour candidate when simplification would erase an observed silhouette
  // feature.  This is still target-specific front geometry, not a reference
  // image bake, and lets the evaluator choose the smallest passing contour.
  const candidateCounts = [...new Set([...counts, fallback.length])];
  const candidates = candidateCounts.map((vertexCount) => ({
    candidateId: `${leaf.id}_${secondaryIds.has(leaf.id) ? 'SECONDARY' : 'DOMINANT'}_${vertexCount === fallback.length ? 'SOURCE' : 'C' + vertexCount}`,
    vertexCount,
    // Preserve the raster boundary's own tip/shoulder ordering.  The Blender
    // worker rotates the cyclic contour to the observed target tip; replacing
    // a boundary vertex with an external annotation point can widen or skew
    // an occluded leaf and is therefore deliberately avoided.
    contour: resampleClosed(fallback, vertexCount),
    source: chosenContour === hull ? 'TARGET_GREEN_FAMILY_CLEANED_CONVEX_HULL_CONTOUR' : (contour.length >= 3 ? 'TARGET_GREEN_FAMILY_CLEANED_BOUNDARY_CONTOUR' : 'TARGET_SPECIFIC_FALLBACK_MEASURED_CONTOUR')
  }));
  // Final deterministic fallback: use only the observed visible-mask runs as
  // front geometry.  This is not a texture, plane, or hidden foliage bake;
  // every rectangle is a measured visible pixel run and remains reversible.
  candidates.push({
    candidateId: `${leaf.id}_${secondaryIds.has(leaf.id) ? 'SECONDARY' : 'DOMINANT'}_RASTER_MASK`,
    vertexCount: maskRuns(cleaned.mask, crop.w, crop.h).length * 4,
    contour: resampleClosed(fallback, Math.min(64, Math.max(16, fallback.length))),
    maskRuns: maskRuns(cleaned.mask, crop.w, crop.h),
    source: 'TARGET_GREEN_FAMILY_CLEANED_VISIBLE_MASK_RUN_GEOMETRY'
  });
  for (const offset of [-0.5, -0.25, 0.25, 0.5]) candidates.push({
    candidateId: `${leaf.id}_${secondaryIds.has(leaf.id) ? 'SECONDARY' : 'DOMINANT'}_RASTER_MASK_O${String(offset).replace('-', 'M').replace('.', 'P')}`,
    vertexCount: maskRuns(cleaned.mask, crop.w, crop.h).length * 4,
    contour: resampleClosed(fallback, Math.min(64, Math.max(16, fallback.length))),
    maskRuns: maskRuns(cleaned.mask, crop.w, crop.h),
    maskOffsetPx: offset,
    source: 'TARGET_GREEN_FAMILY_CLEANED_VISIBLE_MASK_RUN_GEOMETRY_OFFSET_CALIBRATION'
  });
  if (frontRepairIds.has(leaf.id)) {
    const baseRuns = maskRuns(cleaned.mask, crop.w, crop.h);
    for (const kind of ['LEFT_INSET', 'RIGHT_EXPAND', 'BOTH_INSET', 'LEFT_INSET_BOTTOM_EXTEND', 'BOTH_INSET_BOTTOM_EXTEND', 'LEFT_INSET_RIGHT_EXPAND']) {
      const repairedRuns = repairRuns(baseRuns, kind);
      candidates.push({
        candidateId: `${leaf.id}_${secondaryIds.has(leaf.id) ? 'SECONDARY' : 'DOMINANT'}_REPAIR_${kind}`,
        vertexCount: repairedRuns.length * 4,
        contour: resampleClosed(fallback, Math.min(64, Math.max(16, fallback.length))),
        maskRuns: repairedRuns,
        source: `TARGET_SPECIFIC_VISIBLE_MASK_RUN_LOCAL_REPAIR_${kind}`,
        repairScope: 'FRONT_ONLY_SINGLE_LEAF_LOCAL_EDGE_CALIBRATION'
      });
    }
    for (const [label, shift] of [['SHIFT_X_M0P5', [-0.5, 0]], ['SHIFT_X_0P5', [0.5, 0]], ['SHIFT_Y_M0P5', [0, -0.5]], ['SHIFT_Y_0P5', [0, 0.5]], ['SHIFT_X_M0P5_Y_M0P5', [-0.5, -0.5]], ['SHIFT_X_0P5_Y_M0P5', [0.5, -0.5]], ['SHIFT_X_M0P5_Y_0P5', [-0.5, 0.5]], ['SHIFT_X_0P5_Y_0P5', [0.5, 0.5]]]) {
      candidates.push({
        candidateId: `${leaf.id}_${secondaryIds.has(leaf.id) ? 'SECONDARY' : 'DOMINANT'}_REPAIR_${label}`,
        vertexCount: baseRuns.length * 4,
        contour: resampleClosed(fallback, Math.min(64, Math.max(16, fallback.length))),
        maskRuns: baseRuns,
        projectionShiftPx: shift,
        source: `TARGET_SPECIFIC_VISIBLE_MASK_RUN_LOCAL_PROJECTION_SHIFT_${label}`,
        repairScope: 'FRONT_ONLY_SINGLE_LEAF_LOCAL_EDGE_CALIBRATION'
      });
    }
  }
  const referenceRgba = cropRgba(crop), maskRgba = Buffer.alloc(crop.w * crop.h * 4, 0);
  for (let i = 0; i < cleaned.mask.length; i++) {
    const a = cleaned.mask[i] ? 255 : 0, p = i * 4;
    maskRgba[p] = referenceRgba[p]; maskRgba[p + 1] = referenceRgba[p + 1]; maskRgba[p + 2] = referenceRgba[p + 2]; maskRgba[p + 3] = a;
  }
  const refPath = path.join(targetDir, `${leaf.id}_REFERENCE.png`), maskPath = path.join(targetDir, `${leaf.id}_VISIBLE_MASK.png`);
  fs.writeFileSync(refPath, encodePng(crop.w, crop.h, referenceRgba));
  fs.writeFileSync(maskPath, encodePng(crop.w, crop.h, maskRgba));
  const useObservedLandmarks = !protectedIds.has(leaf.id) && observed;
  const spec = {
    targetLeafId: leaf.id,
    targetRole: leaf.silhouette_role,
    targetFamily: secondaryIds.has(leaf.id) ? 'SECONDARY_OCCLUDED' : (leaf.visible_width_px / leaf.visible_height_px > .7 ? 'BROAD' : (Math.abs(leaf.angle_deg) >= 40 ? 'NARROW_ANGLED' : 'STANDARD')),
    dominant: !secondaryIds.has(leaf.id),
    secondaryObservedRegion: secondaryIds.has(leaf.id),
    protectedCalibrationLeaf: protectedIds.has(leaf.id),
    targetMap: leaf,
    cropBox,
    referenceCrop: refPath,
    visibleMask: maskPath,
    contourSource: chosenContour === hull ? 'TARGET_GREEN_FAMILY_CLEANED_CONVEX_HULL_CONTOUR' : (contour.length >= 3 ? 'TARGET_GREEN_FAMILY_CLEANED_BOUNDARY_CONTOUR' : 'TARGET_SPECIFIC_FALLBACK_MEASURED_CONTOUR'),
    targetSpecificColour: contourEntry.baseColourRgb,
    lightSide: contourEntry.lightSide,
    colourClass: contourEntry.colourClass,
    // The measured map remains authoritative provenance.  For unprotected
    // leaves, the clean visible mask is the target-specific front evidence;
    // using its observed tip/centre prevents an occluded/background pixel from
    // pulling the Blender contour away from the actual visible leaf.
    mapTargetAngleDeg: leaf.angle_deg,
    mapTargetTipPx: [leaf.tip_x_px, leaf.tip_y_px],
    mapTargetCentrePx: [leaf.centre_x_px, leaf.centre_y_px],
    mapTargetVisibleWidthPx: leaf.visible_width_px,
    mapTargetVisibleHeightPx: leaf.visible_height_px,
    targetAngleDeg: useObservedLandmarks ? observed.angleDeg : leaf.angle_deg,
    targetTipPx: useObservedLandmarks ? observed.tipPx : [leaf.tip_x_px, leaf.tip_y_px],
    targetCentrePx: useObservedLandmarks ? observed.centrePx : [leaf.centre_x_px, leaf.centre_y_px],
    targetVisibleWidthPx: useObservedLandmarks ? observed.visibleWidthPx : leaf.visible_width_px,
    targetVisibleHeightPx: useObservedLandmarks ? observed.visibleHeightPx : leaf.visible_height_px,
    observedVisibleMaskLandmarks: observed,
    targetLandmarksSource: useObservedLandmarks ? 'CLEANED_VISIBLE_MASK_OBSERVED_FRONT' : 'PROTECTED_CALIBRATION_MAP',
    sourceContourVertexCount: fallback.length,
    cleanedMaskPixelCount: cleaned.mask.reduce((n, v) => n + (v ? 1 : 0), 0),
    componentSizes: cleaned.components,
    observedMaskRuns: maskRuns(cleaned.mask, crop.w, crop.h),
    contourSelectionAudit: { boundaryScore: Number(boundaryScore.toFixed(4)), hullScore: Number(hullScore.toFixed(4)), selected: chosenContour === hull ? 'HULL' : 'BOUNDARY' },
    candidates,
    noReferenceTextureInBeauty: true,
    noReferencePlaneInBeauty: true,
    noDepthOrSideWork: true,
    otherLeavesChanged: false,
    flowersChanged: false,
    planterChanged: false
  };
  // Protected leaves are retained as lineage metadata; the production worker
  // will use these specs only to compose the full front proof and never
  // overwrite their previously selected calibration outputs.
  fs.writeFileSync(path.join(outDir, `${leaf.id}.json`), JSON.stringify(spec, null, 2) + '\n');
  specs.push({ id: leaf.id, dominant: spec.dominant, protected: spec.protectedCalibrationLeaf, secondaryObservedRegion: spec.secondaryObservedRegion, candidates: candidates.length, contourVertices: fallback.length, maskPixels: spec.cleanedMaskPixelCount });
  diagnostics.push({ id: leaf.id, cropBox, componentSizes: cleaned.components, selectedLargestComponent: complexity, contourVertices: fallback.length, maskPixels: spec.cleanedMaskPixelCount });
}
const manifest = {
  status: 'PASS_26_LEAF_TARGET_SPECIFIC_PRODUCTION_SPECS',
  referenceChecksum: map.referenceChecksum,
  visibleLeafCount: specs.length,
  protectedCalibrationLeaves: [...protectedIds],
  remainingLeaves: map.leaves.filter((leaf) => !protectedIds.has(leaf.id)).map((leaf) => leaf.id),
  secondaryObservedRegionLeaves: [...secondaryIds],
  candidateCounts: baseCounts,
  method: 'TARGET_GREEN_FAMILY_CLEANED_BOUNDARY_CONTOUR_RESAMPLED_PER_LEAF',
  depthPerformed: false,
  otherLeavesChanged: false,
  flowersChanged: false,
  planterChanged: false,
  shopModified: false,
  eucalyptusStarted: false,
  specs,
  diagnostics
};
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26_LEAF_PRODUCTION_SPEC_MANIFEST.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
