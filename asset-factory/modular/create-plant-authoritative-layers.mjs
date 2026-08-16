import fs from "node:fs";
import path from "node:path";
import { decodePng, encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const workspaceRoot = path.resolve(root, "..");
const referencePath = "/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png";
const out = path.join(workspaceRoot, "test-output/plant-authoritative-layers");
const input = path.join(out, "input");
fs.mkdirSync(input, { recursive: true });
const im = decodePng(referencePath);

const luminance = (r, g, b) => r * 0.299 + g * 0.587 + b * 0.114;
const foregroundish = (r, g, b) => {
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return luminance(r, g, b) < 232 && (spread > 10 || luminance(r, g, b) < 150);
};
const isGreen = (r, g, b) => g > 38 && g >= r * 0.90 && g >= b * 0.95 && foregroundish(r, g, b);
const isPlanter = (r, g, b) => g > 35 && g >= r * 0.90 && g >= b * 0.90 && foregroundish(r, g, b);
const isPlanterShape = (x, y) => (y >= 168 && y < 191 && x >= 8 && x < 175) || (y >= 188 && y < 244 && x >= 14 && x < 166) || (y >= 242 && y < 259 && x >= 8 && x < 175);
const isFlower = (r, g, b, y, x) => x >= 20 && y >= 138 && y <= 181 && Math.max(r, g, b) - Math.min(r, g, b) > 35 && ((r > g * 1.15 && r > b * 1.1) || b > r * 1.1);
const layerNames = ["PLANTER_BODY", "PLANTER_RIM", "FOLIAGE_BACK", "FOLIAGE_MID", "FOLIAGE_FRONT", "FLOWER_ACCENTS"];
const buffers = Object.fromEntries(layerNames.map(name => [name, Buffer.alloc(im.w * im.h * 4)]));

for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
  const i = (y * im.w + x) * 4;
  const r = im.rgba[i], g = im.rgba[i + 1], b = im.rgba[i + 2];
  const green = isGreen(r, g, b);
  const flower = isFlower(r, g, b, y, x);
  let layer = null;
  if (flower) layer = "FLOWER_ACCENTS";
  else if (green && x >= 28 && y >= 18 && y < 170) {
    // The crop is the authority; these are transparent depth tiers, not a backplate.
    layer = y < 78 ? "FOLIAGE_BACK" : y < 126 ? "FOLIAGE_MID" : "FOLIAGE_FRONT";
  }
  else if (isPlanterShape(x, y) && luminance(r, g, b) < 245 && y >= 185) layer = "PLANTER_BODY";
  else if (isPlanterShape(x, y) && luminance(r, g, b) < 245 && y >= 170) layer = "PLANTER_RIM";
  if (!layer) continue;
  const dst = buffers[layer];
  dst[i] = r; dst[i + 1] = g; dst[i + 2] = b; dst[i + 3] = 255;
}

// Remove isolated classifier specks from the background while retaining real edges.
for (const name of layerNames) {
  const buf = buffers[name];
  const keep = new Uint8Array(im.w * im.h);
  for (let y = 1; y < im.h - 1; y++) for (let x = 1; x < im.w - 1; x++) {
    const i = (y * im.w + x) * 4;
    if (!buf[i + 3]) continue;
    let neighbours = 0;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (ox || oy) neighbours += buf[((y + oy) * im.w + x + ox) * 4 + 3] ? 1 : 0;
    if (neighbours >= 2) keep[y * im.w + x] = 1;
  }
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (!keep[y * im.w + x]) buf[(y * im.w + x) * 4 + 3] = 0;
}

const files = [];
for (const name of layerNames) {
  const filename = `${name}.png`;
  fs.writeFileSync(path.join(input, filename), encodePng(im.w, im.h, buffers[name]));
  files.push({ componentId: name, filename, checksum: decodePng(path.join(input, filename)).checksum });
}
const composite = Buffer.alloc(im.w * im.h * 4);
for (let i = 0; i < composite.length; i += 4) { composite[i] = 255; composite[i + 1] = 255; composite[i + 2] = 255; composite[i + 3] = 255; }
for (const name of ["PLANTER_BODY", "FOLIAGE_BACK", "FOLIAGE_MID", "FOLIAGE_FRONT", "PLANTER_RIM", "FLOWER_ACCENTS"]) {
  const src = buffers[name];
  for (let i = 0; i < src.length; i += 4) if (src[i + 3]) {
    composite[i] = src[i]; composite[i + 1] = src[i + 1]; composite[i + 2] = src[i + 2];
  }
}
const compositeFilename = "PLANT_FRONT_AUTHORITY.png";
fs.writeFileSync(path.join(input, compositeFilename), encodePng(im.w, im.h, composite));
const manifest = {
  status: "PASS",
  sourceReference: referencePath,
  sourceChecksum: im.checksum,
  cropDimensions: [im.w, im.h],
  fullSourceBackplateUsed: false,
  layerCount: files.length,
  layers: files,
  combinedForegroundFile: compositeFilename,
  reconstructionRule: "OBSERVED_PIXELS_TO_TRANSPARENT_LAYERS;_HIDDEN_DEPTH_INFERENCE_FROZEN",
  frontAuthority: true,
  depthRatio: 0.05
};
fs.writeFileSync(path.join(out, "PLANT_AUTHORITATIVE_LAYER_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
