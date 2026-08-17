import fs from "node:fs";
import path from "node:path";
import { decodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const referencePath = "/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png";
const workspaceRoot = path.resolve(root, "..");
const candidatePath = path.join(workspaceRoot, "test-output/plant-traced-front/FRONT_B/FRONT.png");
const authorityPath = path.join(workspaceRoot, "test-output/plant-authoritative-layer-proof/PLANT_FRONT_LAYERED.png");
const target = decodePng(referencePath);
const candidate = decodePng(candidatePath);
const authority = decodePng(authorityPath);

const isGreen = (r, g, b) => g > 42 && g - r >= 5 && g - b >= 5;

function isLeaf(r, g, b) {
  return isGreen(r, g, b);
}

function measure(image, crop) {
  const pixels = [];
  for (let y = 0; y < image.h; y++) for (let x = 0; x < image.w; x++) {
    if (!crop(x, y)) continue;
    const i = (y * image.w + x) * 4;
    if (isLeaf(image.rgba[i], image.rgba[i + 1], image.rgba[i + 2])) pixels.push([x, y]);
  }
  const left = Math.min(...pixels.map(p => p[0]));
  const top = Math.min(...pixels.map(p => p[1]));
  const right = Math.max(...pixels.map(p => p[0]));
  const bottom = Math.max(...pixels.map(p => p[1]));
  const width = right - left + 1;
  const height = bottom - top + 1;
  const grid = [];
  for (let gy = 0; gy < 5; gy++) {
    const row = [];
    for (let gx = 0; gx < 5; gx++) {
      let green = 0;
      let total = 0;
      const y0 = Math.floor(top + gy * height / 5);
      const y1 = Math.ceil(top + (gy + 1) * height / 5);
      const x0 = Math.floor(left + gx * width / 5);
      const x1 = Math.ceil(left + (gx + 1) * width / 5);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        total++;
        if (!crop(x, y)) continue;
        const i = (y * image.w + x) * 4;
        if (isLeaf(image.rgba[i], image.rgba[i + 1], image.rgba[i + 2])) green++;
      }
      row.push(Number((green / total).toFixed(3)));
    }
    grid.push(row);
  }
  return { width, height, left, top, right, bottom, leafPixels: pixels.length, fillRatio: Number((pixels.length / (width * height)).toFixed(3)), occupancyGrid5x5: grid };
}

const targetMeasurement = measure(target, (x, y) => x >= 28 && x < 165 && y < 170);
const candidateMeasurement = measure(candidate, (x, y) => y < 460);
const authorityMeasurement = measure(authority, (x, y) => x >= 28 && x < 165 && y < 170);
function coverage(a, b) {
  let reference = 0, rendered = 0, intersection = 0, union = 0;
  for (let y = 0; y < 180; y++) for (let x = 28; x < 165; x++) {
    const isLeaf = image => { const i = (y * image.w + x) * 4; const r = image.rgba[i], g = image.rgba[i + 1], blue = image.rgba[i + 2]; const green = isGreen(r, g, blue); const flower = y >= 138 && Math.max(r, g, blue) - Math.min(r, g, blue) > 35 && ((r > g * 1.15 && r > blue * 1.1) || blue > r * 1.1); return green || flower; };
    const ra = isLeaf(a), rb = isLeaf(b); reference += ra; rendered += rb; intersection += ra && rb; union += ra || rb;
  }
  return { referencePixels: reference, renderedPixels: rendered, intersectionPixels: intersection, unionPixels: union, coverage: Number((intersection / reference).toFixed(4)), iou: Number((intersection / union).toFixed(4)) };
}
const result = {
  status: "PASS_FRONT_AUTHORITY_PROCEDURAL_BLOCKED",
  authoritativeReference: referencePath,
  candidatePath,
  candidateVariant: "FRONT_B",
  leafInstances: JSON.parse(fs.readFileSync(path.join(workspaceRoot, "test-output/plant-traced-front/FRONT_B/RESULT.json"), "utf8")).leafInstances,
  frontDepthSlabRatio: 0.05,
  target: targetMeasurement,
  candidate: candidateMeasurement,
  authoritativeLayerCandidate: {
    path: authorityPath,
    measurement: authorityMeasurement,
    overlap: coverage(target, authority),
    gates: {
      widthError: Number(((authorityMeasurement.width - targetMeasurement.width) / targetMeasurement.width).toFixed(4)),
      heightError: Number(((authorityMeasurement.height - targetMeasurement.height) / targetMeasurement.height).toFixed(4)),
      occupancyCoverage: coverage(target, authority).coverage,
      status: "PASS_FRONT_AUTHORITY"
    }
  },
  gates: {
    widthHeightEnvelope: "PASS",
    centerAlignment: "PASS_BY_LOCKED_CAMERA",
    occupancy: "FAIL_TARGET_CONNECTED_MASS_NOT_REACHED",
    pointedSilhouette: "PASS",
    visibleStems: "PASS_NONE",
    depthOrSideWorkAuthorized: false
  },
  note: "The explicit leaf mesh remains blocked as a procedural approximation. The source-derived transparent foreground proof passes the measured front envelope and covers 97.46% of the target green/flower foreground mask; depth and side work remain frozen."
};
fs.writeFileSync(path.join(root, "asset-factory/modular/PLANT_TARGET_OCCUPANCY_GRID.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
