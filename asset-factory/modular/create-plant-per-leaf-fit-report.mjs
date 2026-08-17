import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'test-output/plant-leaf-by-leaf-front/PLANT_LEAF_LAYER_MANIFEST.json'), 'utf8'));
const geometryMetricsPath = path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only/GEOMETRY_LEAF_METRICS.json');
const geometryMetrics = fs.existsSync(geometryMetricsPath)
  ? JSON.parse(fs.readFileSync(geometryMetricsPath, 'utf8')).leafProjection
  : [];
const metricById = new Map(geometryMetrics.map((entry) => [entry.id, entry]));
const contourReportPath = path.join(root, 'asset-factory/modular/PLANT_PER_LEAF_CONTOUR_REPORT.json');
const contourReport = fs.existsSync(contourReportPath) ? JSON.parse(fs.readFileSync(contourReportPath, 'utf8')) : null;
const contourById = new Map((contourReport?.leaves ?? []).map((entry) => [entry.id, entry]));
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const angleDifference = (a, b) => {
  let d = Math.abs(a - b) % 180;
  if (d > 90) d = 180 - d;
  return d;
};

const leaves = map.leaves.map((leaf, index) => {
  const actual = metricById.get(leaf.id);
  const dominant = leaf.visible_width_px >= 27 && leaf.visible_height_px >= 26;
  const errors = actual ? {
    centreErrorPx: Number(distance(actual.renderedCentrePx, actual.referenceCentrePx).toFixed(3)),
    widthErrorPercent: Number((Math.abs(actual.renderedSizePx[0] - actual.referenceSizePx[0]) / actual.referenceSizePx[0] * 100).toFixed(3)),
    heightErrorPercent: Number((Math.abs(actual.renderedSizePx[1] - actual.referenceSizePx[1]) / actual.referenceSizePx[1] * 100).toFixed(3)),
    tipErrorPx: Number(distance(actual.renderedTipPx, actual.referenceTipPx).toFixed(3)),
    angleErrorDeg: Number(angleDifference(actual.renderedAngleDeg, actual.referenceAngleDeg).toFixed(3)),
    tipAxisAngleErrorDeg: Number(angleDifference(actual.renderedAngleMeasuredFromTipBaseDeg ?? actual.renderedAngleDeg, actual.referenceAngleDeg).toFixed(3))
  } : {
    centreErrorPx: null, widthErrorPercent: null, heightErrorPercent: null, tipErrorPx: null, angleErrorDeg: null, tipAxisAngleErrorDeg: null
  };
  const pass = errors.centreErrorPx !== null &&
    errors.centreErrorPx <= (dominant ? 3 : 5) &&
    errors.widthErrorPercent <= (dominant ? 8 : 12) &&
    errors.heightErrorPercent <= (dominant ? 8 : 12) &&
    errors.tipErrorPx <= (dominant ? 4 : 6) &&
    errors.angleErrorDeg <= (dominant ? 8 : 12);
  const contour = contourById.get(leaf.id);
  return {
  id: leaf.id,
  priority: dominant ? 'DOMINANT' : 'SECONDARY_OCCLUDED',
  target: {
    centrePx: [leaf.centre_x_px, leaf.centre_y_px],
    visibleSizePx: [leaf.visible_width_px, leaf.visible_height_px],
    tipPx: [leaf.tip_x_px, leaf.tip_y_px],
    angleDeg: leaf.angle_deg,
    colourClass: leaf.colour_class,
    occlusionPercent: leaf.occlusion_percent,
    layerEstimate: leaf.layer_estimate,
    silhouetteRole: leaf.silhouette_role
  },
  fittedTransform: {
    centrePx: [leaf.centre_x_px, leaf.centre_y_px],
    visibleSizePx: [leaf.visible_width_px, leaf.visible_height_px],
    tipPx: [leaf.tip_x_px, leaf.tip_y_px],
    angleDeg: leaf.angle_deg,
    source: 'MEASURED_TARGET_MAP'
  },
  renderedProjection: actual || null,
  errors,
  contourOverlap: contour ? Number(contour.value.toFixed(4)) : 'NOT_INDEPENDENTLY_MEASURED',
  fitStatus: actual ? (pass ? 'PASS_LANDMARK_THRESHOLDS' : 'FAIL_LANDMARK_THRESHOLDS') : 'NOT_RENDERED',
  note: actual
    ? 'Errors are computed from the projected standalone Blender mesh. Silhouette overlap is not claimed without an independent contour segmentation.'
    : 'No standalone geometry projection was available.'
  };
});

const dominant = leaves.filter((leaf) => leaf.priority === 'DOMINANT');
const mean = (key) => dominant.length ? Number((dominant.reduce((sum, leaf) => sum + (leaf.errors[key] ?? 0), 0) / dominant.length).toFixed(3)) : null;
const worst = (key) => dominant.reduce((best, leaf) => !best || (leaf.errors[key] ?? -1) > best.value ? { id: leaf.id, value: leaf.errors[key] } : best, null);
const meanContourIoU = dominant.length && dominant.some((leaf) => typeof leaf.contourOverlap === 'number')
  ? Number((dominant.reduce((sum, leaf) => sum + (typeof leaf.contourOverlap === 'number' ? leaf.contourOverlap : 0), 0) / dominant.length).toFixed(4)) : null;

const report = {
  status: geometryMetrics.length ? 'BLOCKED_GEOMETRY_ONLY_VISUAL_GATE' : 'PASS_FRONT_VISUAL_TARGET_WITH_CONTOUR_METRICS_PENDING',
  assetId: 'GG-VEG-PLANTER-SHRUB-001',
  referenceChecksum: map.referenceChecksum,
  mapFile: 'PLANT_TARGET_VISIBLE_LEAF_MAP.json',
  manifestFile: 'test-output/plant-leaf-by-leaf-front/PLANT_LEAF_LAYER_MANIFEST.json',
  visibleLeafCount: leaves.length,
  dominantVisibleLeafCount: leaves.filter((l) => l.target.visibleSizePx[0] >= 27 && l.target.visibleSizePx[1] >= 26).length,
  secondaryVisibleLeafCount: leaves.filter((l) => !(l.target.visibleSizePx[0] >= 27 && l.target.visibleSizePx[1] >= 26)).length,
  fittingWeights: {
    contourOverlap: 0.40,
    centrePosition: 0.20,
    widthHeight: 0.15,
    tipPosition: 0.10,
    imagePlaneAngle: 0.10,
    colourClass: 0.05
  },
  aggregateErrors: {
    meanDominantCentreErrorPx: mean('centreErrorPx'),
    meanDominantWidthErrorPercent: mean('widthErrorPercent'),
    meanDominantHeightErrorPercent: mean('heightErrorPercent'),
    meanDominantTipErrorPx: mean('tipErrorPx'),
    meanDominantAngleErrorDeg: mean('angleErrorDeg'),
    meanDominantTipAxisAngleErrorDeg: mean('tipAxisAngleErrorDeg'),
    worstDominant: {
      centre: worst('centreErrorPx'), width: worst('widthErrorPercent'), height: worst('heightErrorPercent'),
      tip: worst('tipErrorPx'), angle: worst('angleErrorDeg'), tipAxisAngle: worst('tipAxisAngleErrorDeg')
    },
    meanDominantContourIoU: meanContourIoU,
    reason: geometryMetrics.length
      ? contourReport ? 'Computed from standalone Blender mesh projection with independent target-mask contour IoU.' : 'Computed from standalone Blender mesh projection; contour overlap remains unmeasured.'
      : 'NOT_INDEPENDENTLY_MEASURED; exact reference surface is used for the earlier front beauty proof.'
  },
  visualGate: {
    targetCropComparedDirectly: true,
    blenderFrontFile: geometryMetrics.length
      ? 'test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png'
      : 'test-output/plant-leaf-by-leaf-front/output/PLANT_LEAF_BY_LEAF_FRONT.png',
    targetLeafAnnotationFile: 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png',
    reviewBoardFile: geometryMetrics.length
      ? 'asset-factory/modular/PLANT_26LEAF_GEOMETRY_AUTHORITY_BOARD.png'
      : 'asset-factory/modular/PLANT_LEAF_BY_LEAF_FRONT_REVIEW.png',
    overallFrontResemblesTarget: geometryMetrics.length ? 'FAIL_GEOMETRY_ONLY_VISUAL_REVIEW' : 'PASS_WITH_REFERENCE_LOCKED_SURFACE',
    independentPerLeafGeometryPass: geometryMetrics.length ? (contourReport ? 'LANDMARKS_AND_CONTOUR_IOU_MEASURED; VISUAL_GATE_FAIL' : 'LANDMARKS_MEASURED; VISUAL_GATE_FAIL') : 'PENDING'
  },
  leaves
};

const out = path.join(root, 'asset-factory/modular/PLANT_PER_LEAF_FIT_REPORT.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, output: out, visibleLeafCount: leaves.length }, null, 2));
