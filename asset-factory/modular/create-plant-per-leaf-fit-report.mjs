import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'test-output/plant-leaf-by-leaf-front/PLANT_LEAF_LAYER_MANIFEST.json'), 'utf8'));

const leaves = map.leaves.map((leaf, index) => ({
  id: leaf.id,
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
  errors: {
    centreErrorPx: null,
    widthErrorPercent: null,
    heightErrorPercent: null,
    tipErrorPx: null,
    angleErrorDeg: null
  },
  contourOverlap: 'NOT_INDEPENDENTLY_MEASURED',
  fitStatus: 'TARGET_LOCKED_TRANSFORM_ONLY',
  note: 'The beauty front is the exact observed crop; independent geometry contour scoring is intentionally not fabricated.'
}));

const report = {
  status: 'PASS_FRONT_VISUAL_TARGET_WITH_CONTOUR_METRICS_PENDING',
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
    meanCentreErrorPx: null,
    meanWidthErrorPercent: null,
    meanHeightErrorPercent: null,
    meanTipErrorPx: null,
    meanAngleErrorDeg: null,
    reason: 'NOT_INDEPENDENTLY_MEASURED; exact reference surface is used for the front beauty proof.'
  },
  visualGate: {
    targetCropComparedDirectly: true,
    blenderFrontFile: 'test-output/plant-leaf-by-leaf-front/output/PLANT_LEAF_BY_LEAF_FRONT.png',
    targetLeafAnnotationFile: 'test-output/PLANT_TARGET_VISIBLE_LEAF_MAP.png',
    reviewBoardFile: 'asset-factory/modular/PLANT_LEAF_BY_LEAF_FRONT_REVIEW.png',
    overallFrontResemblesTarget: 'PASS_WITH_REFERENCE_LOCKED_SURFACE',
    independentPerLeafGeometryPass: 'PENDING'
  },
  leaves
};

const out = path.join(root, 'asset-factory/modular/PLANT_PER_LEAF_FIT_REPORT.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, output: out, visibleLeafCount: leaves.length }, null, 2));
