import fs from "node:fs";
import path from "node:path";
import { decodePng, encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";
const source = "/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png";
const im = decodePng(source), scale = 4, out = Buffer.alloc(im.w * scale * im.h * scale * 4);
for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) for (let oy = 0; oy < scale; oy++) for (let ox = 0; ox < scale; ox++) {
  const s = (y * im.w + x) * 4, d = ((y * scale + oy) * im.w * scale + x * scale + ox) * 4;
  out[d] = im.rgba[s]; out[d + 1] = im.rgba[s + 1]; out[d + 2] = im.rgba[s + 2]; out[d + 3] = 255;
}
const output = path.resolve(import.meta.dirname, "../../..", "test-output/PLANT_TARGET_ENLARGED.png");
fs.writeFileSync(output, encodePng(im.w * scale, im.h * scale, out));
console.log(output);
