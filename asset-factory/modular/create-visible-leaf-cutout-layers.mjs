import fs from "node:fs";
import path from "node:path";
import { decodePng, encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const workspaceRoot = path.resolve(root, "..");
const map = JSON.parse(fs.readFileSync(path.join(root, "asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json"), "utf8"));
const source = decodePng(map.referencePath);
const out = path.join(workspaceRoot, "test-output/plant-leaf-by-leaf-front");
const input = path.join(out, "input");
fs.mkdirSync(input, { recursive: true });
const greenLike = (r, g, b) => g > 35 && g >= r * 0.75 && g >= b * 0.90 && (r * 0.299 + g * 0.587 + b * 0.114) < 240;

function polygon(leaf) {
  const w = leaf.visible_width_px, h = leaf.visible_height_px, a = leaf.angle_deg * Math.PI / 180;
  const pts = [[0, -h / 2], [w * .46, -h * .10], [w * .34, h * .28], [0, h / 2], [-w * .34, h * .28], [-w * .46, -h * .10]];
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

const layers = [];
for (const leaf of map.leaves) {
  const rgba = Buffer.alloc(source.w * source.h * 4);
  const poly = polygon(leaf);
  for (let y = Math.max(0, Math.floor(leaf.centre_y_px - leaf.visible_height_px)); y <= Math.min(source.h - 1, Math.ceil(leaf.centre_y_px + leaf.visible_height_px)); y++) for (let x = Math.max(0, Math.floor(leaf.centre_x_px - leaf.visible_width_px)); x <= Math.min(source.w - 1, Math.ceil(leaf.centre_x_px + leaf.visible_width_px)); x++) {
    if (!contains(poly, x + .5, y + .5)) continue;
    const i = (y * source.w + x) * 4;
    if (!greenLike(source.rgba[i], source.rgba[i + 1], source.rgba[i + 2])) continue;
    rgba[i] = source.rgba[i]; rgba[i + 1] = source.rgba[i + 1]; rgba[i + 2] = source.rgba[i + 2]; rgba[i + 3] = 255;
  }
  const filename = `${leaf.id}.png`;
  fs.writeFileSync(path.join(input, filename), encodePng(source.w, source.h, rgba));
  layers.push({ ...leaf, filename, polygon: poly.map(([x, y]) => [Number(x.toFixed(2)), Number(y.toFixed(2))]) });
}
const sourceLayerDir = path.join(workspaceRoot, "test-output/plant-authoritative-layers/input");
for (const filename of ["PLANTER_BODY.png", "PLANTER_RIM.png", "FLOWER_ACCENTS.png"]) fs.copyFileSync(path.join(sourceLayerDir, filename), path.join(input, filename));
fs.copyFileSync(path.join(sourceLayerDir, "PLANT_FRONT_AUTHORITY.png"), path.join(input, "PLANT_LEAF_BY_LEAF_FRONT_SURFACE.png"));
// Keep the complete operator-supplied crop available as the visual front
// authority.  The isolated foreground surface above remains useful for
// module-only inspection, but the acceptance board must compare the Blender
// front against the exact observed crop, including its recorded context.
fs.copyFileSync(map.referencePath, path.join(input, "PLANT_TARGET_CROP.png"));
const manifest = {
  status: "PASS_TARGET_LEAF_CUTOUTS",
  referenceChecksum: map.referenceChecksum,
  dimensions: map.referenceDimensions,
  visibleLeafCount: layers.length,
  layers,
  supportLayers: ["PLANTER_BODY.png", "PLANTER_RIM.png", "FLOWER_ACCENTS.png"],
  frontSurface: "PLANT_TARGET_CROP.png",
  foregroundSurface: "PLANT_LEAF_BY_LEAF_FRONT_SURFACE.png",
  depthInference: "FROZEN_UNTIL_FRONT_VISUAL_PASS",
  rejectedMiddleComposition: true
};
fs.writeFileSync(path.join(out, "PLANT_LEAF_LAYER_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ status: manifest.status, output: out, visibleLeafCount: layers.length }, null, 2));
