import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const residualPath = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_REGIONS.json');
const residual = JSON.parse(fs.readFileSync(residualPath, 'utf8'));
const regions = residual.regions.filter((r) => ['A', 'B', 'D'].includes(r.probableInterpretation.code) && (r.probableInterpretation.code === 'A' ? r.pixelArea >= 10 : r.pixelArea >= 4));
let leafIndex = 27;
const selections = regions.map((r) => {
  const classification = r.probableInterpretation.code;
  const isPartialLeaf = classification === 'A';
  const entry = {
    regionId: r.REGION_ID,
    classification,
    semanticType: isPartialLeaf ? 'OBSERVED_PARTIAL_LEAF' : 'OBSERVED_TRANSITION_FOLIAGE',
    objectId: isPartialLeaf ? `LEAF_OBS_${String(leafIndex++).padStart(3, '0')}` : `OBSERVED_TRANSITION_FOLIAGE_${r.REGION_ID}`,
    contourPx: r.contourPx,
    visiblePixelArea: r.pixelArea,
    boundingBox: r.boundingBox,
    centre: r.centre,
    dominantTargetColour: r.dominantTargetColour,
    neighboringLeafIds: r.neighboringLeafIds,
    edgeTipEvidence: r.edgeTipEvidence,
    provenance: { source: 'PLANT_OBSERVED_FOLIAGE_RESIDUAL_REGIONS.json', residualRegionId: r.REGION_ID, targetPath: residual.sourceTarget },
    // Lower foliage sits behind the temporary flowers but in front of the
    // low leaf tier; the upper A region is a visible overlap transition and
    // must remain above the back leaf that otherwise occludes its evidence.
    zLayer: classification === 'D' ? 0.305 : (r.REGION_ID === 'REGION_009' ? 0.304 : (classification === 'B' ? 0.212 : 0.218)),
    preserveExistingLeaves: true
  };
  return entry;
});
const manifest = {
  status: 'CANDIDATE_OBSERVED_FOLIAGE_RESIDUAL_GEOMETRY',
  sourceResidual: 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_RESIDUAL_REGIONS.json',
  rule: 'visible residual evidence only; convex-hull shallow prism; no reference imagery or raster patch in beauty',
  frozenLeafIds: Array.from({ length: 26 }, (_, i) => `LEAF_OBS_${String(i + 1).padStart(3, '0')}`),
  regions: selections,
  additionalObservedPartialLeaves: selections.filter((r) => r.classification === 'A').map((r) => r.objectId),
  observedTransitionFoliageIds: selections.filter((r) => r.classification !== 'A').map((r) => r.objectId),
  excludedResidualRegions: residual.regions.filter((r) => !selections.some((s) => s.regionId === r.REGION_ID)).map((r) => ({ regionId: r.REGION_ID, area: r.pixelArea, classification: r.probableInterpretation.code, reason: r.probableInterpretation.reason })),
  flowersFinal: false,
  planterFinal: false,
  depthPerformed: false,
  shopIntegrationPerformed: false,
  referenceTextureUsedInBeauty: false,
  anonymousGeometryCount: 0,
  mobileBudget: 'PASS_CANDIDATE'
};
const out = path.join(root, 'asset-factory/modular/PLANT_OBSERVED_FOLIAGE_TRANSITION_MANIFEST.json');
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({ status: manifest.status, selectedRegions: selections.length, additionalObservedPartialLeaves: manifest.additionalObservedPartialLeaves, transitionFoliage: manifest.observedTransitionFoliageIds, excluded: manifest.excludedResidualRegions }, null, 2));
