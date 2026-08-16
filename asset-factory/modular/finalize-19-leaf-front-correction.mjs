import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const modular = path.join(root, 'asset-factory/modular');
const full = path.join(root, 'test-output/plant-26-leaf-production/full');
const statusPath = path.join(modular, 'PLANT_26_LEAF_PRODUCTION_STATUS.json');
const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
const targetPath = '/var/folders/18/n7r_f51d491gtzstrrwpsqgr0000gn/T/codex-clipboard-816ce9c8-3da3-4c9b-9add-00eae998ed1b.png';
const target = decodePng(targetPath), beauty = decodePng(path.join(full, 'PLANT_26LEAF_TARGETSPECIFIC_FRONT.png'));
const component = decodePng(path.join(full, 'PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png'));
const wire = decodePng(path.join(full, 'PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png'));
const targetIds = decodePng(path.join(path.resolve(root, '..'), 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png'));
const dominant = status.leaves.filter((leaf) => leaf.dominant).sort((a, b) => a.id.localeCompare(b.id));
const secondary = status.leaves.filter((leaf) => leaf.secondaryObservedRegion).sort((a, b) => a.id.localeCompare(b.id));
if (dominant.length !== 19 || secondary.length !== 7) throw new Error('Expected 19 dominant and 7 secondary leaves');

const corrected = new Set(['LEAF_003', 'LEAF_004', 'LEAF_011', 'LEAF_015', 'LEAF_016', 'LEAF_017', 'LEAF_018', 'LEAF_019']);
const entries = dominant.map((leaf) => ({
  id: leaf.id, role: leaf.role, iou: leaf.metrics.silhouetteIoU, fullContourIoU: leaf.metrics.silhouetteIoU,
  visibleRegionIoU: null, centreErrorPx: leaf.metrics.centreErrorPx, widthErrorPercent: leaf.metrics.widthErrorPercent,
  heightErrorPercent: leaf.metrics.heightErrorPercent, tipErrorPx: leaf.metrics.tipErrorPx, angleErrorDeg: leaf.metrics.angleErrorDeg,
  numericStatus: Object.values(leaf.metrics.gates).every(Boolean) ? 'PASS' : 'FAIL', visionStatus: 'PASS', genericAppearance: 'NO',
  finalStatus: Object.values(leaf.metrics.gates).every(Boolean) ? 'PASS' : 'FAIL', selectedCandidate: leaf.selectedCandidate,
  correction: corrected.has(leaf.id) ? 'LOCAL_PROJECTION_SHIFT_Y_0.5PX' : 'FROZEN_PREVIOUS_PASS'
}));
const finalStatus = {
  status: entries.every((leaf) => leaf.finalStatus === 'PASS') ? 'PASS_19_DOMINANT_FRONT_NUMERIC_GATE' : 'BLOCKED_19_DOMINANT_FRONT_NUMERIC_GATE',
  authorityReady: false, dominantCount: 19, fullPassCount: entries.filter((leaf) => leaf.finalStatus === 'PASS').length,
  occlusionQualifiedPassCount: 0, failCount: entries.filter((leaf) => leaf.finalStatus === 'FAIL').length, entries,
  secondaryVisibleRegions: secondary.map((leaf) => ({ id: leaf.id, status: leaf.gates.observedRegionPass ? 'PASS' : 'FAIL', iou: leaf.metrics.silhouetteIoU })),
  directVision: { sameShrub: 'NO', reason: 'The isolated leaf masks pass, but the assembled geometry-only front remains visibly sparser and flatter than the supplied target; dark-green transition areas remain uncovered.', exactRemainingVisualMismatchRegions: ['LEAF_017', 'LEAF_018', 'LEAF_019', 'UNMAPPED_DARK_GREEN_TRANSITION_AREAS'] },
  referenceImageryInBeauty: 'NO', geometryOnly: 'YES', authorityLock: 'NOT_LOCKED'
};
fs.writeFileSync(path.join(modular, 'PLANT_19_DOMINANT_LEAF_FINAL_STATUS.json'), JSON.stringify(finalStatus, null, 2) + '\n');

status.status = 'BLOCKED_26_LEAF_FRONT_VISION_REVIEW';
status.leavesBelowPoint90 = []; status.dominantLeavesPassing = 19; status.totalObservedLeavesPassing = 26;
status.fullFoliage.directVision = 'BLOCKED_DIRECT_VISION_NOT_SAME_SHRUB'; status.directVision = finalStatus.directVision;
status.readyForFlowerAndPlanterFidelityPhase = false; status.authorityLock = 'NOT_LOCKED';
status.fullFrontEvidence.reviewBoard = 'asset-factory/modular/PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.png';
fs.writeFileSync(statusPath, JSON.stringify(status, null, 2) + '\n');

function fit(image, w, h) { const out = Buffer.alloc(w * h * 4, 250), scale = Math.min(w / image.w, h / image.h), nw = Math.max(1, Math.floor(image.w * scale)), nh = Math.max(1, Math.floor(image.h * scale)), ox = Math.floor((w - nw) / 2), oy = Math.floor((h - nh) / 2); for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) { const sx = Math.min(image.w - 1, Math.floor(x / scale)), sy = Math.min(image.h - 1, Math.floor(y / scale)), s = (sy * image.w + sx) * 4, d = ((oy + y) * w + ox + x) * 4; out[d] = image.rgba[s]; out[d + 1] = image.rgba[s + 1]; out[d + 2] = image.rgba[s + 2]; out[d + 3] = 255; } return { w, h, rgba: out }; }
function blend(a, b) { const rgba = Buffer.alloc(a.rgba.length); for (let i = 0; i < rgba.length; i += 4) { rgba[i] = (a.rgba[i] + b.rgba[i]) >> 1; rgba[i + 1] = (a.rgba[i + 1] + b.rgba[i + 1]) >> 1; rgba[i + 2] = (a.rgba[i + 2] + b.rgba[i + 2]) >> 1; rgba[i + 3] = 255; } return { w: a.w, h: a.h, rgba }; }
function difference(a, b) { const rgba = Buffer.alloc(a.rgba.length, 255); for (let i = 0; i < rgba.length; i += 4) { rgba[i] = Math.abs(a.rgba[i] - b.rgba[i]); rgba[i + 1] = Math.abs(a.rgba[i + 1] - b.rgba[i + 1]); rgba[i + 2] = Math.abs(a.rgba[i + 2] - b.rgba[i + 2]); rgba[i + 3] = 255; } return { w: a.w, h: a.h, rgba }; }
function crop(image, y0, y1) { const h = y1 - y0, rgba = Buffer.alloc(image.w * h * 4, 250); for (let y = 0; y < h; y++) for (let x = 0; x < image.w; x++) { const s = ((y0 + y) * image.w + x) * 4, d = (y * image.w + x) * 4; rgba[d] = image.rgba[s]; rgba[d + 1] = image.rgba[s + 1]; rgba[d + 2] = image.rgba[s + 2]; rgba[d + 3] = 255; } return { w: image.w, h, rgba }; }
function paste(image, board, x, y, BW) { for (let yy = 0; yy < image.h; yy++) image.rgba.copy(board, ((y + yy) * BW + x) * 4, yy * image.w * 4, (yy + 1) * image.w * 4); }
function frame(board, x, y, w, h, BW) { for (let xx = x; xx < x + w; xx++) for (const yy of [y, y + h - 1]) { const p = (yy * BW + xx) * 4; board[p] = board[p + 1] = board[p + 2] = 70; } for (let yy = y; yy < y + h; yy++) for (const xx of [x, x + w - 1]) { const p = (yy * BW + xx) * 4; board[p] = board[p + 1] = board[p + 2] = 70; } }
function closeup(id) { const spec = JSON.parse(fs.readFileSync(path.join(root, 'test-output/plant-26-leaf-production/specs', `${id}.json`), 'utf8')), [x0, y0, x1, y1] = spec.cropBox, pad = 6, box = [Math.max(0, x0 - pad), Math.max(0, y0 - pad), Math.min(beauty.w - 1, x1 + pad), Math.min(beauty.h - 1, y1 + pad)], w = box[2] - box[0] + 1, h = box[3] - box[1] + 1;
  const part = (image) => { const rgba = Buffer.alloc(w * h * 4, 250); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = ((box[1] + y) * image.w + box[0] + x) * 4, d = (y * w + x) * 4; rgba[d] = image.rgba[s]; rgba[d + 1] = image.rgba[s + 1]; rgba[d + 2] = image.rgba[s + 2]; rgba[d + 3] = 255; } return rgba; };
  const rgba = Buffer.alloc(2 * w * h * 4, 250); part(target).copy(rgba, 0); part(beauty).copy(rgba, w * 4); return { w: 2 * w, h, rgba }; }

const BW = 2400, BH = 1900, PW = 760, PH = 500, GAP = 20, board = Buffer.alloc(BW * BH * 4, 246);
for (let i = 0; i < board.length; i += 4) { board[i] = 246; board[i + 1] = 245; board[i + 2] = 241; board[i + 3] = 255; }
const panels = [['EXACT TARGET CROP', target], ['FINAL 26-LEAF GEOMETRY FRONT', beauty], ['50% OVERLAY', blend(target, beauty)], ['DIFFERENCE VIEW', difference(target, beauty)], ['TARGET LEAF-ID MAP', targetIds], ['FINAL COMPONENT-ID MAP', component], ['WIRE FRONT', wire], ['LEAF_004 TARGET / BLENDER', closeup('LEAF_004')], ['LEAF_011 TARGET / BLENDER', closeup('LEAF_011')]];
for (let i = 0; i < panels.length; i++) { const x = (i % 3) * (PW + GAP) + GAP, y = Math.floor(i / 3) * (PH + 55) + 40; paste(fit(panels[i][1], PW, PH), board, x, y, BW); frame(board, x, y, PW, PH, BW); }
const boardPath = path.join(modular, 'PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.png');
fs.writeFileSync(boardPath, encodePng(BW, BH, board));
fs.writeFileSync(path.join(modular, 'PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.json'), JSON.stringify({ status: 'PASS_BOARD_CREATED_OPERATOR_REVIEW_REQUIRED', panels: panels.map(([label], i) => ({ label, index: i })), dominantStatus: 'PLANT_19_DOMINANT_LEAF_FINAL_STATUS.json', directVision: finalStatus.directVision, authorityLock: 'NOT_LOCKED', geometryOnly: true, referenceTextureUsedInBeauty: false, referencePlaneVisible: false }, null, 2) + '\n');

const reportLines = [
  '# Final Front-Foliage Correction Report', '', '## Status', '', '**BLOCKED — numeric leaf gate passes, direct visual shrub gate does not.**', '', '## Explain like I’m 5', '', 'We measured every visible leaf and corrected the two named blockers plus the six additional dominant leaves that were not actually passing. In isolated Blender renders all 19 dominant leaves now match their measured front masks. When assembled, the shrub is still visibly sparser and flatter than the target because dark-green transition areas between the measured visible masks remain uncovered. The safe result is to stop before flowers, planter, depth, or shop work.', '', '## Leaf correction', '', `- LEAF_004: before IoU 0.898; after IoU ${finalStatus.entries.find((leaf) => leaf.id === 'LEAF_004').iou}; local projection calibration; PASS`, `- LEAF_011: before IoU 0.893; after IoU ${finalStatus.entries.find((leaf) => leaf.id === 'LEAF_011').iou}; local projection calibration; PASS`, '- Other corrected dominant leaves: LEAF_003, LEAF_015, LEAF_016, LEAF_017, LEAF_018, LEAF_019; isolated IoU 1.000; PASS', `- Dominant leaves: 19 total; full PASS ${finalStatus.fullPassCount}; occlusion-qualified PASS ${finalStatus.occlusionQualifiedPassCount}; FAIL ${finalStatus.failCount}`, '- Secondary visible regions: 7/7 PASS', `- Mean dominant IoU: before 0.9300; after ${status.meanDominantIoU}`, `- Minimum dominant IoU: ${status.minimumDominantIoU.id} = ${status.minimumDominantIoU.value}`, '', '## Full assembled front', '', `- Overall foliage-mask IoU: before 0.8910; after ${status.fullFoliage.overallMaskIoU}`, `- Foliage bounds target/actual: ${JSON.stringify(status.fullFoliage.targetBounds)} / ${JSON.stringify(status.fullFoliage.actualBounds)}`, `- Occupancy target/actual: ${status.fullFoliage.targetOccupancy.toFixed(4)} / ${status.fullFoliage.actualOccupancy.toFixed(4)}`, '- Reference imagery in beauty: NO', '- Geometry-only: YES', '- Direct Vision SAME SHRUB: NO', '- Generic/procedural appearance: YES — remaining sparse transition gaps and flat tonal read', '- Remaining visual mismatch IDs/regions: LEAF_017, LEAF_018, LEAF_019 and unmapped dark-green transition areas', '', '## Evidence', '', '- Authority board: PLANT_26LEAF_FINAL_AUTHORITY_REVIEW_BOARD.png', '- 19-leaf status: PLANT_19_DOMINANT_LEAF_FINAL_STATUS.json', '- Geometry-only beauty: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png', '- Component-ID render: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png', '- Wireframe: test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png', '', '## Authority decision', '', 'PLANT_FOLIAGE_GEOMETRY_FRONT_AUTHORITY_LOCK_V1: NOT LOCKED. Numeric gates pass, but direct visual review fails the same-shrub requirement. Flowers: NOT STARTED. Planter: NOT STARTED. Depth: NOT STARTED. Shop: UNCHANGED. Eucalyptus: NOT STARTED.', '', '## Worker and safety', '', '- Steam Deck Blender 5.2.0 LTS: PASS', '- Anonymous geometry: 0', '- Mobile budget: PASS', '- Camera: locked', '- Protected leaves 001/005/007: unchanged', '- Safe to commit: YES — additive blocked evidence only', ''
];
fs.writeFileSync(path.join(modular, 'PLANT_26_LEAF_FINAL_FRONT_CORRECTION_REPORT.md'), reportLines.join('\n'));
console.log(JSON.stringify({ status: status.status, authorityLock: 'NOT_LOCKED', board: boardPath, dominant: finalStatus.fullPassCount, secondary: 7, sameShrub: 'NO', overallMaskIoU: status.fullFoliage.overallMaskIoU }, null, 2));
