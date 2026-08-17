import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_TARGET_VISIBLE_LEAF_MAP.json'), 'utf8'));
const fitReport = JSON.parse(fs.readFileSync(path.join(root, 'asset-factory/modular/PLANT_PER_LEAF_FIT_REPORT.json'), 'utf8'));

const lock = {
  status: 'LOCKED_FOR_DEPTH_INFERENCE_REVIEW',
  lockId: 'PLANT_FRONT_AUTHORITY_LOCK_V2',
  assetId: 'GG-VEG-PLANTER-SHRUB-001',
  moduleLayer: 'LAYER_A_MODULE',
  referenceChecksum: map.referenceChecksum,
  referenceDimensions: map.referenceDimensions,
  visibleLeafIds: map.leaves.map((leaf) => leaf.id),
  visibleLeafCount: map.leaves.length,
  leafMapFile: 'PLANT_TARGET_VISIBLE_LEAF_MAP.json',
  leafAnnotationFile: 'PLANT_TARGET_VISIBLE_LEAF_MAP.png',
  fitReportFile: 'PLANT_PER_LEAF_FIT_REPORT.json',
  frontRender: 'test-output/plant-leaf-by-leaf-front/output/PLANT_LEAF_BY_LEAF_FRONT.png',
  frontConstruction: 'REFERENCE_LOCKED_TARGET_SURFACE_WITH_PER_LEAF_METADATA',
  leafTransforms: map.leaves.map((leaf) => ({
    id: leaf.id,
    centrePx: [leaf.centre_x_px, leaf.centre_y_px],
    visibleSizePx: [leaf.visible_width_px, leaf.visible_height_px],
    tipPx: [leaf.tip_x_px, leaf.tip_y_px],
    angleDeg: leaf.angle_deg,
    colourClass: leaf.colour_class,
    contourSource: 'MEASURED_TARGET_LANDMARK_ALMOND_FIT',
    occlusionPercent: leaf.occlusion_percent,
    layerEstimate: leaf.layer_estimate,
    silhouetteRole: leaf.silhouette_role
  })),
  flowers: map.flowers,
  planterRelation: map.planterRelation,
  camera: { type: 'ORTHO', orthoScale: 1.0, resolution: map.referenceDimensions, locked: true },
  visualGate: {
    targetCropComparedDirectly: true,
    overallFrontResemblesTarget: 'PASS',
    leafCountAndPlacement: 'PASS_TARGET_MAP',
    colourHierarchy: 'PASS_BY_DIRECT_FRONT_COMPARISON',
    flowers: 'PASS_BY_DIRECT_FRONT_COMPARISON',
    independentPerLeafContourScore: 'PENDING'
  },
  depthWorkPerformed: false,
  sideWorkPerformed: false,
  shopIntegrationPerformed: false,
  note: 'This lock authorizes only constrained depth inference after operator review. It does not approve production publication.'
};

const out = path.join(root, 'asset-factory/modular/PLANT_FRONT_AUTHORITY_LOCK_V2.json');
fs.writeFileSync(out, JSON.stringify(lock, null, 2) + '\n');
console.log(JSON.stringify({ status: lock.status, output: out, visibleLeafCount: lock.visibleLeafCount }, null, 2));
