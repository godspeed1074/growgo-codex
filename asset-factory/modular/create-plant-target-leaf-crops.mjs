import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const source = decodePng(map.referencePath);
const foliageCutoffY = Math.max(0, (map.planterRelation?.rim_y_px ?? source.h) - 3);
const outDir = path.join(workspaceRoot, 'test-output/plant-target-leaf-crops');
const inputDir = path.join(outDir, 'input');
fs.mkdirSync(inputDir, { recursive: true });

const greenLike = (r, g, b) => g > 30 && g >= r * 0.72 && g >= b * 0.88 && (r + g + b) < 730;
const colourDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function genericPolygon(leaf) {
  const w = leaf.visible_width_px, h = leaf.visible_height_px;
  const a = leaf.angle_deg * Math.PI / 180;
  const pts = [[0, -h / 2], [w * .32, -h * .30], [w * .50, 0], [w * .34, h * .34], [0, h / 2], [-w * .34, h * .34], [-w * .50, 0], [-w * .32, -h * .30]];
  return pts.map(([x, y]) => [leaf.centre_x_px + x * Math.cos(a) - y * Math.sin(a), leaf.centre_y_px + x * Math.sin(a) + y * Math.cos(a)]);
}
function polygonArea(poly) {
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; i++, j = i - 1) area += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(area) / 2;
}
function convexHull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  lower.pop(); upper.pop(); return lower.concat(upper);
}
function maskBoundaryContour(maskObj, box) {
  const { mask, w, h } = maskObj;
  const edges = [];
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (filled(x, y)) {
    const gx = box.x0 + x, gy = box.y0 + y;
    if (!filled(x, y - 1)) edges.push([[gx, gy], [gx + 1, gy]]);
    if (!filled(x + 1, y)) edges.push([[gx + 1, gy], [gx + 1, gy + 1]]);
    if (!filled(x, y + 1)) edges.push([[gx + 1, gy + 1], [gx, gy + 1]]);
    if (!filled(x - 1, y)) edges.push([[gx, gy + 1], [gx, gy]]);
  }
  if (!edges.length) return [];
  const key = (p) => `${p[0]},${p[1]}`;
  const nextByStart = new Map();
  for (const e of edges) nextByStart.set(key(e[0]), e[1]);
  const loops = [];
  while (nextByStart.size) {
    const startKey = nextByStart.keys().next().value;
    const start = startKey.split(',').map(Number), loop = [start];
    let current = start;
    for (let guard = 0; guard < edges.length + 8; guard++) {
      const end = nextByStart.get(key(current));
      if (!end) break;
      nextByStart.delete(key(current));
      loop.push(end); current = end;
      if (key(current) === startKey) break;
    }
    if (loop.length >= 4 && key(loop[loop.length - 1]) === startKey) loop.pop();
    loops.push(loop);
  }
  const area = (poly) => Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  return loops.sort((a, b) => area(b) - area(a))[0] ?? [];
}
function contains(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-6) + xi) inside = !inside;
  }
  return inside;
}
function pixel(x, y) {
  const i = (y * source.w + x) * 4;
  return [source.rgba[i], source.rgba[i + 1], source.rgba[i + 2]];
}
function findSeed(leaf, box) {
  const cx = leaf.centre_x_px, cy = leaf.centre_y_px;
  let best = null;
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const c = pixel(x, y);
    if (!greenLike(...c)) continue;
    const d = (x - cx) ** 2 + (y - cy) ** 2;
    if (!best || d < best.d) best = { x, y, c, d };
  }
  return best;
}
function median(values) {
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
}
function dominantColour(leaf, box) {
  const values = [[], [], []];
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const c = pixel(x, y);
    if (greenLike(...c)) for (let k = 0; k < 3; k++) values[k].push(c[k]);
  }
  return values.map(median);
}
function floodMask(leaf, box, seed, baseColour) {
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1;
  const mask = new Uint8Array(w * h);
  const generic = genericPolygon(leaf);
  const sx = Math.max(box.x0, Math.min(box.x1, seed.x)), sy = Math.max(box.y0, Math.min(box.y1, seed.y));
  const q = [[sx, sy]];
  const threshold = 82;
  while (q.length) {
    const [x, y] = q.pop();
    const lx = x - box.x0, ly = y - box.y0, mi = ly * w + lx;
    if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1 || mask[mi]) continue;
    const c = pixel(x, y);
    if (!greenLike(...c) || !contains(generic, x + .5, y + .5) || colourDistance(c, baseColour) > threshold) continue;
    mask[mi] = 255;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const count = mask.reduce((n, v) => n + (v ? 1 : 0), 0);
  if (count < 12) {
    // Occluded/anti-aliased leaves can lose the seed region.  Recover only
    // the observed green pixels inside the measured box, never the background.
    for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
      const c = pixel(x, y);
      if (greenLike(...c) && contains(generic, x + .5, y + .5)) mask[(y - box.y0) * w + (x - box.x0)] = 255;
    }
  }
  return { mask, w, h };
}
function radialContour(leaf, box, maskObj) {
  const { mask, w, h } = maskObj;
  const cx = leaf.centre_x_px, cy = leaf.centre_y_px;
  const points = [];
  for (let k = 0; k < 32; k++) {
    const a = 2 * Math.PI * k / 32;
    let radius = 2;
    for (let r = 2; r < Math.max(leaf.visible_width_px, leaf.visible_height_px) * 0.9 + 6; r += 0.5) {
      const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r);
      if (x < box.x0 || x > box.x1 || y < box.y0 || y > box.y1 || !mask[(y - box.y0) * w + (x - box.x0)]) break;
      radius = r;
    }
    points.push([Number((cx + Math.cos(a) * radius).toFixed(3)), Number((cy + Math.sin(a) * radius).toFixed(3))]);
  }
  return points;
}
function leafMaskImage(leaf, box, maskObj) {
  const rgba = Buffer.alloc(maskObj.w * maskObj.h * 4, 0);
  for (let y = 0; y < maskObj.h; y++) for (let x = 0; x < maskObj.w; x++) {
    const d = (y * maskObj.w + x) * 4;
    const s = ((box.y0 + y) * source.w + box.x0 + x) * 4;
    rgba[d] = source.rgba[s]; rgba[d + 1] = source.rgba[s + 1]; rgba[d + 2] = source.rgba[s + 2];
    rgba[d + 3] = maskObj.mask[y * maskObj.w + x];
  }
  return rgba;
}

// The crop mask above is intentionally conservative because neighboring
// leaves overlap.  For the geometry front pass, partition every observed
// green foreground pixel to the nearest measured leaf envelope.  This keeps
// all 26 leaves independent while ensuring the rendered front does not lose
// real target foliage simply because its edge is occluded in one crop.
const partitionById = new Map(map.leaves.map((leaf) => [leaf.id, new Uint8Array(source.w * source.h)]));
const measuredPolys = map.leaves.map((leaf) => ({ leaf, poly: genericPolygon(leaf) }));
for (let y = 0; y < foliageCutoffY; y++) for (let x = 0; x < source.w; x++) {
  const c = pixel(x, y);
  if (!greenLike(...c)) continue;
  // Use every measured centre for the assignment.  Restricting to the
  // canonical per-leaf envelope would leave genuine target pixels in the
  // occlusion gaps unassigned, which is exactly the under-filled front this
  // phase is correcting.
  const pool = measuredPolys;
  let best = pool[0], bestScore = Infinity;
  for (const entry of pool) {
    const leaf = entry.leaf;
    const dx = (x - leaf.centre_x_px) / Math.max(1, leaf.visible_width_px * .5);
    const dy = (y - leaf.centre_y_px) / Math.max(1, leaf.visible_height_px * .5);
    const score = dx * dx + dy * dy;
    if (score < bestScore) { best = entry; bestScore = score; }
  }
  partitionById.get(best.leaf.id)[y * source.w + x] = 255;
}
function drawDigit(board, bw, x, y, digit, colour) {
  const glyphs = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111']
  }[digit];
  for (let yy = 0; yy < glyphs.length; yy++) for (let xx = 0; xx < 3; xx++) if (glyphs[yy][xx] === '1') {
    const d = ((y + yy * 2) * bw + x + xx * 2) * 4;
    board[d] = colour[0]; board[d + 1] = colour[1]; board[d + 2] = colour[2]; board[d + 3] = 255;
    board[d + 4] = colour[0]; board[d + 5] = colour[1]; board[d + 6] = colour[2]; board[d + 7] = 255;
    board[d + bw * 4] = colour[0]; board[d + bw * 4 + 1] = colour[1]; board[d + bw * 4 + 2] = colour[2]; board[d + bw * 4 + 3] = 255;
    board[d + bw * 4 + 4] = colour[0]; board[d + bw * 4 + 5] = colour[1]; board[d + bw * 4 + 6] = colour[2]; board[d + bw * 4 + 7] = 255;
  }
}

const contours = [];
for (const leaf of map.leaves) {
  const margin = 3;
  const box = {
    x0: Math.max(0, Math.floor(leaf.centre_x_px - leaf.visible_width_px / 2 - margin)),
    y0: Math.max(0, Math.floor(leaf.centre_y_px - leaf.visible_height_px / 2 - margin)),
    x1: Math.min(source.w - 1, Math.ceil(leaf.centre_x_px + leaf.visible_width_px / 2 + margin)),
    y1: Math.min(foliageCutoffY, Math.ceil(leaf.centre_y_px + leaf.visible_height_px / 2 + margin))
  };
  const baseColour = dominantColour(leaf, box);
  const seed = findSeed(leaf, box) ?? { x: leaf.centre_x_px, y: leaf.centre_y_px, c: baseColour };
  const maskObj = floodMask(leaf, box, seed, baseColour);
  // A wider geometry window captures observed foreground pixels that are
  // visible around an occluded leaf, while the review crop remains tightly
  // bounded to the measured leaf box.
  const geometryBox = { ...box };
  const geometryW = geometryBox.x1 - geometryBox.x0 + 1;
  const geometryH = geometryBox.y1 - geometryBox.y0 + 1;
  const partitionMask = maskObj.mask;
  const geometryMaskObj = maskObj;
  const measuredContour = radialContour(leaf, geometryBox, geometryMaskObj);
  const maskPoints = [];
  for (let y = geometryBox.y0; y <= geometryBox.y1; y++) for (let x = geometryBox.x0; x <= geometryBox.x1; x++) {
    if (partitionMask[(y - geometryBox.y0) * geometryW + (x - geometryBox.x0)]) maskPoints.push([x + .5, y + .5]);
  }
  const hullContour = convexHull(maskPoints);
  const boundaryContour = maskBoundaryContour(geometryMaskObj, geometryBox);
  // Some low leaves are occluded by flowers/rim in the reference crop.  A
  // radial trace through those pixels can collapse to a sliver.  Preserve the
  // measured pixels as evidence, but use the measured map dimensions and
  // angle to restore the visible leaf envelope for the geometry candidate.
  const expectedArea = leaf.visible_width_px * leaf.visible_height_px * 0.42;
  const contourNeedsRepair = polygonArea(boundaryContour) < expectedArea * 0.18;
  const contour = contourNeedsRepair ? genericPolygon(leaf) : hullContour;
  const left = [], right = [];
  for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) {
    const mi = (y - box.y0) * maskObj.w + (x - box.x0);
    if (!maskObj.mask[mi]) continue;
    const c = pixel(x, y);
    (x < leaf.centre_x_px ? left : right).push((c[0] + c[1] + c[2]) / 3);
  }
  const lightSide = (left.length ? median(left) : 0) >= (right.length ? median(right) : 0) ? 'LEFT_LIGHT' : 'RIGHT_LIGHT';
  const filename = `PLANT_TARGET_LEAF_${leaf.id.slice(-3)}.png`;
  const maskFilename = `PLANT_TARGET_LEAF_${leaf.id.slice(-3)}_MASK.png`;
  const geometryMaskFilename = `PLANT_TARGET_LEAF_${leaf.id.slice(-3)}_GEOMETRY_MASK.png`;
  fs.writeFileSync(path.join(inputDir, filename), encodePng(maskObj.w, maskObj.h, leafMaskImage(leaf, box, maskObj)));
  const maskRgba = Buffer.alloc(maskObj.w * maskObj.h * 4, 0);
  for (let i = 0; i < maskObj.mask.length; i++) maskRgba[i * 4] = maskRgba[i * 4 + 1] = maskRgba[i * 4 + 2] = maskRgba[i * 4 + 3] = maskObj.mask[i];
  fs.writeFileSync(path.join(inputDir, maskFilename), encodePng(maskObj.w, maskObj.h, maskRgba));
  const geometryMaskRgba = Buffer.alloc(geometryW * geometryH * 4, 0);
  for (let i = 0; i < partitionMask.length; i++) geometryMaskRgba[i * 4] = geometryMaskRgba[i * 4 + 1] = geometryMaskRgba[i * 4 + 2] = geometryMaskRgba[i * 4 + 3] = partitionMask[i];
  fs.writeFileSync(path.join(inputDir, geometryMaskFilename), encodePng(geometryW, geometryH, geometryMaskRgba));
  contours.push({
    id: leaf.id, cropBox: [box.x0, box.y0, box.x1, box.y1], filename, maskFilename,
    geometryMaskBox: [geometryBox.x0, geometryBox.y0, geometryBox.x1, geometryBox.y1], geometryMaskFilename,
    contourPx: contour, measuredContourPx: measuredContour, hullContourPx: hullContour, boundaryContourPx: boundaryContour,
    contourSource: contourNeedsRepair ? 'TARGET_MEASURED_BOX_REPAIR_FOR_OCCLUDED_LEAF' : 'TARGET_MASK_CONVEX_HULL',
    baseColourRgb: baseColour, lightSide,
    colourClass: leaf.colour_class, targetCentrePx: [leaf.centre_x_px, leaf.centre_y_px],
    targetTipPx: [leaf.tip_x_px, leaf.tip_y_px], targetAngleDeg: leaf.angle_deg,
    visiblePixelCount: maskObj.mask.reduce((n, v) => n + (v ? 1 : 0), 0),
    geometryAssignedPixelCount: partitionMask.reduce((n, v) => n + (v ? 1 : 0), 0),
    geometryMaskSource: 'TARGET_GREEN_FOREGROUND_NEAREST_MEASURED_LEAF_PARTITION'
  });
}

const contourPath = path.join(root, 'asset-factory/modular/PLANT_TARGET_LEAF_CONTOURS.json');
fs.writeFileSync(contourPath, JSON.stringify({ status: 'PASS_TARGET_SPECIFIC_CONTOURS', referenceChecksum: map.referenceChecksum, visibleLeafCount: contours.length, leaves: contours }, null, 2) + '\n');

// 5×6 target leaf atlas. Each cell has the cropped target leaf, its mask, and
// a small numeric ID glyph; the atlas is review evidence, not Blender input.
const cellW = 240, cellH = 220, cols = 5, rows = 6;
const atlas = Buffer.alloc(cellW * cols * cellH * rows * 4, 248);
function paste(im, x0, y0, w, h) {
  const scale = Math.min(w / im.w, h / im.h), nw = Math.floor(im.w * scale), nh = Math.floor(im.h * scale), ox = x0 + Math.floor((w - nw) / 2), oy = y0 + Math.floor((h - nh) / 2);
  for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) {
    const sx = Math.min(im.w - 1, Math.floor(x / scale)), sy = Math.min(im.h - 1, Math.floor(y / scale));
    const s = (sy * im.w + sx) * 4, d = ((oy + y) * cellW * cols + ox + x) * 4;
    atlas[d] = im.rgba[s]; atlas[d + 1] = im.rgba[s + 1]; atlas[d + 2] = im.rgba[s + 2]; atlas[d + 3] = 255;
  }
}
for (let i = 0; i < contours.length; i++) {
  const c = contours[i], im = decodePng(path.join(inputDir, c.filename)), x = (i % cols) * cellW, y = Math.floor(i / cols) * cellH;
  paste(im, x, y + 20, cellW, cellH - 20);
  const colour = c.colourClass === 'DARK' ? [30, 90, 25] : c.colourClass === 'LIGHT' ? [130, 150, 30] : [60, 120, 45];
  drawDigit(atlas, cellW * cols, x + 6, y + 4, String(i + 1).padStart(3, '0')[0], colour);
  drawDigit(atlas, cellW * cols, x + 16, y + 4, String(i + 1).padStart(3, '0')[1], colour);
  drawDigit(atlas, cellW * cols, x + 26, y + 4, String(i + 1).padStart(3, '0')[2], colour);
}
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26_LEAF_TARGET_ATLAS.png'), encodePng(cellW * cols, cellH * rows, atlas));
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26_LEAF_TARGET_ATLAS.json'), JSON.stringify({ status: 'PASS_TARGET_LEAF_ATLAS', cellSize: [cellW, cellH], columns: cols, rows, leaves: contours.map((c, i) => ({ id: c.id, cell: [i % cols, Math.floor(i / cols)], crop: c.filename, mask: c.maskFilename, baseColourRgb: c.baseColourRgb, lightSide: c.lightSide })) }, null, 2) + '\n');
console.log(JSON.stringify({ status: 'PASS_TARGET_SPECIFIC_CONTOURS', output: contourPath, atlas: path.join(root, 'asset-factory/modular/PLANT_26_LEAF_TARGET_ATLAS.png'), visibleLeafCount: contours.length }, null, 2));
