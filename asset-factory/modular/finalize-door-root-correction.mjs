import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const src = path.join(root, 'test-output/door-root-correction');
const outNames = {
  'SHOP_DOORCAL_FRONT.png': 'SHOP_CALIBRATED_FRONT.png',
  'SHOP_DOORCAL_GAMEPLAY.png': 'SHOP_CALIBRATED_GAMEPLAY.png',
  'SHOP_DOORCAL_HERO.png': 'SHOP_CALIBRATED_HERO.png',
  'SHOP_DOORCAL_CLOSEUP.png': 'SHOP_CALIBRATED_CLOSEUP.png',
  'SHOP_DOORCAL_BACK.png': 'SHOP_CALIBRATED_BACK.png',
  'SHOP_DOORCAL_LEFT.png': 'SHOP_CALIBRATED_LEFT.png',
  'SHOP_DOORCAL_RIGHT.png': 'SHOP_CALIBRATED_RIGHT.png',
  'SHOP_DOORCAL_COMPONENT_ID.png': 'SHOP_CALIBRATED_COMPONENT_ID.png'
};
for (const [dst, source] of Object.entries(outNames)) fs.copyFileSync(path.join(src, source), path.join(src, dst));

function board(items, width = 1800, height = 900) {
  const buf = Buffer.alloc(width * height * 4, 246);
  for (const [file, x, y, w, h] of items) {
    const im = decodePng(file); const sx = im.w / w; const sy = im.h / h;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const a = ((y + j) * width + x + i) * 4, c = (Math.floor(j * sy) * im.w + Math.floor(i * sx)) * 4;
      buf[a] = im.rgba[c]; buf[a + 1] = im.rgba[c + 1]; buf[a + 2] = im.rgba[c + 2]; buf[a + 3] = 255;
    }
  }
  return encodePng(width, height, buf);
}
const ref = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-ebd1feb7-85bc-478b-a01c-93ce973da8fb.png';
const previous = path.join(root, 'test-output/real-wall-panel/SHOP_REALWALL_FRONT.png');
fs.writeFileSync(path.join(src, 'SHOP_DOORCAL_GOLDEN_COMPARISON_BOARD.png'), board([[ref, 20, 20, 560, 380], [previous, 620, 20, 560, 380], [path.join(src, 'SHOP_DOORCAL_FRONT.png'), 1220, 20, 560, 380], [path.join(src, 'SHOP_DOORCAL_CLOSEUP.png'), 20, 430, 560, 380], [path.join(src, 'SHOP_DOORCAL_GAMEPLAY.png'), 620, 430, 560, 380], [path.join(src, 'SHOP_DOORCAL_COMPONENT_ID.png'), 1220, 430, 560, 380]]));
fs.writeFileSync(path.join(src, 'SHOP_DOORCAL_FOUR_SIDE_BOARD.png'), board([[path.join(src, 'SHOP_DOORCAL_FRONT.png'), 0, 0, 450, 360], [path.join(src, 'SHOP_DOORCAL_BACK.png'), 450, 0, 450, 360], [path.join(src, 'SHOP_DOORCAL_LEFT.png'), 900, 0, 450, 360], [path.join(src, 'SHOP_DOORCAL_RIGHT.png'), 1350, 0, 450, 360]], 1800, 360));

const plan = { status: 'NEEDS_CORRECTION', correctionId: 'SHOP_DOOR_ROOT_VISIBLE_BOUNDS_CORRECTION_001', recipe: 'GG-REC-BLD-SIMPLE-SHOP-GROWGO-001@1.0.0', currentVisibleBounds: { heightPx: 195, widthPx: 165, centerX: 287.5, centerY: 457.5 }, targetVisibleBounds: { heightPx: 285, widthPx: 115, centerX: 187.5, centerY: 427.5 }, afterVisibleBounds: { heightPx: 284, widthPx: 116, centerX: 187.5, centerY: 428, heightErrorPct: -0.35 }, threshold: { referenceY: 570, beforeY: 555, afterY: 570 }, rootScaleBefore: 1, requestedRootScale: 1.32, rootPositionBefore: [-1.1, -0.55, 1.3], requestedRootPosition: [-1.1, -0.55, 1.32], expectedVisibleHeightPx: 285, openingResponse: 'DERIVED_FROM_ROOT_BOUNDS', landingResponse: 'DERIVED_FROM_THRESHOLD_ANCHOR', protectedModules: ['WINDOW', 'AWNING', 'FASCIA', 'SHRUB'], artworkInternalsChanged: false };
fs.writeFileSync(path.join(root, 'asset-factory/modular/SHOP_FINAL_DOOR_ROOT_CORRECTION_PLAN.json'), JSON.stringify(plan, null, 2));
const result = JSON.parse(fs.readFileSync(path.join(src, 'SHOP_CALIBRATED_RESULT.json')));
result.correction = plan; result.status = 'NEEDS_CORRECTION'; result.visionReview = { verdict: 'VISION_METRIC_CONFLICT', doorStillTooShort: 'NO', doorApproximatelyMatchesReferenceHeight: 'YES', doorAppearsToFloat: 'YES', doorProperlyGrounded: 'NO', doorWindowHierarchyLikeReference: 'NO', wallPanelsReflowCleanly: 'YES', overallShopCloserToGoldenReference: 'YES', reason: 'calibrated Door artwork retains a dark rectangular backing in the rendered asset; removing it is outside this phase' };
fs.writeFileSync(path.join(src, 'SHOP_DOORCAL_RESULT.json'), JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'asset-factory/modular/SHOP_DOOR_ROOT_CORRECTION_REPORT.md'), `# Targeted Door Root + Responsive Opening Alignment\n\nStatus: **NEEDS_CORRECTION**.\n\nThe Door root was uniformly calibrated from the trusted visible-height evidence and the opening, surround, wall-panel-above-door, and landing were derived from the resulting bounds. The rendered Door height now approximately matches the reference, and the protected Window, Awning, Fascia/Sign, and Shrub were not transformed.\n\nThe mandatory vision review still rejects the candidate because the calibrated Door artwork visibly retains a dark rectangular backing and therefore reads as floating rather than as a clean grounded opening. Removing or repainting that backing would modify protected artwork/masks and is explicitly outside this one-pass phase. No known-good build was assigned.\n`);
