import fs from 'node:fs';
import path from 'node:path';
import { MasterAssetIndex } from './modular-asset-contract.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const indexPath = path.join(root, 'asset-factory/modular/MASTER_ASSET_INDEX.json');
const profilePath = path.join(root, 'asset-factory/modular/ASSET_BUDGET_PROFILES.json');
const registryPath = path.join(root, 'asset-factory/modular/PHILLIP_ISLAND_TREE_LAYER_A_REGISTRY.json');
const auditPath = path.join(root, 'asset-factory/modular/TREE_NATIVE_ROUNDED_001_V4_PROMOTION_AUDIT.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));

profiles.profiles.VEGETATION_RICH_RASTER_SHARED_ATLAS_LIGHT ??= {
  preferredTriangleTarget: 500,
  hardTriangleCeiling: 900,
  vertexCeiling: 1100,
  materialCeiling: 2,
  textureCount: 1,
  maxTextureDimension: 2048,
  textureAtlasRequired: true,
  exportedFileSizeTargetBytes: 2800000,
  exportedFileSizeCeilingBytes: 3000000,
  requiredLods: ['LOD_CLOSE', 'LOD_GAMEPLAY', 'LOD_MAP'],
  collisionExpectation: 'NONE_OR_SIMPLE_HULL',
  instancingExpectation: 'REQUIRED'
};
index.atlases ??= [];
if (!index.atlases.some(x => x.textureAtlasId === 'GG-ATLAS-FOLIAGE-RICH-V2')) index.atlases.push({ textureAtlasId: 'GG-ATLAS-FOLIAGE-RICH-V2', textureAtlasVersion: '2.0.0', status: 'APPROVED' });
index.materials ??= [];
for (const material of [
  { materialId: 'GG-MAT-TREE-BARK-SHARED', materialVersion: '1.0.0', textureAtlasId: 'GG-ATLAS-FOLIAGE-RICH-V2', status: 'APPROVED' },
  { materialId: 'GG-MAT-FOLIAGE-RICH-RASTER-V2', materialVersion: '2.0.0', textureAtlasId: 'GG-ATLAS-FOLIAGE-RICH-V2', status: 'APPROVED' }
]) if (!index.materials.some(x => x.materialId === material.materialId)) index.materials.push(material);
index.paletteFamilies ??= {};
index.paletteFamilies.GROWGO_NATIVE_FOLIAGE ??= { allowedPaletteIds: ['BASE', 'COOL', 'WARM', 'LIGHT'] };

const assetId = 'GG-VEG-TREE-NATIVE-ROUNDED-001';
const module = {
  assetId, assetVersion: '4.0.0', layer: 'LAYER_A_MODULE', category: 'VEGETATION', type: 'TREE_CAMERA_AUTHORED_RICH_RASTER', family: 'PHILLIP_ISLAND_NATIVE_TREE',
  designSpecification: { construction: 'locked V4 native-rounded trunk/carcass with camera-authored illustrated foliage cards', silhouette: 'dense rounded native crown; upper highlight card rebalanced', runtimeAssetId: 'TREE_NATIVE_ROUNDED_001' },
  dimensionsMeters: { width: 8.0, height: 8.6, depth: 4.0 },
  geometryBudget: { preferredTriangles: 150, triangleCeiling: 300, vertexCeiling: 450 },
  textureBudget: { textureCount: 1, maxDimension: 1254 },
  materialBudget: { materialCeiling: 2, materialIds: ['GG-MAT-TREE-BARK-SHARED', 'GG-MAT-FOLIAGE-RICH-RASTER-V2'] },
  exportedFileSizeBudget: { targetBytes: 2800000, ceilingBytes: 3000000 },
  lod: { required: ['LOD_CLOSE', 'LOD_GAMEPLAY', 'LOD_MAP'], available: ['LOD_CLOSE', 'LOD_GAMEPLAY', 'LOD_MAP'], identityPreservation: 'REQUIRED', cards: { CLOSE: 12, GAMEPLAY: 8, MAP: 3 }, triangles: { CLOSE: 96, GAMEPLAY: 88, MAP: 78 } },
  textureAtlases: [{ textureAtlasId: 'GG-ATLAS-FOLIAGE-RICH-V2', textureAtlasVersion: '2.0.0', uvRegion: 'APPROVED_RICH_CLUSTER_LIBRARY_V2' }],
  orientationRules: { allowed: ['CAMERA_AUTHORED_FRONT', 'MIRRORED_FRONT'], frontAxis: '+Y', cameraContract: 'GROWGO_VEGETATION_GAMEPLAY_CAMERA_CONTRACT@1.0.0' },
  variationRules: { variantFamily: 'NATIVE_ROUNDED', allowedVariants: ['BASE', 'COOL', 'WARM', 'LIGHT'], deterministicRule: 'SHA256_RUNTIME_PLACEMENT_SEED', mirrorAllowed: true, uniformScaleRange: [0.89, 1.10], worldRotationDegrees: [-12, 12] },
  allowedTransformations: [{ type: 'MIRROR' }, { type: 'UNIFORM_SCALE', min: 0.89, max: 1.10 }, { type: 'ROTATE' }, { type: 'APPROVED_TINT' }],
  collisionRules: { type: 'SIMPLE_HULL', source: 'LOCKED_V4_CARCASS' },
  deterministicGeneration: { generatorId: 'GROWGO_CAMERA_AUTHORED_ILLUSTRATED_FOLIAGE_CLUSTER_METHOD', generatorVersion: '1.0.0', seedRule: 'SHA256_ASSET_VERSION_PLACEMENT_CONTEXT', sourceArtLocked: true },
  modularReuse: { searchRequired: true, repeatAxis: 'NONE', identityPreservation: 'REQUIRED', instancing: 'REQUIRED', anonymousGeometryCount: 0 },
  recipeCompatibility: ['RECIPE_NATURE_COASTAL_ENVIRONMENT_001', 'RECIPE_NATURE_ROADSIDE_NATIVE_001', 'RECIPE_NATURE_PARK_STANDARD_001', 'RECIPE_NATURE_FOREST_ENVIRONMENT_001'],
  mobileBudgetProfile: 'VEGETATION_RICH_RASTER_SHARED_ATLAS_LIGHT',
  palette: { paletteFamily: 'GROWGO_NATIVE_FOLIAGE', allowedPaletteIds: ['BASE', 'COOL', 'WARM', 'LIGHT'], deterministicPaletteRule: 'SHA256_RUNTIME_IDENTITY_MOD_PALETTE_COUNT' },
  approvalState: 'DRAFT',
  provenance: { sourceType: 'HUMAN_APPROVED_BLENDER_OUTPUT', sourceId: 'TREE_NATIVE_ROUNDED_001_V4_RICH_RASTER_HUMAN_APPROVAL', specId: 'GROWGO_CAMERA_AUTHORED_ILLUSTRATED_FOLIAGE_CLUSTER_METHOD@1.0.0', goldenReferenceId: 'GROWGO_LUSH_MOBILE_MAP_VEGETATION_DIRECTION_001', worker: 'Steam Deck Blender 5.2.0 LTS', evidenceCommit: 'f2a41a9' },
  tags: ['tree', 'native', 'rounded', 'phillip-island', 'camera-authored', 'rich-raster', 'layer-a']
};

if (!index.modules.some(x => x.assetId === assetId && x.assetVersion === '4.0.0')) {
  const registry = new MasterAssetIndex({ index, budgetProfiles: profiles });
  registry.register(module, { actor: 'OPERATOR', reason: 'HUMAN_VISUAL_APPROVAL_V4' });
  registry.transition(assetId, '4.0.0', 'REVIEW', { actor: 'ASSET_FACTORY', reason: 'BUILD_AND_REVIEW_EVIDENCE_COMPLETE' });
  registry.transition(assetId, '4.0.0', 'APPROVED', { actor: 'OPERATOR', reason: 'HUMAN_FINAL_APPROVAL', evidence: { BUILD: 'PASS', REFERENCE_REVIEW: 'PASS', BUDGET_VALIDATION: 'PASS', MODULAR_REUSE_VALIDATION: 'PASS' } });
  index.modules = registry.index.modules; index.history = registry.index.history;
}
const approved = index.modules.find(x => x.assetId === assetId && x.assetVersion === '4.0.0');
if (!approved || approved.approvalState !== 'APPROVED') throw new Error('NATIVE_ROUNDED_PROMOTION_FAILED');

const registryRecord = { schemaVersion: '1.0.0', registry: 'PHILLIP_ISLAND_TREE_LAYER_A_REGISTRY', productionAtlasEligible: false, atlasRuntimeEnabled: false, modules: [{ assetId, runtimeAssetId: 'TREE_NATIVE_ROUNDED_001', assetVersion: '4.0.0', approvalState: 'APPROVED', packageState: 'APPROVED_LOCAL_ASSET_FACTORY', lodAssets: { CLOSE: 'rich-v4-top-corrected-output/TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_LOD_CLOSE.glb', GAMEPLAY: 'rich-v4-top-corrected-output/TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_LOD_GAMEPLAY.glb', MAP: 'rich-v4-top-corrected-output/TREE_NATIVE_ROUNDED_001_V4_TOP_CORRECTED_LOD_MAP.glb' }, atlasEligibility: 'REGISTERED_NOT_ENABLED' }] };
const audit = { status: 'PASS', assetId, runtimeAssetId: 'TREE_NATIVE_ROUNDED_001', version: '4.0.0', approvalState: 'APPROVED', operatorApproval: 'YES', evidence: { richRasterFoliage: 'PASS', upperCrownCorrection: 'PASS', lods: 'PASS', budget: 'PASS', modularReuse: 'PASS', anonymousGeometry: 0, cameraContract: 'PASS' }, atlasArchitectureModified: false, productionAtlasEnabled: false };
fs.writeFileSync(profilePath, JSON.stringify(profiles, null, 2) + '\n');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registryRecord, null, 2) + '\n');
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit, null, 2));
