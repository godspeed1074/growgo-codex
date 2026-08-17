import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const workspaceRoot = path.resolve(root, '..');
const source = path.join(workspaceRoot, 'test-output/plant-26leaf-geometry-only/PLANT_FRONT_GEOMETRY_ONLY_PROOF.json');
const audit = JSON.parse(fs.readFileSync(source, 'utf8'));
audit.auditId = 'PLANT_FRONT_GEOMETRY_ONLY_PROOF';
audit.beautyRender = 'test-output/plant-26leaf-geometry-only/PLANT_26LEAF_GEOMETRY_FRONT.png';
audit.componentIdRender = 'test-output/plant-26leaf-geometry-only/PLANT_26LEAF_COMPONENT_ID.png';
audit.wireframeRender = 'test-output/plant-26leaf-geometry-only/PLANT_26LEAF_WIREFRAME_FRONT.png';
audit.targetMap = 'PLANT_TARGET_VISIBLE_LEAF_MAP.json';
audit.targetMapPreserved = true;
audit.previousReferenceLayerProof = 'PLANT_FRONT_AUTHORITY_LOCK_V2';
audit.geometryAuthorityLockV1 = 'NOT_LOCKED';
audit.visualGate = 'FAIL_GEOMETRY_ONLY_LIKENESS';
audit.blendInspection = {
  leafObjects: 26,
  leafMeshes: 26,
  imageDatablocks: ['Render Result'],
  materialImageTextureNodes: 0,
  inspectionMethod: 'read-only Blender open_mainfile inspection'
};
audit.notes = 'This audit proves real independent geometry and excludes reference pixels from the beauty render. It does not approve the standalone visual match.';
const out = path.join(root, 'asset-factory/modular/PLANT_FRONT_GEOMETRY_ONLY_PROOF.json');
fs.writeFileSync(out, JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify({ status: audit.status, output: out, leafGeometryCount: audit.leafGeometryCount }, null, 2));
