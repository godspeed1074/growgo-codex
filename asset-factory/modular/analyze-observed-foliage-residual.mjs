import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const mapPath = path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const targetPath = map.referencePath;
const fullDir = path.join(root, 'test-output/plant-26-leaf-production/full');
const target = decodePng(targetPath);
const beauty = decodePng(path.join(fullDir, 'PLANT_26LEAF_TARGETSPECIFIC_FRONT.png'));
const component = decodePng(path.join(fullDir, 'PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png'));
const W = target.w, H = target.h;
const targetMask = new Uint8Array(W * H);
const observedMask = new Uint8Array(W * H);

// Target foliage is measured from the supplied crop, not from a reference
// image placed into Blender.  Keep the crop's green family and exclude the
// planter/rim, flowers and white/background pixels by height and colour.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = (y * W + x) * 4;
  const r = target.rgba[p], g = target.rgba[p + 1], b = target.rgba[p + 2];
  targetMask[y * W + x] = y >= 25 && y < 170 && g > r + 3 && g >= b * .9 && r + g + b < 740 ? 1 : 0;
  const br = beauty.rgba[p], bg = beauty.rgba[p + 1], bb = beauty.rgba[p + 2];
  observedMask[y * W + x] = y < 170 && bg > br + 3 && bg >= bb * .9 && br + bg + bb < 740 ? 1 : 0;
}

// The 26 measured masks are the authoritative leaf decomposition.  Their
// union is retained separately so the report can distinguish transition
// foliage from a leaf whose measured visible region already exists.
const leafMasks = [];
const union26 = new Uint8Array(W * H);
for (const leaf of map.leaves) {
  const spec = JSON.parse(fs.readFileSync(path.join(root, 'test-output/plant-26-leaf-production/specs', `${leaf.id}.json`), 'utf8'));
  const mask = decodePng(spec.visibleMask);
  const [x0, y0] = spec.cropBox;
  const local = new Uint8Array(W * H);
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) {
    if (mask.rgba[(y * mask.w + x) * 4 + 3] >= 128) {
      const i = (y0 + y) * W + x0 + x;
      local[i] = 1; union26[i] = 1;
    }
  }
  leafMasks.push({ id: leaf.id, mask: local });
}

const residual = new Uint8Array(W * H);
for (let i = 0; i < residual.length; i++) residual[i] = targetMask[i] && !observedMask[i] ? 1 : 0;

function bounds(mask) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1, area = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x]) {
    area++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return area ? { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1, area } : null;
}
function saveMask(file, mask, colour) {
  const rgba = Buffer.alloc(W * H * 4, 0);
  for (let i = 0; i < mask.length; i++) if (mask[i]) {
    rgba[i * 4] = colour[0]; rgba[i * 4 + 1] = colour[1]; rgba[i * 4 + 2] = colour[2]; rgba[i * 4 + 3] = 255;
  }
  fs.writeFileSync(file, encodePng(W, H, rgba));
}
function connected(mask) {
  const seen = new Uint8Array(mask.length), regions = [];
  const dirs = [-1, 0, 1];
  for (let sy = 0; sy < H; sy++) for (let sx = 0; sx < W; sx++) {
    const start = sy * W + sx;
    if (!mask[start] || seen[start]) continue;
    const queue = [start]; seen[start] = 1; const pixels = [];
    while (queue.length) {
      const i = queue.pop(), y = Math.floor(i / W), x = i - y * W; pixels.push([x, y]);
      for (const dy of dirs) for (const dx of dirs) {
        if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        const ni = ny * W + nx; if (mask[ni] && !seen[ni]) { seen[ni] = 1; queue.push(ni); }
      }
    }
    regions.push(pixels);
  }
  return regions;
}
function dominantColour(pixels) {
  const bins = new Map();
  for (const [x, y] of pixels) {
    const p = (y * W + x) * 4; const key = [Math.floor(target.rgba[p] / 16) * 16, Math.floor(target.rgba[p + 1] / 16) * 16, Math.floor(target.rgba[p + 2] / 16) * 16].join(',');
    bins.set(key, (bins.get(key) || 0) + 1);
  }
  const [key, count] = [...bins.entries()].sort((a, b) => b[1] - a[1])[0] || ['0,0,0', 0];
  return { rgb16: key.split(',').map(Number), pixels: count };
}
function convexHull(points) {
  const unique = [...new Set(points.map(([x, y]) => `${x},${y}`))].map((v) => v.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (unique.length <= 3) return unique;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of unique) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  const upper = [];
  for (const p of unique.slice().reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
function pixelBoundaryContour(pixels) {
  const set = new Set(pixels.map(([x, y]) => `${x},${y}`));
  const edges = [];
  for (const [x, y] of pixels) {
    if (!set.has(`${x},${y - 1}`)) edges.push([[x, y], [x + 1, y]]);
    if (!set.has(`${x + 1},${y}`)) edges.push([[x + 1, y], [x + 1, y + 1]]);
    if (!set.has(`${x},${y + 1}`)) edges.push([[x + 1, y + 1], [x, y + 1]]);
    if (!set.has(`${x - 1},${y}`)) edges.push([[x, y + 1], [x, y]]);
  }
  const byStart = new Map(); for (const edge of edges) { const key = edge[0].join(','); if (!byStart.has(key)) byStart.set(key, []); byStart.get(key).push(edge); }
  const used = new Set(), loops = [];
  for (const edge of edges) {
    const startKey = edge[0].join(','); const edgeKey = `${startKey}>${edge[1].join(',')}`; if (used.has(edgeKey)) continue;
    const loop = [edge[0]]; let current = edge, guard = 0;
    while (guard++ < edges.length + 4) {
      const key = `${current[0].join(',')}>${current[1].join(',')}`; used.add(key); loop.push(current[1]);
      const nextStart = current[1].join(','); if (nextStart === startKey) break;
      const next = (byStart.get(nextStart) || []).find((candidate) => !used.has(`${candidate[0].join(',')}>${candidate[1].join(',')}`));
      if (!next) break; current = next;
    }
    if (loop.length >= 4 && loop[0][0] === loop.at(-1)[0] && loop[0][1] === loop.at(-1)[1]) {
      const open = loop.slice(0, -1), simplified = [];
      for (const point of open) {
        const prev = simplified.at(-1), next = open[(open.indexOf(point) + 1) % open.length];
        if (!prev || (prev[0] !== point[0] || prev[1] !== point[1])) simplified.push(point);
      }
      let changed = true;
      while (changed && simplified.length > 3) { changed = false; for (let i = 0; i < simplified.length; i++) { const a = simplified[(i + simplified.length - 1) % simplified.length], b = simplified[i], c = simplified[(i + 1) % simplified.length]; if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) { simplified.splice(i, 1); changed = true; break; } } }
      loops.push(simplified);
    }
  }
  return loops.sort((a, b) => b.length - a.length)[0] || convexHull(pixels);
}
function neighbours(pixels) {
  const set = new Set();
  for (const [x, y] of pixels) for (const leaf of leafMasks) {
    let hit = false;
    for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy; if (nx >= 0 && nx < W && ny >= 0 && ny < H && leaf.mask[ny * W + nx]) { hit = true; break; }
    }
    if (hit) set.add(leaf.id);
  }
  return [...set].sort();
}
function regionClassification(pixels, neighbourIds) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (const [x, y] of pixels) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const width = maxX - minX + 1, height = maxY - minY + 1;
  const edge = pixels.some(([x, y]) => {
    const n = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    return n.some(([nx, ny]) => nx < 0 || nx >= W || ny < 0 || ny >= H || !targetMask[ny * W + nx]);
  });
  const flowerBand = minY >= 150 || (minY < 170 && maxY >= 155 && neighbourIds.some((id) => ['LEAF_023', 'LEAF_024', 'LEAF_025', 'LEAF_026'].includes(id)));
  if (flowerBand) return { code: 'D', label: 'FLOWER_FOLIAGE_INTERACTION', reason: 'lower foliage overlaps the temporary flower band' };
  if (pixels.length < 6 || (width <= 3 && height <= 6)) return { code: 'E', label: 'TRUE_NEGATIVE_SPACE', reason: 'small isolated residual not supported as a visible foliage element' };
  const pointed = edge && (width >= 5 || height >= 5);
  if (pointed && pixels.length >= 24) return { code: 'A', label: 'PARTIALLY_OCCLUDED_OBSERVED_LEAF', reason: 'connected pointed contour has visible leaf evidence' };
  return { code: 'B', label: 'OBSERVED_BACKING_TRANSITION_FOLIAGE', reason: 'visible green area lacks enough exposed contour to identify a complete leaf' };
}

const residualPath = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_MASK.png');
saveMask(residualPath, residual, [255, 30, 20]);
const regions = connected(residual).map((pixels, index) => {
  const xs = pixels.map((p) => p[0]), ys = pixels.map((p) => p[1]);
  const bbox = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), width: Math.max(...xs) - Math.min(...xs) + 1, height: Math.max(...ys) - Math.min(...ys) + 1 };
  const neighbourIds = neighbours(pixels);
  const classification = regionClassification(pixels, neighbourIds);
  const boundary = pixels.filter(([x, y]) => [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => nx < 0 || nx >= W || ny < 0 || ny >= H || !residual[ny * W + nx]));
  return { REGION_ID: `REGION_${String(index + 1).padStart(3, '0')}`, pixelArea: pixels.length, boundingBox: bbox, centre: [Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2)), Number((ys.reduce((a, b) => a + b, 0) / ys.length).toFixed(2))], dominantTargetColour: dominantColour(pixels), neighboringLeafIds: neighbourIds, edgeTipEvidence: { edgeContact: classification.code !== 'E', pointedContourCandidate: classification.code === 'A' }, probableInterpretation: classification, contourPx: pixelBoundaryContour(pixels), pixels };
}).filter((r) => r.pixelArea >= 4).sort((a, b) => b.pixelArea - a.pixelArea);

// Outline residual boundaries over the target crop for operator inspection.
const outlined = Buffer.from(target.rgba);
for (const r of regions) for (const [x, y] of r.pixels) {
  const boundary = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([nx, ny]) => nx < 0 || nx >= W || ny < 0 || ny >= H || !residual[ny * W + nx]);
  if (boundary) { const p = (y * W + x) * 4; outlined[p] = 255; outlined[p + 1] = 0; outlined[p + 2] = 0; outlined[p + 3] = 255; }
}
const outlinedPath = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_OUTLINED.png');
fs.writeFileSync(outlinedPath, encodePng(W, H, outlined));

const boardW = 1200, boardH = 900, panelW = 270, panelH = 380, board = Buffer.alloc(boardW * boardH * 4, 246);
for (let i = 0; i < board.length; i += 4) { board[i] = 246; board[i + 1] = 245; board[i + 2] = 241; board[i + 3] = 255; }
function fit(im, w, h) { const out = Buffer.alloc(w * h * 4, 250), scale = Math.min(w / im.w, h / im.h), nw = Math.max(1, Math.floor(im.w * scale)), nh = Math.max(1, Math.floor(im.h * scale)), ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2); for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const sx = Math.min(im.w - 1, Math.floor(x / scale)), sy = Math.min(im.h - 1, Math.floor(y / scale)), s = (sy * im.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4; out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255; } return { w, h, rgba: out }; }
function paste(im, x, y) { for (let yy = 0; yy < im.h; yy++) im.rgba.copy(board, ((y + yy) * boardW + x) * 4, yy * im.w * 4, (yy + 1) * im.w * 4); }
const residualOverlay = Buffer.from(target.rgba); for (let i = 0; i < residual.length; i++) if (residual[i]) { residualOverlay[i * 4] = 255; residualOverlay[i * 4 + 1] = 20; residualOverlay[i * 4 + 2] = 10; residualOverlay[i * 4 + 3] = 255; }
const panels = [target, beauty, { w: W, h: H, rgba: residualOverlay }, { w: W, h: H, rgba: outlined }, component];
for (let i = 0; i < panels.length; i++) paste(fit(panels[i], panelW, panelH), 20 + (i % 4) * 295, 20 + Math.floor(i / 4) * 440);
const boardPath = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_BOARD.png');
fs.writeFileSync(boardPath, encodePng(boardW, boardH, board));

const targetArea = targetMask.reduce((a, b) => a + b, 0), observedArea = observedMask.reduce((a, b) => a + b, 0), residualArea = residual.reduce((a, b) => a + b, 0);
const report = { status: 'PASS_OBSERVED_FOLIAGE_RESIDUAL_ANALYZED', sourceTarget: targetPath, final26Beauty: 'test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png', targetFoliageMask: { area: targetArea, bounds: bounds(targetMask), method: 'green-family target pixels y=25..169; flowers/planter excluded by y and green-family constraints' }, final26RenderedMask: { area: observedArea, bounds: bounds(observedMask), method: 'same green-family threshold used by full-front evaluator' }, residualPixelArea: residualArea, residualPercentOfTarget: Number((residualArea / targetArea * 100).toFixed(3)), regions: regions.map(({ pixels, ...rest }) => rest), classifications: regions.reduce((a, r) => { a[r.probableInterpretation.code] = (a[r.probableInterpretation.code] || 0) + 1; return a; }, {}), outputs: { mask: residualPath, outlined: outlinedPath, board: boardPath }, geometryOnly: true, referenceTextureUsedInBeauty: false, flowersFinal: false, planterFinal: false, depthPerformed: false, leafIdsFrozen: map.leaves.map((l) => `LEAF_OBS_${l.id.slice(5)}`) };
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_REGIONS.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, regions: report.regions.map((r) => ({ id: r.REGION_ID, area: r.pixelArea, bbox: r.boundingBox, class: r.probableInterpretation.code, neighbours: r.neighboringLeafIds })) }, null, 2));
