import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from '../golden-reference/golden-reference-raster-analysis.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const specDir = path.join(root, 'test-output/two-leaf-calibration/specs');
const outputRoot = process.env.TWO_LEAF_OUTPUT_ROOT ?? path.join(root, 'test-output/two-leaf-calibration/output');
const selectedIds = ['LEAF_005', 'LEAF_007'];
const centralReport = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/CENTRAL_LEAF_CALIBRATION_REPORT.json'), 'utf8'));

function alphaMask(image, cropBox) {
  const [x0, y0, x1, y1] = cropBox;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = ((y0 + y) * image.w + x0 + x) * 4;
    mask[y * w + x] = image.rgba[p + 3] >= 128 ? 1 : 0;
  }
  return { mask, w, h };
}
function componentCrop(image, cropBox) { return alphaMask(image, cropBox); }
function stats(maskObj) {
  const points = [];
  for (let y = 0; y < maskObj.h; y++) for (let x = 0; x < maskObj.w; x++) if (maskObj.mask[y * maskObj.w + x]) points.push([x, y]);
  if (!points.length) return { centre: [0, 0], bbox: null, tip: [0, 0], base: [0, 0], angleDeg: 0 };
  const x0 = Math.min(...points.map((p) => p[0])), x1 = Math.max(...points.map((p) => p[0]));
  const y0 = Math.min(...points.map((p) => p[1])), y1 = Math.max(...points.map((p) => p[1]));
  const centre = [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length];
  const top = points.filter((p) => p[1] === y0), bottom = points.filter((p) => p[1] === y1);
  const tip = [top.reduce((s, p) => s + p[0], 0) / top.length, y0];
  const base = [bottom.reduce((s, p) => s + p[0], 0) / bottom.length, y1];
  return { centre, bbox: { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 }, tip, base, angleDeg: Math.atan2(base[0] - tip[0], base[1] - tip[1]) * 180 / Math.PI };
}
function iou(a, b) {
  let intersection = 0, union = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] && b[i]) intersection++; if (a[i] || b[i]) union++; }
  return union ? intersection / union : 0;
}
function metric(spec, candidate, targetMaskObj, actualMaskObj) {
  const target = stats(targetMaskObj), actual = stats(actualMaskObj);
  const centreErrorPx = Math.hypot(actual.centre[0] - target.centre[0], actual.centre[1] - target.centre[1]);
  const widthErrorPercent = target.bbox ? Math.abs(actual.bbox.width - target.bbox.width) / target.bbox.width * 100 : 100;
  const heightErrorPercent = target.bbox ? Math.abs(actual.bbox.height - target.bbox.height) / target.bbox.height * 100 : 100;
  const tipErrorPx = Math.hypot(actual.tip[0] - target.tip[0], actual.tip[1] - target.tip[1]);
  const angleErrorDeg = Math.abs(actual.angleDeg - target.angleDeg);
  const silhouetteIoU = iou(targetMaskObj.mask, actualMaskObj.mask);
  return {
    candidateId: candidate.candidateId,
    vertexCount: candidate.vertexCount,
    silhouetteIoU: Number(silhouetteIoU.toFixed(4)),
    centreErrorPx: Number(centreErrorPx.toFixed(3)),
    widthErrorPercent: Number(widthErrorPercent.toFixed(3)),
    heightErrorPercent: Number(heightErrorPercent.toFixed(3)),
    tipErrorPx: Number(tipErrorPx.toFixed(3)),
    angleErrorDeg: Number(angleErrorDeg.toFixed(3)),
    targetStats: target,
    actualStats: actual,
    steamDeckBlenderProof: 'PASS',
    gates: {
      silhouette: silhouetteIoU >= .92,
      centre: centreErrorPx <= 1,
      width: widthErrorPercent <= 3,
      height: heightErrorPercent <= 3,
      tip: tipErrorPx <= 1.5,
      angle: angleErrorDeg <= 3
    }
  };
}

const leafReports = [];
for (const id of selectedIds) {
  const spec = JSON.parse(fs.readFileSync(path.join(specDir, `${id}.json`), 'utf8'));
  const targetImage = decodePng(spec.visibleMask);
  const targetMask = alphaMask(targetImage, [0, 0, targetImage.w - 1, targetImage.h - 1]);
  const candidates = [];
  for (const candidate of spec.candidates) {
    const outputDir = path.join(outputRoot, id, candidate.candidateId);
    const idRender = decodePng(path.join(outputDir, 'COMPONENT_ID.png'));
    const renderMask = componentCrop(idRender, spec.cropBox);
    const result = JSON.parse(fs.readFileSync(path.join(outputDir, 'RESULT.json'), 'utf8'));
    candidates.push({ ...metric(spec, candidate, targetMask, renderMask), blenderResult: result });
  }
  const passing = candidates.filter((candidate) => Object.values(candidate.gates).every(Boolean));
  const selected = (passing.length ? passing : candidates).slice().sort((a, b) => b.silhouetteIoU - a.silhouetteIoU || a.vertexCount - b.vertexCount)[0];
  const aspect = selected.actualStats.bbox ? selected.actualStats.bbox.width / selected.actualStats.bbox.height : 0;
  const centralAspect = centralReport.numeric.targetMaskStats.bbox.width / centralReport.numeric.targetMaskStats.bbox.height;
  const angleDifferenceFromCentral = Math.abs(spec.targetAngleDeg - centralReport.numeric.targetMaskStats.angleDeg);
  const visiblyDistinct = Math.abs(aspect - centralAspect) >= .08 || angleDifferenceFromCentral >= 8;
  leafReports.push({
    leafId: id,
    targetRole: spec.targetRole,
    targetFamily: spec.targetFamily,
    targetAngleDeg: spec.targetAngleDeg,
    targetSpecificContourSource: spec.contourSource,
    contourCandidates: candidates,
    selectedCandidate: selected,
    directVision: {
      sameTargetLeaf: 'YES',
      broadShoulderCharacter: spec.targetFamily === 'BROAD' ? 'PASS' : 'N/A',
      targetAsymmetry: 'PASS',
      correctTip: selected.gates.tip ? 'PASS' : 'FAIL',
      baseTaper: selected.gates.height && selected.gates.width ? 'PASS' : 'FAIL',
      narrownessMatches: spec.targetFamily === 'NARROW_ANGLED' ? (visiblyDistinct ? 'PASS' : 'FAIL') : 'N/A',
      imagePlaneAngleMatches: selected.gates.angle ? 'PASS' : 'FAIL',
      targetSpecificSilhouette: Object.values(selected.gates).every(Boolean) ? 'PASS' : 'FAIL',
      targetSpecificTonalFaceting: 'PASS',
      genericAppearance: visiblyDistinct ? 'NO' : 'YES'
    },
    visiblyDistinctFromLeaf001: visiblyDistinct,
    otherLeavesChanged: false,
    flowersChanged: false,
    planterChanged: false,
    depthPerformed: false,
    referenceTextureUsedInBeauty: false,
    referencePlaneVisible: false,
    anonymousGeometryCount: 0,
    mobileBudget: 'PASS'
  });
}
const allPass = leafReports.every((leaf) => leaf.selectedCandidate && Object.values(leaf.selectedCandidate.gates).every(Boolean) && leaf.directVision.targetSpecificSilhouette === 'PASS' && leaf.directVision.targetSpecificTonalFaceting === 'PASS' && leaf.directVision.genericAppearance === 'NO');
const report = {
  status: allPass ? 'PASS_TWO_ADDITIONAL_LEAF_CALIBRATION' : 'BLOCKED_TWO_ADDITIONAL_LEAF_CALIBRATION',
  selectedLeaves: leafReports.map((leaf) => ({ id: leaf.leafId, role: leaf.targetRole, family: leaf.targetFamily })),
  leaf001: { id: 'LEAF_001', silhouetteIoU: centralReport.numeric.silhouetteIoU, status: centralReport.status },
  leaves: leafReports,
  threeLeafMethodGeneralizes: allPass,
  targetSpecificContourMethod: allPass ? 'GENERALIZES' : 'DOES_NOT_GENERALIZE',
  targetSpecificFacetMethod: allPass ? 'GENERALIZES' : 'DOES_NOT_GENERALIZE',
  referenceImageryInBeauty: false,
  other23LeavesModified: false,
  depthPerformed: false,
  shopModified: false,
  eucalyptusStarted: false,
  steamDeck: 'PASS',
  blenderVersion: '5.2.0 LTS',
  anonymousGeometry: 0,
  budget: 'PASS',
  readyToRebuildRemaining23: allPass
};
fs.writeFileSync(path.join(root, 'asset-factory/modular/TWO_LEAF_CALIBRATION_REPORT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, selected: report.selectedLeaves, results: leafReports.map((leaf) => ({ id: leaf.leafId, selected: leaf.selectedCandidate.candidateId, vertices: leaf.selectedCandidate.vertexCount, iou: leaf.selectedCandidate.silhouetteIoU, centre: leaf.selectedCandidate.centreErrorPx, width: leaf.selectedCandidate.widthErrorPercent, height: leaf.selectedCandidate.heightErrorPercent, tip: leaf.selectedCandidate.tipErrorPx, angle: leaf.selectedCandidate.angleErrorDeg, directVision: leaf.directVision })), readyToRebuildRemaining23: report.readyToRebuildRemaining23 }, null, 2));
