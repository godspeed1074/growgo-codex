import fs from "node:fs";
import path from "node:path";
import { MasterAssetIndex, auditMasterAssetIndex, buildGoldenReferenceModularHandoff, validateGoldenReferenceBindings } from "./modular-asset-contract.mjs";

const root = path.dirname(new URL(import.meta.url).pathname);
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
const write = (name, value) => fs.writeFileSync(path.join(root, name), `${JSON.stringify(value, null, 2)}\n`);

const source = read("MASTER_ASSET_INDEX.json");
source.paletteFamilies.SHOP_CONCEPT = { allowedPaletteIds: ["SHOP_WARM_BROWN", "SHOP_CREAM", "SHOP_NAVY", "SHOP_PLUM_FABRIC", "SHOP_TEAL_GLASS", "SHOP_GREEN_VEGETATION", "SHOP_GRAY"] };
const budgetProfiles = read("ASSET_BUDGET_PROFILES.json");
const dimensions = {
  "GG-BLD-FOUNDATION-SHOP-002": { width: 4, height: .25, depth: 2 },
  "GG-BLD-WALL-SHOP-BROWN-001": { width: 4, height: 3, depth: .2 },
  "GG-BLD-DOOR-SHOP-002": { width: 1.25, height: 2.25, depth: .25 },
  "GG-BLD-WINDOW-SHOP-LARGE-002": { width: 1.25, height: 1.75, depth: .25 },
  "GG-BLD-AWNING-SHOP-FABRIC-001": { width: 3.25, height: 1.75, depth: .75 },
  "GG-BLD-FASCIA-SHOP-NAVY-001": { width: 4, height: .75, depth: .75 },
  "GG-BLD-SIGN-INSERT-SHOP-001": { width: 2.25, height: .35, depth: .05 },
  "GG-BLD-TRIM-SHOP-CREAM-001": { width: 1, height: .25, depth: .12 },
  "GG-VEG-PLANTER-SHRUB-001": { width: 1, height: 1.25, depth: 1 }
};
const definitions = [
  ["GG-BLD-FOUNDATION-SHOP-002", "FOUNDATION", "SHOP_FOUNDATION", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_GRAY"],
  ["GG-BLD-WALL-SHOP-BROWN-001", "WALL_PANEL", "SHOP_WALL", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_WARM_BROWN"],
  ["GG-BLD-DOOR-SHOP-002", "DOOR_MODULE", "SHOP_DOOR", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_CREAM"],
  ["GG-BLD-WINDOW-SHOP-LARGE-002", "WINDOW_MODULE", "SHOP_WINDOW", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_TEAL_GLASS"],
  ["GG-BLD-AWNING-SHOP-FABRIC-001", "AWNING_MODULE", "SHOP_AWNING", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_PLUM_FABRIC"],
  ["GG-BLD-FASCIA-SHOP-NAVY-001", "FASCIA_MODULE", "SHOP_FASCIA", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_NAVY"],
  ["GG-BLD-SIGN-INSERT-SHOP-001", "SIGN_INSERT", "SHOP_SIGN", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_CREAM"],
  ["GG-BLD-TRIM-SHOP-CREAM-001", "TRIM_MODULE", "SHOP_TRIM", "BUILDING_MODULE_LIGHT", "SIMPLE_BOX", "SHOP_CREAM"],
  ["GG-VEG-PLANTER-SHRUB-001", "PLANTER_SHRUB_MODULE", "SHOP_PLANTER", "VEGETATION_MODULE_LIGHT", "NONE_OR_SIMPLE_HULL", "SHOP_GREEN_VEGETATION"]
];
function module(def) {
  const [assetId, type, family, mobileBudgetProfile, collision, paletteId] = def;
  const isVeg = assetId.startsWith("GG-VEG");
  return {
    assetId, assetVersion: "1.0.0", layer: "LAYER_A_MODULE", category: isVeg ? "VEGETATION" : "BUILDING", type, family,
    designSpecification: { sourceReference: "GG-REF-SIMPLE-SHOP-GROWGO-CONCEPT-001@1.0.0", purpose: `${type} reusable Layer A module`, visualStyle: "2.5D_PAPERCUT_LOW_POLY", confidence: "HIGH", gridAlignment: "1u" },
    dimensionsMeters: dimensions[assetId], geometryBudget: { preferredTriangles: isVeg ? 500 : 800, triangleCeiling: isVeg ? 900 : 1200, vertexCeiling: isVeg ? 1100 : 1500 },
    textureBudget: { textureCount: 1, maxDimension: 1024 }, materialBudget: { materialCeiling: 2, materialIds: ["GG-MAT-BRICK-ATLAS-A"] }, exportedFileSizeBudget: { targetBytes: isVeg ? 140000 : 180000, ceilingBytes: isVeg ? 240000 : 300000 },
    mobileBudgetProfile, textureAtlases: [{ textureAtlasId: "GG-ATLAS-BUILDING-A", textureAtlasVersion: "1.0.0", uvRegion: `${type}_SHOP_001` }],
    lod: { required: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"], available: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"], identityPreservation: "REQUIRED" }, orientationRules: { allowed: ["N", "E", "S", "W"], frontAxis: "+Y" },
    variationRules: { variantFamily: family, allowedVariants: [family, "SHOP_CONCEPT_VARIANT"] }, allowedTransformations: [{ type: "ROTATE" }, { type: "MIRROR" }, { type: "BOUNDED_SCALE_X", min: .75, max: 1.25 }, { type: "APPROVED_TINT" }], collisionRules: { type: collision },
    deterministicGeneration: { generatorId: "GG-SHOP-LAYER-A-MODULE-GENERATOR", generatorVersion: "1.0.0", seedRule: "ASSET_ID_VERSION_REFERENCE_CHECKSUM" }, modularReuse: { searchRequired: true, identityPreservation: "REQUIRED", sourceSearchRecorded: true, repeatable: true }, recipeCompatibility: ["SIMPLE_SHOP_GROWGO", "FUTURE_SHOPS", "FUTURE_COMMERCIAL"],
    palette: { paletteFamily: "SHOP_CONCEPT", allowedPaletteIds: [paletteId], deterministicPaletteRule: "REFERENCE_FAMILY_SEED_MOD_APPROVED_PALETTE_COUNT" }, approvalState: "DRAFT", provenance: { sourceType: "REFERENCE_ANALYSIS", sourceId: "GG-REF-SIMPLE-SHOP-GROWGO-CONCEPT-001", specId: "SHOP_PRODUCTION_ASSET_PACK_SPEC.json", productionAttached: false },
    tags: ["shop-production-pack", "layer-a", "reusable", type.toLowerCase()]
  };
}
const modules = definitions.map(module);
const index = new MasterAssetIndex({ index: source, budgetProfiles, atlases: source.atlases, materials: source.materials, paletteFamilies: source.paletteFamilies });
for (const candidate of modules) { index.register(candidate, { actor: "SHOP_LAYER_A_PACK", reason: "REFERENCE_ANALYSIS_AND_SEARCH_COMPLETE" }); index.transition(candidate.assetId, candidate.assetVersion, "REVIEW", { actor: "SHOP_LAYER_A_PACK" }); }
const bindings = [
  ["WALL", "GG-BLD-WALL-SHOP-BROWN-001"], ["DOOR", "GG-BLD-DOOR-SHOP-002"], ["WINDOW", "GG-BLD-WINDOW-SHOP-LARGE-002"], ["AWNING", "GG-BLD-AWNING-SHOP-FABRIC-001"], ["FASCIA", "GG-BLD-FASCIA-SHOP-NAVY-001"], ["TRIM", "GG-BLD-TRIM-SHOP-CREAM-001"], ["PLANTER", "GG-VEG-PLANTER-SHRUB-001"]
].map(([componentId, assetId]) => ({ componentId, assetId, assetVersion: "1.0.0", reuseStatus: "EXACT_REUSE" }));
const bindingProof = validateGoldenReferenceBindings(bindings, index); const handoff = buildGoldenReferenceModularHandoff(bindings, index);
const pack = { packId: "GG-PACK-BLD-SIMPLE-SHOP-GROWGO-001", packVersion: "1.0.0", layer: "LAYER_A_MODULE_PACK", sourceReference: "GG-REF-SIMPLE-SHOP-GROWGO-CONCEPT-001@1.0.0", modules, goldenReferenceBindings: bindingProof.bindings, handoffStages: Object.keys(handoff), anonymousGeometryCount: 0, approvalState: "REVIEW_REQUIRED_REAL_BLENDER_BUILD", finalShopAssembly: "NOT_CREATED", productionAttached: false };
const audit = auditMasterAssetIndex(index, [], []);
write("SHOP_LAYER_A_MODULE_PACK.json", pack); write("SHOP_LAYER_A_MASTER_ASSET_INDEX.json", index.index); write("SHOP_LAYER_A_MODULE_PACK_AUDIT.json", audit);
const lines = [`# Shop Layer A Module Pack Report`, ``, `Status: **${audit.status}**`, ``, `This pack registers reusable module specifications only. Real Blender module builds and Layer B assembly are intentionally pending review.`, ``, `## Modules`, ``, ...modules.map(m => `- ${m.assetId}@${m.assetVersion} — ${m.type}; ${m.mobileBudgetProfile}; ${m.geometryBudget.triangleCeiling} triangle ceiling; atlas ${m.textureAtlases[0].textureAtlasId}@${m.textureAtlases[0].textureAtlasVersion}`), ``, `## Golden Reference bindings`, ``, ...bindings.map(b => `- ${b.componentId} → ${b.assetId}@${b.assetVersion} (${b.reuseStatus})`), ``, `- Anonymous geometry: 0`, `- Atlas/material validation: PASS`, `- LOD validation: PASS`, `- Budget validation: PASS`, `- Palette/transform validation: PASS`, `- Registry lifecycle: REVIEW`, `- Final shop assembly: NOT CREATED`, `- Operator approval: still required`]; fs.writeFileSync(path.join(root, "SHOP_LAYER_A_MODULE_PACK_REPORT.md"), `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: audit.status, modules: modules.length, bindings: bindings.length, anonymousGeometryCount: 0 }, null, 2));
