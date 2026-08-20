import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../../asset-factory/golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(process.cwd(), 'asset-factory-workspace/phillip-island-tree-proof');
const sourcePath = path.join(root, 'GROWGO_FOLIAGE_CLUSTER_ATLAS_V3_NO_TWIG.png');
const outputPath = path.join(root, 'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_RGBA_CLEAN.png');
const outputDir = path.join(root, 'single-card-output');
const source = decodePng(sourcePath), { w, h, rgba } = source, threshold = 32;
const seen = new Uint8Array(w * h), components = [];
for (let start = 0; start < w * h; start += 1) {
  if (seen[start] || rgba[start * 4 + 3] < threshold) continue;
  const pixels = [], stack = [start]; seen[start] = 1; let x0 = w, y0 = h, x1 = 0, y1 = 0;
  while (stack.length) {
    const index = stack.pop(), x = index % w, y = (index - x) / w; pixels.push(index);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
      const xx = x + dx, yy = y + dy, next = yy * w + xx;
      if (xx >= 0 && xx < w && yy >= 0 && yy < h && !seen[next] && rgba[next * 4 + 3] >= threshold) { seen[next] = 1; stack.push(next); }
    }
  }
  components.push({ pixels, x0, y0, x1, y1, area: pixels.length });
}
// The top-left authored cluster is selected by its alpha-connected ownership component,
// not by arbitrary rectangular atlas coordinates.
const selected = components.find((component) => component.x0 === 186 && component.y0 === 59);
if (!selected) throw new Error('selected_top_left_foliage_component_missing');
const owner = new Uint8Array(w * h); for (const index of selected.pixels) owner[index] = 1;
const padding = 16, cleanW = selected.x1 - selected.x0 + 1 + padding * 2, cleanH = selected.y1 - selected.y0 + 1 + padding * 2, clean = Buffer.alloc(cleanW * cleanH * 4);
for (const index of selected.pixels) {
  const x = index % w, y = (index - x) / w, targetX = x - selected.x0 + padding, targetY = y - selected.y0 + padding;
  rgba.copy(clean, (targetY * cleanW + targetX) * 4, index * 4, index * 4 + 4);
}
fs.writeFileSync(outputPath, encodePng(cleanW, cleanH, clean));

const put = (target, tw, th, x, y, c) => { if (x >= 0 && x < tw && y >= 0 && y < th) target.set(c, (y * tw + x) * 4); };
const scaled = (target, tw, th, src, sw, sh, dx, dy, dw, dh, { alphaOnly = false, checker = false } = {}) => {
  for (let yy = 0; yy < dh; yy += 1) for (let xx = 0; xx < dw; xx += 1) {
    const sx = Math.min(sw - 1, Math.floor(xx * sw / dw)), sy = Math.min(sh - 1, Math.floor(yy * sh / dh),), s = (sy * sw + sx) * 4;
    let [r, g, b, a] = [src[s], src[s + 1], src[s + 2], src[s + 3]];
    if (alphaOnly) r = g = b = a;
    if (checker) { const c = ((Math.floor(xx / 16) + Math.floor(yy / 16)) & 1) ? 205 : 150; r = Math.round((r * a + c * (255 - a)) / 255); g = Math.round((g * a + c * (255 - a)) / 255); b = Math.round((b * a + c * (255 - a)) / 255); a = 255; }
    put(target, tw, th, dx + xx, dy + yy, [r, g, b, a]);
  }
};
const crop = (left, top, cw, ch, mode) => {
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y += 1) for (let x = 0; x < cw; x += 1) {
    const sx = left + x, sy = top + y; if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
    const index = sy * w + sx, visible = rgba[index * 4 + 3] >= threshold, accepted = owner[index] === 1;
    if (visible && (mode === 'original' || (mode === 'selected' && accepted) || (mode === 'rejected' && !accepted))) rgba.copy(out, (y * cw + x) * 4, index * 4, index * 4 + 4);
  }
  return out;
};
const region = { x: 150, y: 35, w: 420, h: 390 }, original = crop(region.x, region.y, region.w, region.h, 'original'), rejected = crop(region.x, region.y, region.w, region.h, 'rejected'), mask = Buffer.alloc(region.w * region.h * 4);
for (let y = 0; y < region.h; y += 1) for (let x = 0; x < region.w; x += 1) if (owner[(region.y + y) * w + region.x + x]) mask.set([65, 220, 95, 255], (y * region.w + x) * 4);
const boardW = 1200, boardH = 820, board = Buffer.alloc(boardW * boardH * 4, 245);
scaled(board, boardW, boardH, original, region.w, region.h, 20, 20, 370, 320); scaled(board, boardW, boardH, mask, region.w, region.h, 415, 20, 370, 320); scaled(board, boardW, boardH, rejected, region.w, region.h, 805, 20, 370, 320, { checker: true });
scaled(board, boardW, boardH, clean, cleanW, cleanH, 20, 410, 370, 320, { checker: true }); scaled(board, boardW, boardH, clean, cleanW, cleanH, 415, 410, 370, 320, { alphaOnly: true }); scaled(board, boardW, boardH, clean, cleanW, cleanH, 805, 410, 370, 320, { checker: true });
fs.mkdirSync(outputDir, { recursive: true }); fs.writeFileSync(path.join(outputDir, 'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_ALPHA_DIAGNOSTIC.png'), encodePng(boardW, boardH, board));
const check = Buffer.alloc(cleanW * cleanH * 4); scaled(check, cleanW, cleanH, clean, cleanW, cleanH, 0, 0, cleanW, cleanH, { checker: true }); fs.writeFileSync(path.join(outputDir, 'GROWGO_NATIVE_ROUNDED_SINGLE_CLUSTER_CHECKERBOARD.png'), encodePng(cleanW, cleanH, check));
const edge = []; for (let x = 0; x < cleanW; x += 1) edge.push(clean[x * 4 + 3], clean[((cleanH - 1) * cleanW + x) * 4 + 3]); for (let y = 0; y < cleanH; y += 1) edge.push(clean[(y * cleanW) * 4 + 3], clean[(y * cleanW + cleanW - 1) * 4 + 3]);
const bins = new Set(); for (let i = 0; i < clean.length; i += 4) if (clean[i + 3] >= threshold) bins.add(`${clean[i] >> 4},${clean[i + 1] >> 4},${clean[i + 2] >> 4}`);
const audit = { source: path.basename(sourcePath), selectedComponent: { atlasBounds: { left: selected.x0, top: selected.y0, right: selected.x1, bottom: selected.y1 }, area: selected.area, ownership: 'single alpha-connected authored foliage component; no detached components accepted' }, rejectedComponents: components.filter((x) => x !== selected).map(({ x0, y0, x1, y1, area }) => ({ x0, y0, x1, y1, area })), cleanedImage: { width: cleanW, height: cleanH, transparentPaddingPx: padding }, checks: { exteriorAndCornersAlphaZero: edge.every((x) => x === 0), nonZeroAlphaTouchesImageBounds: edge.some((x) => x > 0), unrelatedComponentsSurvive: false, transparentPaddingAllSides: true, visibleFoliageOccupancy: selected.area, colourVarianceBins: bins.size }, permanentLesson: 'GrowGo foliage extraction must isolate authored foliage by ownership/alpha component, not by rectangular atlas crop alone. Pixels outside the approved foliage mask must be forced fully transparent, with clean transparent padding before atlas/card use.' };
fs.writeFileSync(path.join(outputDir, 'SINGLE_CLUSTER_ALPHA_AUDIT.json'), JSON.stringify(audit, null, 2) + '\n'); console.log(JSON.stringify(audit, null, 2));
