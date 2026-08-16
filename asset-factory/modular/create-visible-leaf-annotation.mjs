import fs from "node:fs";
import path from "node:path";
import { decodePng, encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const workspaceRoot = path.resolve(root, "..");
const map = JSON.parse(fs.readFileSync(path.join(root, "asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json"), "utf8"));
const source = decodePng(map.referencePath);
const scale = 4, W = source.w * scale, H = source.h * scale;
const out = Buffer.from(source.rgba);
const rgba = Buffer.alloc(W * H * 4);
for (let y = 0; y < source.h; y++) for (let x = 0; x < source.w; x++) for (let oy = 0; oy < scale; oy++) for (let ox = 0; ox < scale; ox++) {
  const s = (y * source.w + x) * 4, d = ((y * scale + oy) * W + x * scale + ox) * 4;
  rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = 255;
}
const color = { DARK: [220, 50, 50], MID: [40, 110, 230], LIGHT: [220, 130, 30] };
function pix(x, y, c) { if (x < 0 || y < 0 || x >= W || y >= H) return; const i = (y * W + x) * 4; rgba[i] = c[0]; rgba[i + 1] = c[1]; rgba[i + 2] = c[2]; rgba[i + 3] = 255; }
function line(x0, y0, x1, y1, c) { x0 *= scale; y0 *= scale; x1 *= scale; y1 *= scale; const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let err = dx + dy; while (true) { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) pix(x0 + ox, y0 + oy, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } } }
function rect(x, y, w, h, c) { line(x, y, x + w, y, c); line(x + w, y, x + w, y + h, c); line(x + w, y + h, x, y + h, c); line(x, y + h, x, y, c); }
const glyphs = {"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["110","001","010","100","111"],"3":["110","001","010","001","110"],"4":["101","101","111","001","001"],"5":["111","100","110","001","110"],"6":["011","100","111","101","111"],"7":["111","001","010","010","010"],"8":["111","101","111","101","111"],"9":["111","101","111","001","110"]};
function text(value, x, y, c) { let ox = x * scale; for (const ch of String(value)) { const g = glyphs[ch] || glyphs["0"]; for (let gy = 0; gy < g.length; gy++) for (let gx = 0; gx < 3; gx++) if (g[gy][gx] === "1") for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) pix(ox + gx * 2 + sx, y * scale + gy * 2 + sy, c); ox += 9; } }
for (const leaf of map.leaves) {
  const c = color[leaf.colour_class] || [255, 255, 255];
  rect(leaf.centre_x_px - leaf.visible_width_px / 2, leaf.centre_y_px - leaf.visible_height_px / 2, leaf.visible_width_px, leaf.visible_height_px, c);
  line(leaf.centre_x_px, leaf.centre_y_px, leaf.tip_x_px, leaf.tip_y_px, c);
  for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) pix((leaf.centre_x_px + ox) * scale, (leaf.centre_y_px + oy) * scale, c);
  text(leaf.id.slice(-3), leaf.centre_x_px - leaf.visible_width_px / 2, leaf.centre_y_px - leaf.visible_height_px / 2 - 7, c);
}
const output = path.join(workspaceRoot, "test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png");
fs.writeFileSync(output, encodePng(W, H, rgba));
console.log(JSON.stringify({ status: "PASS", output, visibleLeafCount: map.leaves.length }, null, 2));
