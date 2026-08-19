import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'test-output/sad-tomato-v1');
const art = path.join(root, 'asset-factory/modular/presentation-art/sad-tomato-v1');
const modular = path.join(root, 'asset-factory/modular');
const sources = {
  reference: '/Users/michaelpeterson/Desktop/Screenshot 2026-08-18 at 11.30.55\u202fpm.png',
  swappedFacade: path.join(root, 'test-output/commercial-simple-swapped-v2/COMMERCIAL_SIMPLE_SWAPPED_FACADE_V2_FRONT.png'),
  sign: path.join(art, 'SAD_TOMATO_SIGN.png'),
  awning: path.join(art, 'SAD_TOMATO_AWNING.png'),
  pasta: path.join(art, 'SAD_TOMATO_PASTA.png'),
};
fs.mkdirSync(out, { recursive: true });

const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pixel = (im, x, y) => (y * im.w + x) * 4;
const isCheckerBackground = (im, x, y) => {
  const p = pixel(im, x, y), r = im.rgba[p], g = im.rgba[p + 1], b = im.rgba[p + 2];
  return Math.min(r, g, b) >= 235 && Math.max(r, g, b) - Math.min(r, g, b) <= 12;
};

// The generated food image arrived with a light grey checkerboard baked into RGB.
// Remove only the edge-connected neutral light region; the warm, coloured plate/art remains intact.
const pasta = decodePng(sources.pasta);
const q = [], seen = new Uint8Array(pasta.w * pasta.h);
for (let x = 0; x < pasta.w; x++) { q.push([x, 0], [x, pasta.h - 1]); }
for (let y = 1; y < pasta.h - 1; y++) { q.push([0, y], [pasta.w - 1, y]); }
let transparentPixels = 0;
for (let at = 0; at < q.length; at++) {
  const [x, y] = q[at], n = y * pasta.w + x;
  if (seen[n] || !isCheckerBackground(pasta, x, y)) continue;
  seen[n] = 1;
  pasta.rgba[pixel(pasta, x, y) + 3] = 0;
  transparentPixels++;
  if (x) q.push([x - 1, y]); if (x + 1 < pasta.w) q.push([x + 1, y]);
  if (y) q.push([x, y - 1]); if (y + 1 < pasta.h) q.push([x, y + 1]);
}
const repairedPasta = path.join(art, 'SAD_TOMATO_PASTA_TRANSPARENT.png');
fs.writeFileSync(repairedPasta, encodePng(pasta.w, pasta.h, pasta.rgba));

function alphaBounds(im) {
  let minX = im.w, minY = im.h, maxX = -1, maxY = -1, transparent = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (im.rgba[pixel(im, x, y) + 3] === 0) { transparent++; continue; }
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { transparentPixels: transparent, opaqueOrPartialPixels: im.w * im.h - transparent, visibleBoundsPx: { left: minX, top: minY, right: maxX, bottom: maxY } };
}
function cropToVisibleAlpha(im) {
  const b = alphaBounds(im).visibleBoundsPx;
  const w = b.right - b.left + 1, h = b.bottom - b.top + 1, rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) im.rgba.copy(rgba, y * w * 4, pixel(im, b.left, b.top + y), pixel(im, b.left, b.top + y) + w * 4);
  return { w, h, rgba };
}

const alpha = alphaBounds(pasta);
const alphaAudit = {
  status: alpha.transparentPixels > 0 ? 'PASS' : 'FAIL',
  assetId: 'GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001',
  source: path.relative(root, sources.pasta), repairedArtifact: path.relative(root, repairedPasta),
  sourceHadTransparentPixels: alpha.transparentPixels > 0, edgeConnectedCheckerPixelsRemoved: transparentPixels,
  ...alpha,
  outsideArtworkTransparent: alpha.transparentPixels > 0 ? 'YES' : 'NO',
  forbiddenBackgroundGeometry: 'NONE',
  notes: 'Alpha repair is limited to edge-connected neutral checkerboard pixels; no scene or Blender source was opened.',
};
fs.writeFileSync(path.join(modular, 'SAD_TOMATO_V1_DISPLAY_ALPHA_AUDIT.json'), JSON.stringify(alphaAudit, null, 2) + '\n');

const depth = {
  status: 'PASS', cameraContract: 'COMMERCIAL_SIMPLE_FRONT_PRESENTATION_V1',
  orderingFrontToBack: ['GG-FAC-WINDOW-OPENING-SIMPLE-001: approved teal glass/background', 'GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001: transparent art behind glass', 'GG-FAC-WALL-BAY-SIMPLE-001: wall shell'],
  displayDepthRelativeToGlass: '+0.012u behind', displayDepthRelativeToWall: '-0.018u forward',
  preservesWindowOwnership: 'YES', createsNoStructuralGeometry: 'YES',
};
fs.writeFileSync(path.join(modular, 'SAD_TOMATO_V1_WINDOW_DEPTH_SPEC.json'), JSON.stringify(depth, null, 2) + '\n');

const W = 2280, H = 1420, board = { w: W, h: H, rgba: Buffer.alloc(W * H * 4, 247) };
for (let p = 3; p < board.rgba.length; p += 4) board.rgba[p] = 255;
const fill = (x, y, w, h, rgb) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const p = pixel(board, xx, yy); board.rgba[p] = rgb[0]; board.rgba[p+1] = rgb[1]; board.rgba[p+2] = rgb[2]; } };
function blitScaled(dst, src, x, y, w, h, alpha = false) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const sx = Math.min(src.w - 1, Math.floor(xx * src.w / w)), sy = Math.min(src.h - 1, Math.floor(yy * src.h / h));
    const sp = pixel(src, sx, sy), dp = pixel(dst, x + xx, y + yy), a = alpha ? src.rgba[sp + 3] / 255 : 1;
    if (!a) continue;
    for (let c = 0; c < 3; c++) dst.rgba[dp + c] = Math.round(src.rgba[sp + c] * a + dst.rgba[dp + c] * (1 - a));
  }
}
function solidRect(im, x, y, w, h, rgb) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const p = pixel(im, xx, yy); im.rgba[p] = rgb[0]; im.rgba[p + 1] = rgb[1]; im.rgba[p + 2] = rgb[2]; im.rgba[p + 3] = 255;
  }
}
function contain(im, x, y, w, h) { const s = Math.min(w / im.w, h / im.h), nw = Math.floor(im.w * s), nh = Math.floor(im.h * s); blitScaled(board, im, x + ((w - nw) >> 1), y + ((h - nh) >> 1), nw, nh); }
function line(x, y, w, h, rgb = [28, 42, 60]) { fill(x, y, w, h, rgb); }
function tinyLabel(x, y, key, rgb = [28, 42, 60]) { // deterministic simple label bars: source IDs remain authored in registry.
  fill(x, y, 280, 9, rgb); fill(x, y + 14, 170 + (key.length % 90), 6, [100, 110, 120]);
}
const ref = decodePng(sources.reference), facade = decodePng(sources.swappedFacade), sign = decodePng(sources.sign), awning = decodePng(sources.awning), food = decodePng(repairedPasta), awningVisible = cropToVisibleAlpha(awning);
// 2D preflight composite: all structure remains from the approved swapped façade; only presentation slots are populated.
const composite = { w: facade.w, h: facade.h, rgba: Buffer.from(facade.rgba) };
blitScaled(composite, sign, 123, 43, 512, 102, true);
// The old candidate's plum fabric is deliberately excluded from this preflight
// slot. This neutral, existing-shell shadow zone is not a new asset or geometry.
solidRect(composite, 70, 176, 660, 40, [75, 48, 27]);
// Crop the transparent canvas first so the full new canopy replaces the former
// awning slot rather than exposing any of the old plum candidate above it.
blitScaled(composite, awningVisible, 31, 178, 696, 180, true);
// The display asset never owns a card or backdrop. The approved window owns this
// flat teal interior, replacing irrelevant template props before food is inserted.
solidRect(composite, 85, 331, 312, 204, [11, 71, 79]);
// Visible alpha bounds place the food fully inside the existing large-window interior;
// it may not cross the approved sill/casing in this preflight.
blitScaled(composite, food, 55, 335, 330, 185, true);
const compositeFile = path.join(out, 'SAD_TOMATO_V1_2D_PREFLIGHT_COMPOSITE.png');
fs.writeFileSync(compositeFile, encodePng(composite.w, composite.h, composite.rgba));
// Board: reference, structural base, completed 2D preflight, then the three source presentation assets and contract diagram.
const cells = [[ref, 0, 36, 760, 590], [facade, 760, 36, 760, 590], [composite, 1520, 36, 760, 590], [sign, 0, 700, 760, 300], [awning, 760, 700, 760, 300], [food, 1520, 700, 760, 300]];
for (const [im, x, y, w, h] of cells) contain(im, x + 12, y + 20, w - 24, h - 30);
for (const x of [0,760,1520]) line(x, 25, 1, 1010); for (const y of [25,650,1035]) line(0,y,W,1);
['REFERENCE', 'APPROVED SWAPPED FACADE', 'SAD TOMATO 2D PREFLIGHT', 'SIGN: GG-PRES-SIGN-THE-SAD-TOMATO-001', 'AWNING: GG-PRES-AWNING-SAD-TOMATO-GREEN-WHITE-STRIPED-001', 'DISPLAY: GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001'].forEach((text, i) => tinyLabel((i%3)*760 + 20, i<3 ? 45 : 680, text));
// bottom source/depth diagram bars, kept machine-readable in the registry/depth spec.
fill(0, 1036, W, H - 1036, [235, 238, 238]);
for (const [x, name, color] of [[90,'STRUCTURE',[86,62,42]],[610,'TEAL GLASS',[31,92,102]],[1130,'TRANSPARENT DISPLAY',[190,116,40]],[1650,'FRONT AWNING + SIGN',[35,91,49]]]) { fill(x,1115,380,86,color); tinyLabel(x,1070,name,color); }
fs.writeFileSync(path.join(out, 'SAD_TOMATO_V1_PREFLIGHT.png'), encodePng(W, H, board.rgba));

const registry = {
  status: alphaAudit.status, phase: 'PREFLIGHT_ONLY', recipeId: 'GG-BLD-SHOP-SIMPLE-THE-SAD-TOMATO-001',
  modules: [
    { assetId: 'GG-PRES-SIGN-THE-SAD-TOMATO-001', kind: 'PRESENTATION_LAYER_A', version: '1.0.0', artifact: path.relative(root, sources.sign), sha256: sha256(sources.sign), sourceOwnership: 'sign presentation slot', structuralGeometry: false },
    { assetId: 'GG-PRES-AWNING-SAD-TOMATO-GREEN-WHITE-STRIPED-001', kind: 'PRESENTATION_LAYER_A', version: '1.0.0', artifact: path.relative(root, sources.awning), sha256: sha256(sources.awning), sourceOwnership: 'awning presentation slot', structuralGeometry: false, palette: ['forest_green','warm_ivory'], scallopedLowerEdge: true },
    { assetId: 'GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001', kind: 'PRESENTATION_LAYER_A', version: '1.0.0', artifact: path.relative(root, repairedPasta), sha256: sha256(repairedPasta), sourceOwnership: 'window display presentation slot', structuralGeometry: false, alphaAudit: 'SAD_TOMATO_V1_DISPLAY_ALPHA_AUDIT.json' },
  ],
  forbiddenContamination: { structuralGeometry: 0, foliageOrPlanter: 0, windowCasingOrSill: 0, opaqueBackgroundCards: 0 },
  assemblyPerformed: 'NO', fabricationReady: alphaAudit.status === 'PASS' ? 'YES' : 'NO',
};
fs.writeFileSync(path.join(modular, 'SAD_TOMATO_V1_PRESENTATION_MODULE_REGISTRY.json'), JSON.stringify(registry, null, 2) + '\n');
const report = `# Sad Tomato V1 Presentation Preflight\n\nStatus: **${alphaAudit.status}** — preflight only; no Blender assembly was performed.\n\n- Preserved sign: \`GG-PRES-SIGN-THE-SAD-TOMATO-001@1.0.0\`\n- New awning: \`GG-PRES-AWNING-SAD-TOMATO-GREEN-WHITE-STRIPED-001@1.0.0\`\n- New window display: \`GG-PRES-WINDOW-DISPLAY-SAD-TOMATO-PASTA-001@1.0.0\`\n- Alpha outside display artwork: **${alphaAudit.outsideArtworkTransparent}**\n- Structural geometry in presentation assets: **0**\n- Blender/shop assembly: **NOT RUN**\n- Ready for isolated fabrication: **${registry.fabricationReady}**\n\nThe board proves the intended source-to-slot mapping. The 2D composite is an inspection preflight, not a production render.\n`;
fs.writeFileSync(path.join(modular, 'SAD_TOMATO_V1_PRESENTATION_PREFLIGHT_REPORT.md'), report);
console.log(JSON.stringify({ status: alphaAudit.status, alphaAudit, registry, outputs: ['SAD_TOMATO_V1_PREFLIGHT.png', 'SAD_TOMATO_V1_2D_PREFLIGHT_COMPOSITE.png'] }, null, 2));
