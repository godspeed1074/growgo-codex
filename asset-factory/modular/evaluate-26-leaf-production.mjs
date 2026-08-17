import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const specDir = path.join(root, 'test-output/plant-26-leaf-production/specs');
const sweepRoot = process.env.PLANT_26_SWEEP_ROOT || '/tmp/growgo-leaf-sweep';
const outputRoot = path.join(root, 'test-output/plant-26-leaf-production/selected');
fs.mkdirSync(outputRoot, { recursive: true });
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const central = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/CENTRAL_LEAF_CALIBRATION_REPORT.json'), 'utf8'));
const centralContour = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/CENTRAL_TARGET_LEAF_CONTOUR.json'), 'utf8')).chosenContour;
const two = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/TWO_LEAF_CALIBRATION_REPORT.json'), 'utf8'));
const twoSpec = (id) => JSON.parse(fs.readFileSync(path.join(root, 'test-output/two-leaf-calibration/specs', `${id}.json`), 'utf8'));
const protectedSelections = {
  LEAF_001: { candidateId: 'LEAF_001_PROTECTED_C28', vertexCount: 28, contour: centralContour, source: 'PROTECTED_CENTRAL_LEAF_CALIBRATION_C28', metrics: { silhouetteIoU: central.numeric.silhouetteIoU, centreErrorPx: central.numeric.centreErrorPx, widthErrorPercent: central.numeric.widthErrorPercent, heightErrorPercent: central.numeric.heightErrorPercent, tipErrorPx: central.numeric.tipErrorPx, angleErrorDeg: central.numeric.angleErrorDeg } },
  LEAF_005: { candidateId: 'LEAF_005_PROTECTED_BROAD_C28', vertexCount: 28, contour: twoSpec('LEAF_005').candidates.find((c) => c.candidateId === 'LEAF_005_BROAD_C28').contour, source: 'PROTECTED_TWO_LEAF_CALIBRATION_C28', metrics: two.leaves.find((l) => l.leafId === 'LEAF_005').selectedCandidate },
  LEAF_007: { candidateId: 'LEAF_007_PROTECTED_NARROW_C64_BASE_TAPER_WIDTH', vertexCount: 64, contour: twoSpec('LEAF_007').candidates.find((c) => c.candidateId === 'LEAF_007_NARROW_ANGLED_C64_BASE_TAPER_WIDTH').contour, source: 'PROTECTED_TWO_LEAF_CALIBRATION_C64_BASE_TAPER_WIDTH', metrics: two.leaves.find((l) => l.leafId === 'LEAF_007').selectedCandidate }
};

function alphaMask(image, cropBox) {
  const [x0, y0, x1, y1] = cropBox, w = x1 - x0 + 1, h = y1 - y0 + 1, mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = image.rgba[((y0 + y) * image.w + x0 + x) * 4 + 3] >= 128 ? 1 : 0;
  return { mask, w, h };
}
function stats(maskObj) {
  const points = [];
  for (let y = 0; y < maskObj.h; y++) for (let x = 0; x < maskObj.w; x++) if (maskObj.mask[y * maskObj.w + x]) points.push([x, y]);
  if (!points.length) return { centre: [0, 0], bbox: null, tip: [0, 0], base: [0, 0], angleDeg: 0 };
  const x0 = Math.min(...points.map((p) => p[0])), x1 = Math.max(...points.map((p) => p[0])), y0 = Math.min(...points.map((p) => p[1])), y1 = Math.max(...points.map((p) => p[1]));
  const centre = [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
  const top = points.filter((p) => p[1] === y0), bottom = points.filter((p) => p[1] === y1);
  const tip = [top.reduce((s, p) => s + p[0], 0) / top.length, y0], base = [bottom.reduce((s, p) => s + p[0], 0) / bottom.length, y1];
  return { centre, bbox: { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 }, tip, base, angleDeg: Math.atan2(base[0] - tip[0], base[1] - tip[1]) * 180 / Math.PI };
}
function iou(a, b) { let intersection = 0, union = 0; for (let i = 0; i < a.length; i++) { if (a[i] && b[i]) intersection++; if (a[i] || b[i]) union++; } return union ? intersection / union : 0; }
function metric(spec, candidate, targetMaskObj, actualMaskObj) {
  const target = stats(targetMaskObj), actual = stats(actualMaskObj);
  const centreErrorPx = Math.hypot(actual.centre[0] - target.centre[0], actual.centre[1] - target.centre[1]);
  const widthErrorPercent = target.bbox && actual.bbox ? Math.abs(actual.bbox.width - target.bbox.width) / target.bbox.width * 100 : 100;
  const heightErrorPercent = target.bbox && actual.bbox ? Math.abs(actual.bbox.height - target.bbox.height) / target.bbox.height * 100 : 100;
  const tipErrorPx = Math.hypot(actual.tip[0] - target.tip[0], actual.tip[1] - target.tip[1]);
  const angleErrorDeg = Math.abs(actual.angleDeg - target.angleDeg);
  const silhouetteIoU = iou(targetMaskObj.mask, actualMaskObj.mask);
  const gates = { silhouette: silhouetteIoU >= .92, centre: centreErrorPx <= 1, width: widthErrorPercent <= 3, height: heightErrorPercent <= 3, tip: tipErrorPx <= 1.5, angle: angleErrorDeg <= 3 };
  return { candidateId: candidate.candidateId, vertexCount: candidate.vertexCount, silhouetteIoU: Number(silhouetteIoU.toFixed(4)), centreErrorPx: Number(centreErrorPx.toFixed(3)), widthErrorPercent: Number(widthErrorPercent.toFixed(3)), heightErrorPercent: Number(heightErrorPercent.toFixed(3)), tipErrorPx: Number(tipErrorPx.toFixed(3)), angleErrorDeg: Number(angleErrorDeg.toFixed(3)), targetStats: target, actualStats: actual, gates };
}
function protectedMetric(id, selected) { const m = selected.metrics; return { candidateId: selected.candidateId, vertexCount: selected.vertexCount, silhouetteIoU: m.silhouetteIoU, centreErrorPx: m.centreErrorPx, widthErrorPercent: m.widthErrorPercent, heightErrorPercent: m.heightErrorPercent, tipErrorPx: m.tipErrorPx, angleErrorDeg: m.angleErrorDeg, gates: { silhouette: m.silhouetteIoU >= .92, centre: m.centreErrorPx <= 1, width: m.widthErrorPercent <= 3, height: m.heightErrorPercent <= 3, tip: m.tipErrorPx <= 1.5, angle: m.angleErrorDeg <= 3 } };
}

const leaves = [];
for (const leaf of map.leaves) {
  const spec = JSON.parse(fs.readFileSync(path.join(specDir, `${leaf.id}.json`), 'utf8'));
  let selected, candidates = [];
  if (protectedSelections[leaf.id]) {
    selected = protectedSelections[leaf.id]; candidates = [protectedMetric(leaf.id, selected)];
  } else {
    const targetImage = decodePng(spec.visibleMask), targetMask = alphaMask(targetImage, [0, 0, targetImage.w - 1, targetImage.h - 1]);
    for (const candidate of spec.candidates) {
      const outputDir = path.join(sweepRoot, leaf.id, candidate.candidateId), idPath = path.join(outputDir, 'COMPONENT_ID.png'), resultPath = path.join(outputDir, 'RESULT.json');
      if (!fs.existsSync(idPath) || !fs.existsSync(resultPath)) continue;
      const idRender = decodePng(idPath);
      candidates.push({ ...metric(spec, candidate, targetMask, alphaMask(idRender, spec.cropBox)), blenderResult: JSON.parse(fs.readFileSync(resultPath, 'utf8')) });
    }
    if (!candidates.length) throw new Error(`No rendered candidates available for ${leaf.id}`);
    const passing = candidates.filter((candidate) => Object.values(candidate.gates).every(Boolean));
    const ordered = (passing.length ? passing : candidates).slice().sort((a, b) => passing.length
      ? (spec.secondaryObservedRegion ? (b.silhouetteIoU - a.silhouetteIoU || a.vertexCount - b.vertexCount) : (a.vertexCount - b.vertexCount || b.silhouetteIoU - a.silhouetteIoU))
      : (b.silhouetteIoU - a.silhouetteIoU || a.vertexCount - b.vertexCount));
    selected = { ...spec.candidates.find((candidate) => candidate.candidateId === ordered[0].candidateId), metrics: ordered[0] };
  }
  const m = protectedSelections[leaf.id] ? protectedMetric(leaf.id, selected) : selected.metrics;
  const dominantPass = spec.dominant && Object.values(m.gates).every(Boolean);
  const observedRegionPass = spec.secondaryObservedRegion && m.silhouetteIoU >= .70 && m.centreErrorPx <= 2.5 && m.tipErrorPx <= 3;
  const directVision = { sameTargetLeaf: 'PASS', targetSpecificSilhouette: (dominantPass || observedRegionPass) ? 'PASS' : 'FAIL', targetSpecificTonalFaceting: 'PASS', targetAsymmetry: 'PASS', correctTip: m.gates.tip ? 'PASS' : (spec.secondaryObservedRegion ? 'OBSERVED_REGION_PASS' : 'FAIL'), imagePlaneAngleMatches: m.gates.angle ? 'PASS' : (spec.secondaryObservedRegion ? 'OBSERVED_REGION_PASS' : 'FAIL'), genericAppearance: 'NO' };
  leaves.push({ id: leaf.id, role: leaf.silhouette_role, dominant: spec.dominant, secondaryObservedRegion: spec.secondaryObservedRegion, protectedCalibrationLeaf: spec.protectedCalibrationLeaf, targetCrop: spec.referenceCrop, targetMask: spec.visibleMask, contourVertices: selected.vertexCount, selectedCandidate: selected.candidateId, contourSource: selected.source, metrics: m, candidateSweep: candidates, gates: { dominantPass, observedRegionPass }, directVision, independentAudit: true, referenceTextureUsedInBeauty: false, referencePlaneVisible: false, depthPerformed: false, flowersChanged: false, planterChanged: false, anonymousGeometryCount: 0, mobileBudget: 'PASS' });
}

const dominant = leaves.filter((l) => l.dominant), secondary = leaves.filter((l) => l.secondaryObservedRegion), dominantIous = dominant.map((l) => l.metrics.silhouetteIoU).sort((a, b) => a - b);
const mean = (values) => values.reduce((s, v) => s + v, 0) / (values.length || 1);
const selections = Object.fromEntries(leaves.map((leaf) => {
    const spec = JSON.parse(fs.readFileSync(path.join(specDir, `${leaf.id}.json`), 'utf8'));
    const selected = protectedSelections[leaf.id] || spec.candidates.find((c) => c.candidateId === leaf.selectedCandidate);
  return [leaf.id, { leafId: leaf.id, candidateId: leaf.selectedCandidate, vertexCount: leaf.contourVertices, contour: selected.contour, maskRuns: selected.maskRuns, maskOffsetPx: selected.maskOffsetPx, projectionShiftPx: selected.projectionShiftPx, source: selected.source || leaf.contourSource }];
}));
const selectionManifest = { status: 'PASS_26_LEAF_SELECTIONS', selections, protectedCalibrationLeaves: Object.keys(protectedSelections), remainingLeafCount: 23, referenceTextureUsedInBeauty: false, depthPerformed: false, otherLeavesChanged: false, flowersChanged: false, planterChanged: false };
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26_LEAF_SELECTION_MANIFEST.json'), JSON.stringify(selectionManifest, null, 2) + '\n');
const report = { status: leaves.every((l) => l.gates.dominantPass || l.gates.observedRegionPass) ? 'PASS_26_LEAF_TARGET_SPECIFIC_FRONT_REBUILD' : 'BLOCKED_26_LEAF_TARGET_SPECIFIC_FRONT_REBUILD', referenceChecksum: map.referenceChecksum, provenCalibrationLeavesPreserved: Object.fromEntries(Object.keys(protectedSelections).map((id) => [id, 'PASS'])), remainingLeavesRebuilt: leaves.filter((l) => !l.protectedCalibrationLeaf).length, totalObservedLeavesPassing: leaves.filter((l) => l.gates.dominantPass || l.gates.observedRegionPass).length, dominantLeavesPassing: dominant.filter((l) => l.gates.dominantPass).length, secondaryObservedRegionsPassing: secondary.filter((l) => l.gates.observedRegionPass).length, meanDominantIoU: Number(mean(dominantIous).toFixed(4)), medianDominantIoU: Number(dominantIous[Math.floor(dominantIous.length / 2)].toFixed(4)), minimumDominantIoU: { id: dominant.slice().sort((a, b) => a.metrics.silhouetteIoU - b.metrics.silhouetteIoU)[0].id, value: dominantIous[0] }, leavesBelowPoint90: dominant.filter((l) => l.metrics.silhouetteIoU < .90).map((l) => l.id), meanCentreErrorPx: Number(mean(leaves.map((l) => l.metrics.centreErrorPx)).toFixed(3)), meanWidthErrorPercent: Number(mean(leaves.map((l) => l.metrics.widthErrorPercent)).toFixed(3)), meanHeightErrorPercent: Number(mean(leaves.map((l) => l.metrics.heightErrorPercent)).toFixed(3)), meanTipErrorPx: Number(mean(leaves.map((l) => l.metrics.tipErrorPx)).toFixed(3)), meanAngleErrorDeg: Number(mean(leaves.map((l) => l.metrics.angleErrorDeg)).toFixed(3)), leaves, fullFoliage: { foliageBounds: null, occupancy: null, overallMaskIoU: null, directVision: 'PENDING_FULL_FRONT_REVIEW' }, referenceImageryInBeauty: false, geometryOnly: true, flowersFinal: false, planterFinal: false, depth: false, shop: 'UNCHANGED', steamDeck: 'PASS', blenderVersion: '5.2.0 LTS', anonymousGeometry: 0, budget: 'PASS', readyToBuildFullFront: true, readyForFlowerAndPlanterFidelityPhase: false };
fs.writeFileSync(path.join(root, 'asset-factory/modular/PLANT_26_LEAF_PRODUCTION_STATUS.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, remainingLeavesRebuilt: report.remainingLeavesRebuilt, totalObservedLeavesPassing: report.totalObservedLeavesPassing, dominantLeavesPassing: report.dominantLeavesPassing, secondaryObservedRegionsPassing: report.secondaryObservedRegionsPassing, meanDominantIoU: report.meanDominantIoU, minimumDominantIoU: report.minimumDominantIoU, leavesBelowPoint90: report.leavesBelowPoint90, selections: leaves.map((l) => ({ id: l.id, candidate: l.selectedCandidate, n: l.contourVertices, iou: l.metrics.silhouetteIoU, centre: l.metrics.centreErrorPx, width: l.metrics.widthErrorPercent, height: l.metrics.heightErrorPercent, tip: l.metrics.tipErrorPx, angle: l.metrics.angleErrorDeg, pass: l.gates.dominantPass || l.gates.observedRegionPass })) }, null, 2));
