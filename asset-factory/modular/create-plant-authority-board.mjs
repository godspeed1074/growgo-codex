import fs from "node:fs";
import path from "node:path";
import { decodePng, encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const workspaceRoot = path.resolve(root, "..");
const outputDir = path.join(workspaceRoot, "test-output");
const panels = [
  ["LOCKED REFERENCE", "/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png"],
  ["PROCEDURAL FRONT_B", path.join(outputDir, "plant-traced-front/FRONT_B/FRONT.png")],
  ["AUTHORITATIVE FRONT", path.join(outputDir, "plant-authoritative-layer-proof/PLANT_FRONT_LAYERED.png")]
];
const W = 1800, H = 980, panelW = 600, panelH = 860;
const board = Buffer.alloc(W * H * 4);
for (let i = 0; i < board.length; i += 4) { board[i] = 246; board[i + 1] = 245; board[i + 2] = 241; board[i + 3] = 255; }
function put(file, ox, oy, w, h) {
  const im = decodePng(file);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(im.w - 1, Math.floor(x * im.w / w));
    const sy = Math.min(im.h - 1, Math.floor(y * im.h / h));
    const s = (sy * im.w + sx) * 4;
    const d = ((oy + y) * W + ox + x) * 4;
    board[d] = im.rgba[s]; board[d + 1] = im.rgba[s + 1]; board[d + 2] = im.rgba[s + 2]; board[d + 3] = 255;
  }
}
for (let i = 0; i < panels.length; i++) put(panels[i][1], i * panelW, 60, panelW, panelH);
const output = path.join(outputDir, "PLANT_FRONT_AUTHORITY_REVIEW_BOARD.png");
fs.writeFileSync(output, encodePng(W, H, board));
console.log(JSON.stringify({ status: "PASS", output, panels: panels.map(p => p[0]) }, null, 2));
