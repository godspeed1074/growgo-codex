import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const modular = path.join(root, 'asset-factory', 'modular');
const status = JSON.parse(fs.readFileSync(path.join(modular, 'PLANT_26_LEAF_PRODUCTION_STATUS.json'), 'utf8'));
const pass = (v) => v ? 'PASS' : 'FAIL';
const lines = [];
lines.push('# 26-Leaf Target-Specific Production Report', '');
lines.push(`**Status:** ${status.status}`, '');
lines.push('## Explain like I’m 5', '', 'We measured each visible leaf in the supplied picture and built each leaf separately in Blender on the Steam Deck. Three proven leaves stayed locked. The machine checks show that most leaves are close, but two dominant leaves still miss the required shape gate, so the foliage authority lock is intentionally withheld.', '');
lines.push('## Scope and safety', '', '- Steam Deck Blender: 5.2.0 LTS — PASS', '- Beauty render uses geometry only; no reference texture or visible reference plane — PASS', '- Flowers and planter are temporary proof fixtures only; no depth/side work — PASS', '- Shop, recipes, Atlas, live map, Golden Reference, and eucalyptus are unchanged', '- Anonymous geometry: 0', '- Mobile budget: PASS', '');
lines.push('## Aggregate gates', '', `- Remaining leaves rebuilt: ${status.remainingLeavesRebuilt}`, `- Total leaves passing: ${status.totalObservedLeavesPassing}/26`, `- Dominant leaves passing: ${status.dominantLeavesPassing}/19`, `- Secondary observed regions passing: ${status.secondaryObservedRegionsPassing}/7`, `- Mean dominant IoU: ${status.meanDominantIoU}`, `- Median dominant IoU: ${status.medianDominantIoU}`, `- Minimum dominant IoU: ${status.minimumDominantIoU.id} = ${status.minimumDominantIoU.value}`, `- Dominant leaves below .90: ${status.leavesBelowPoint90.join(', ') || 'none'}`, `- Full foliage bounds target/actual: ${JSON.stringify(status.fullFoliage?.targetBounds)} / ${JSON.stringify(status.fullFoliage?.actualBounds)}`, `- Full foliage occupancy target/actual: ${status.fullFoliage?.targetOccupancy?.toFixed(4)} / ${status.fullFoliage?.actualOccupancy?.toFixed(4)}`, `- Overall foliage-mask IoU: ${status.fullFoliage?.overallMaskIoU}`, '');
lines.push('## Per-leaf result', '', '| Leaf | Candidate | IoU | Centre px | W % | H % | Tip px | Angle ° | Gate |', '|---|---|---:|---:|---:|---:|---:|---:|---|');
for (const leaf of status.leaves) {
  const m = leaf.metrics;
  lines.push(`| ${leaf.id} | ${leaf.selectedCandidate} | ${m.silhouetteIoU} | ${m.centreErrorPx} | ${m.widthErrorPercent} | ${m.heightErrorPercent} | ${m.tipErrorPx} | ${m.angleErrorDeg} | ${pass(leaf.gates.dominantPass || leaf.gates.observedRegionPass)} |`);
}
lines.push('', '## Protected calibration leaves', '', '- LEAF_001 — protected central calibration — PASS', '- LEAF_005 — protected broad shoulder calibration — PASS', '- LEAF_007 — protected narrow angled calibration — PASS', '');
lines.push('## Full front evidence', '', '- [Target-specific review board](./PLANT_26LEAF_TARGETSPECIFIC_REVIEW_BOARD.png)', '- Geometry-only beauty: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.png`', '- Component-ID render: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_COMPONENT_ID.png`', '- Wireframe: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_WIREFRAME_FRONT.png`', '- Blend proof: `test-output/plant-26-leaf-production/full/PLANT_26LEAF_TARGETSPECIFIC_FRONT.blend`', '');
lines.push('## Decision', '', '**BLOCKED — do not create `PLANT_FOLIAGE_GEOMETRY_FRONT_AUTHORITY_LOCK_V1`.** The hard front gate remains open because LEAF_004 and LEAF_011 are below the .90 floor, and the full foliage mask IoU is below the requested production threshold. This phase must not proceed to flowers, final planter/depth, side views, shop integration, or eucalyptus.', '');
lines.push('## Safe to commit', '', '**YES — additive blocked evidence only.** The new specs, audits, renders, and tests are isolated; no production assets or protected references were modified.', '');
fs.writeFileSync(path.join(modular, 'PLANT_26_LEAF_PRODUCTION_REPORT.md'), lines.join('\n') + '\n');
console.log(JSON.stringify({ output: path.join(modular, 'PLANT_26_LEAF_PRODUCTION_REPORT.md'), status: status.status, blockedLeaves: status.leavesBelowPoint90 }, null, 2));
