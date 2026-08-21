import { createHash } from "node:crypto";

export const ASSET_LAYERS = Object.freeze(["LAYER_A_MODULE", "LAYER_B_RECIPE", "LAYER_C_RUNTIME_ASSEMBLY"]);
export const ASSET_FAMILIES = Object.freeze(["BUILDING", "SCENERY", "VEGETATION", "RAILWAY", "TERRAIN", "VEHICLE", "LANDMARK", "ROAD_STREET_FURNITURE"]);
export const APPROVAL_STATES = Object.freeze(["DRAFT", "REVIEW", "APPROVED", "DEPRECATED", "SUPERSEDED"]);
export const REUSE_OUTCOMES = Object.freeze(["EXACT_REUSE", "PARAMETRIC_REUSE", "VARIANT_REUSE", "NO_COMPATIBLE_MODULE"]);
export const REUSE_REJECTION_REASONS = Object.freeze(["PROPORTION_MISMATCH", "SILHOUETTE_MISMATCH", "STYLE_FAMILY_MISMATCH", "DIMENSION_MISMATCH", "TRANSFORMATION_NOT_ALLOWED", "BUDGET_INCOMPATIBLE"]);
export const TRANSFORM_TYPES = Object.freeze(["ROTATE", "MIRROR", "UNIFORM_SCALE", "BOUNDED_SCALE_X", "BOUNDED_SCALE_Y", "BOUNDED_SCALE_Z", "APPROVED_TINT", "PARAMETER_ADJUST"]);

const ASSET_ID = /^GG-[A-Z0-9]+-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{3,}$/;
const RECIPE_ID = /^GG-REC-[A-Z0-9]+(?:-[A-Z0-9]+)*-[0-9]{3,}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export class ContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ContractError";
    this.code = code;
    this.details = details;
  }
}

const fail = (code, message, details) => { throw new ContractError(code, message, details); };
const object = (value) => value && typeof value === "object" && !Array.isArray(value);
const required = (value, code, name) => { if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) fail(code, `${name} is required`); };
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!object(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
};
const canonical = (value) => JSON.stringify(canonicalize(value));
const clone = (value) => structuredClone(value);

export function validateAssetId(assetId) {
  if (typeof assetId !== "string" || !ASSET_ID.test(assetId)) fail("INVALID_ASSET_ID", "assetId must use the permanent GG family/type/sequence convention", { assetId });
  return assetId;
}

export function validateSemver(version, field = "assetVersion") {
  if (typeof version !== "string" || !SEMVER.test(version)) fail("INVALID_VERSION", `${field} must be an independent semantic version`, { version });
  return version;
}

export function validateLayerAModule(module, context = {}) {
  if (!object(module)) fail("INVALID_MODULE", "Layer A module must be an object");
  validateAssetId(module.assetId);
  validateSemver(module.assetVersion);
  if (module.layer !== "LAYER_A_MODULE") fail("INVALID_ASSET_LAYER", "Reusable geometry must be LAYER_A_MODULE");
  if (!ASSET_FAMILIES.includes(module.category)) fail("INVALID_ASSET_FAMILY", "Unsupported factory family", { category: module.category });
  for (const field of ["type", "family", "designSpecification", "dimensionsMeters", "geometryBudget", "textureBudget", "materialBudget", "exportedFileSizeBudget", "lod", "textureAtlases", "orientationRules", "variationRules", "allowedTransformations", "collisionRules", "deterministicGeneration", "modularReuse", "recipeCompatibility", "mobileBudgetProfile", "palette", "approvalState", "provenance"]) required(module[field], `MISSING_${field.replace(/[A-Z]/g, c => `_${c}`).toUpperCase()}`, field);
  if (!APPROVAL_STATES.includes(module.approvalState)) fail("INVALID_APPROVAL_STATE", "Unknown approval state");
  if (!object(module.dimensionsMeters) || !["width", "height", "depth"].every(k => Number.isFinite(module.dimensionsMeters[k]) && module.dimensionsMeters[k] > 0)) fail("INVALID_DIMENSIONS", "Positive width, height and depth are required");
  if (!Array.isArray(module.allowedTransformations) || module.allowedTransformations.some(rule => !TRANSFORM_TYPES.includes(rule.type) || (rule.type.startsWith("BOUNDED_") && (!Number.isFinite(rule.min) || !Number.isFinite(rule.max) || rule.min > rule.max)))) fail("INVALID_TRANSFORM_RULE", "Transform rules must be explicit and bounded where applicable");
  const profile = context.budgetProfiles?.profiles?.[module.mobileBudgetProfile];
  if (!profile) fail("MISSING_BUDGET_PROFILE", "Every module must resolve to a mobile budget profile", { profileId: module.mobileBudgetProfile });
  validateBudget(module, profile);
  validateMaterials(module, context.materials ?? []);
  validateAtlases(module, context.atlases ?? []);
  validateLods(module);
  validatePalette(module, context.paletteFamilies ?? {});
  return { ok: true, assetId: module.assetId, assetVersion: module.assetVersion };
}

function validateMaterials(module, materials) {
  for (const materialId of module.materialBudget.materialIds ?? []) {
    if (!materials.some(material => material.materialId === materialId && material.status === "APPROVED")) fail("MISSING_MATERIAL_REFERENCE", "Referenced material is not registered and approved", { materialId });
  }
}

function validateBudget(module, profile) {
  const triangles = module.geometryBudget.triangleCeiling;
  const vertices = module.geometryBudget.vertexCeiling;
  if (!Number.isFinite(triangles) || triangles > profile.hardTriangleCeiling || !Number.isFinite(vertices) || vertices > profile.vertexCeiling) fail("BUDGET_EXCEEDED", "Geometry budget exceeds mobile profile");
  if (module.materialBudget.materialCeiling > profile.materialCeiling || module.textureBudget.textureCount > profile.textureCount || module.textureBudget.maxDimension > profile.maxTextureDimension || module.exportedFileSizeBudget.ceilingBytes > profile.exportedFileSizeCeilingBytes) fail("BUDGET_EXCEEDED", "Material, texture or file budget exceeds mobile profile");
  if (profile.textureAtlasRequired && module.textureAtlases.length === 0) fail("MISSING_ATLAS_REFERENCE", "Budget profile requires shared texture atlas metadata");
}

function validateAtlases(module, atlases) {
  for (const ref of module.textureAtlases) {
    if (!object(ref) || !ref.textureAtlasId || !ref.textureAtlasVersion || !ref.uvRegion) fail("INVALID_ATLAS_REFERENCE", "Atlas reference requires id, version and UV region");
    if (!atlases.some(atlas => atlas.textureAtlasId === ref.textureAtlasId && atlas.textureAtlasVersion === ref.textureAtlasVersion)) fail("MISSING_ATLAS_REFERENCE", "Referenced shared atlas version is not registered", ref);
  }
}

function validateLods(module) {
  const requiredLods = module.lod.required ?? [];
  const availableLods = module.lod.available ?? [];
  if (!requiredLods.length || requiredLods.some(lod => !availableLods.includes(lod))) fail("MISSING_REQUIRED_LOD", "All required LODs must exist before validation", { requiredLods, availableLods });
  if (module.approvalState === "APPROVED" && module.lod.identityPreservation !== "REQUIRED") fail("LOD_IDENTITY_NOT_PRESERVED", "Approved LODs must preserve module identity");
}

function validatePalette(module, families) {
  const family = families[module.palette.paletteFamily];
  if (!family || !module.palette.allowedPaletteIds?.length || module.palette.allowedPaletteIds.some(id => !family.allowedPaletteIds.includes(id)) || !module.palette.deterministicPaletteRule) fail("PALETTE_RESTRICTION_VIOLATION", "Palette must resolve to approved family IDs with a deterministic rule");
}

export function validateTransform(module, transform = {}) {
  for (const [type, value] of Object.entries(transform)) {
    const rule = module.allowedTransformations.find(item => item.type === type);
    if (!rule) fail("FORBIDDEN_TRANSFORM", `Transform ${type} is not permitted`, { assetId: module.assetId, type });
    if (type.startsWith("BOUNDED_") && (value < rule.min || value > rule.max)) fail("TRANSFORM_OUT_OF_BOUNDS", `Transform ${type} exceeds declared bounds`);
    if (type === "APPROVED_TINT" && !module.palette.allowedPaletteIds.includes(value)) fail("PALETTE_RESTRICTION_VIOLATION", "Tint is outside the approved palette family");
  }
  return { ok: true };
}

// Raster foliage is authored visual evidence: its visible proportions are not a
// modelling convenience.  Workers must derive the card dimensions from the
// source bitmap, then apply only a single (optionally mirrored) uniform scale.
export const FOLIAGE_ASPECT_RATIO_TOLERANCE = 0.01;

export function deriveNativeFoliageCardGeometry({ sourceWidth, sourceHeight, longestDimension = 1 }) {
  if (![sourceWidth, sourceHeight, longestDimension].every(Number.isFinite) || sourceWidth <= 0 || sourceHeight <= 0 || longestDimension <= 0) {
    fail("INVALID_FOLIAGE_SOURCE_DIMENSIONS", "Foliage source dimensions and longestDimension must be positive finite numbers", { sourceWidth, sourceHeight, longestDimension });
  }
  const divisor = Math.max(sourceWidth, sourceHeight);
  return {
    width: longestDimension * sourceWidth / divisor,
    height: longestDimension * sourceHeight / divisor,
    sourceAspectRatio: sourceWidth / sourceHeight
  };
}

export function validateFoliageCardPresentation({ sourceWidth, sourceHeight, cardWidth, cardHeight, scaleX = 1, scaleY = 1, tolerance = FOLIAGE_ASPECT_RATIO_TOLERANCE }) {
  const numbers = { sourceWidth, sourceHeight, cardWidth, cardHeight, scaleX, scaleY, tolerance };
  if (!Object.values(numbers).every(Number.isFinite) || sourceWidth <= 0 || sourceHeight <= 0 || cardWidth <= 0 || cardHeight <= 0 || tolerance < 0 || scaleX === 0 || scaleY === 0) {
    fail("INVALID_FOLIAGE_CARD_PRESENTATION", "Foliage source/card dimensions and scales must be valid", numbers);
  }
  const uniform = Math.abs(Math.abs(scaleX) - Math.abs(scaleY)) <= 1e-9;
  if (!uniform) fail("NONUNIFORM_FOLIAGE_SCALE_REJECTED", "Foliage presentation may only use uniform scale after native source-aspect geometry", { scaleX, scaleY });
  const sourceAspectRatio = sourceWidth / sourceHeight;
  const renderedAspectRatio = (cardWidth * Math.abs(scaleX)) / (cardHeight * Math.abs(scaleY));
  const ratioError = Math.abs(renderedAspectRatio / sourceAspectRatio - 1);
  if (ratioError > tolerance) fail("FOLIAGE_SOURCE_ASPECT_MISMATCH", "Rendered foliage card aspect differs from immutable source art", { sourceAspectRatio, renderedAspectRatio, ratioError, tolerance });
  return { ok: true, uniform, sourceAspectRatio, renderedAspectRatio, ratioError };
}

export class MasterAssetIndex {
  constructor({ index, budgetProfiles, atlases, materials, paletteFamilies }) {
    this.index = clone(index);
    this.context = { budgetProfiles, atlases: atlases ?? index.atlases, materials: materials ?? index.materials, paletteFamilies: paletteFamilies ?? index.paletteFamilies };
    this.validateIndex();
  }

  validateIndex() {
    const identities = new Set();
    for (const module of this.index.modules) {
      validateLayerAModule(module, this.context);
      const key = `${module.assetId}@${module.assetVersion}`;
      if (identities.has(key)) fail("DUPLICATE_ASSET_VERSION", "Asset ID/version pair is already registered", { key });
      identities.add(key);
    }
    return true;
  }

  lookup(query = {}) {
    const entries = this.index.modules.filter(module => Object.entries(query).every(([key, expected]) => {
      if (key === "version") return module.assetVersion === expected;
      if (key === "recipeUse") return module.recipeCompatibility.includes(expected);
      if (key === "material") return module.materialBudget.materialIds.includes(expected);
      if (key === "textureAtlas") return module.textureAtlases.some(ref => ref.textureAtlasId === expected);
      if (key === "tags") return expected.every(tag => module.tags.includes(tag));
      if (key === "dimensions") return Object.entries(expected).every(([axis, value]) => module.dimensionsMeters[axis] === value);
      if (key === "allowedTransformations") return expected.every(type => module.allowedTransformations.some(rule => rule.type === type));
      return module[key] === expected;
    }));
    return clone(entries);
  }

  resolve(assetId, assetVersion) {
    return this.index.modules.find(module => module.assetId === assetId && module.assetVersion === assetVersion) ?? null;
  }

  register(module, event = {}) {
    validateLayerAModule(module, this.context);
    const versions = this.index.modules.filter(item => item.assetId === module.assetId);
    if (versions.some(item => item.assetVersion === module.assetVersion)) fail("DUPLICATE_ASSET_VERSION", "Approved history and registered versions are immutable");
    if (versions.length && versions.some(item => item.type !== module.type || item.category !== module.category)) fail("MODULE_IDENTITY_CHANGED", "A permanent asset ID cannot change semantic meaning");
    if (module.approvalState !== "DRAFT") fail("LIFECYCLE_REGISTRATION_REQUIRED", "New specs and versions must register as DRAFT before build, reviews and approval");
    if (module.provenance.sourceType === "BLENDER_OUTPUT" && !module.provenance.specId) fail("BLENDER_OUTPUT_NOT_REGISTRABLE", "Blender output alone cannot become a registered asset");
    this.index.modules.push(clone(module));
    this.index.history.push({ event: "REGISTER_VERSION", assetId: module.assetId, assetVersion: module.assetVersion, fromState: null, toState: module.approvalState, actor: event.actor ?? "ASSET_FACTORY", reason: event.reason ?? "CONTROLLED_REGISTRATION" });
    return clone(module);
  }

  transition(assetId, assetVersion, toState, event = {}) {
    if (!APPROVAL_STATES.includes(toState)) fail("INVALID_APPROVAL_STATE", "Unknown approval state");
    const current = this.resolve(assetId, assetVersion);
    if (!current) fail("MISSING_MODULE", "Cannot transition an unregistered module");
    const legal = { DRAFT: ["REVIEW"], REVIEW: ["DRAFT", "APPROVED"], APPROVED: ["DEPRECATED", "SUPERSEDED"], DEPRECATED: ["SUPERSEDED"], SUPERSEDED: [] };
    if (!legal[current.approvalState].includes(toState)) fail("INVALID_LIFECYCLE_TRANSITION", "Lifecycle workflow must be followed");
    if (toState === "APPROVED") {
      const requiredEvidence = ["BUILD", "REFERENCE_REVIEW", "BUDGET_VALIDATION", "MODULAR_REUSE_VALIDATION"];
      if (!requiredEvidence.every(step => event.evidence?.[step] === "PASS")) fail("MISSING_APPROVAL_EVIDENCE", "Approval requires build, reference, budget and modular reuse evidence", { requiredEvidence });
    }
    const replacement = clone(current); replacement.approvalState = toState;
    this.index.modules[this.index.modules.indexOf(current)] = replacement;
    this.index.history.push({ event: "STATE_TRANSITION", assetId, assetVersion, fromState: current.approvalState, toState, actor: event.actor ?? "ASSET_FACTORY", reason: event.reason ?? "CONTROLLED_LIFECYCLE" });
    return clone(replacement);
  }
}

export function searchBeforeCreate(index, request) {
  required(request.searchEvidence, "SEARCH_BEFORE_CREATE_REQUIRED", "searchEvidence");
  const candidates = index.lookup({ category: request.category, type: request.type });
  const rejectionReasons = [];
  for (const module of candidates) {
    if (module.family !== request.family) { rejectionReasons.push({ assetId: module.assetId, reason: "STYLE_FAMILY_MISMATCH" }); continue; }
    const dimensionsEqual = ["width", "height", "depth"].every(axis => module.dimensionsMeters[axis] === request.dimensionsMeters[axis]);
    const variantEqual = module.variationRules.variantFamily === request.variantFamily;
    if (dimensionsEqual && variantEqual) return { outcome: "EXACT_REUSE", module: clone(module), rejectionReasons };
    const physicalAxisToTransformAxis = { width: "X", height: "Z", depth: "Y" };
    const adjustable = ["width", "height", "depth"].every(axis => module.dimensionsMeters[axis] === request.dimensionsMeters[axis] || module.allowedTransformations.some(rule => rule.type === `BOUNDED_SCALE_${physicalAxisToTransformAxis[axis]}` && request.dimensionsMeters[axis] / module.dimensionsMeters[axis] >= rule.min && request.dimensionsMeters[axis] / module.dimensionsMeters[axis] <= rule.max));
    if (adjustable && variantEqual) return { outcome: "PARAMETRIC_REUSE", module: clone(module), rejectionReasons };
    if (dimensionsEqual && module.variationRules.allowedVariants?.includes(request.variantFamily)) return { outcome: "VARIANT_REUSE", module: clone(module), rejectionReasons };
    rejectionReasons.push({ assetId: module.assetId, reason: adjustable ? "STYLE_FAMILY_MISMATCH" : "DIMENSION_MISMATCH" });
  }
  return { outcome: "NO_COMPATIBLE_MODULE", module: null, rejectionReasons };
}

export function authorizeNewGeometry(searchResult) {
  if (!searchResult || searchResult.outcome !== "NO_COMPATIBLE_MODULE") fail("NEW_GEOMETRY_NOT_AUTHORIZED", "New Layer A geometry requires a recorded NO_COMPATIBLE_MODULE search result");
  if (!searchResult.rejectionReasons.every(item => REUSE_REJECTION_REASONS.includes(item.reason))) fail("INVALID_REUSE_REJECTION_REASON", "Reuse rejection reasons must be machine-readable");
  return { authorized: true };
}

export function validateGoldenReferenceBindings(bindings, index) {
  if (!Array.isArray(bindings) || !bindings.length) fail("MISSING_COMPONENT_BINDINGS", "Golden Reference components require module bindings");
  for (const binding of bindings) {
    required(binding.componentId, "MISSING_COMPONENT_ID", "componentId");
    if (!REUSE_OUTCOMES.includes(binding.reuseStatus) || binding.reuseStatus === "NO_COMPATIBLE_MODULE") fail("INVALID_REUSE_STATUS", "Binding must record a reusable registered module outcome");
    if (!index.resolve(binding.assetId, binding.assetVersion)) fail("MISSING_MODULE", "Golden Reference binding points to an unregistered module", binding);
  }
  return { ok: true, bindings: clone(bindings) };
}

export function buildGoldenReferenceModularHandoff(bindings, index) {
  const validated = validateGoldenReferenceBindings(bindings, index).bindings;
  return Object.freeze({
    analyzer: clone(validated),
    blenderReconstruction: clone(validated),
    correctionPlanning: clone(validated),
    rasterComparison: clone(validated),
    publishing: clone(validated),
    layerBRecipeGeneration: clone(validated)
  });
}

export function validateLayerBRecipe(recipe, index) {
  if (!object(recipe) || !RECIPE_ID.test(recipe.recipeId ?? "")) fail("INVALID_RECIPE_ID", "Recipe requires a permanent GG-REC ID");
  validateSemver(recipe.recipeVersion, "recipeVersion");
  if (recipe.layer !== "LAYER_B_RECIPE") fail("INVALID_ASSET_LAYER", "Completed assemblies must be LAYER_B_RECIPE");
  required(recipe.recipeFamily, "MISSING_RECIPE_FAMILY", "recipeFamily");
  required(recipe.deterministicSeedRule, "MISSING_DETERMINISM_METADATA", "deterministicSeedRule");
  if (recipe.budgetAggregation && recipe.budgetAggregation.mode !== "SUM_COMPONENT_BUDGETS") fail("INVALID_BUDGET_AGGREGATION", "Layer B budgets must aggregate registered component budgets");
  if (!Array.isArray(recipe.components) || !recipe.components.length) fail("MISSING_RECIPE_COMPONENTS", "Recipe components are required");
  for (const component of recipe.components) {
    if (component.geometry || component.mesh || component.vertices || component.anonymousGeometry) fail("ANONYMOUS_GEOMETRY_REJECTED", "Layer B cannot embed anonymous or unregistered geometry");
    const module = index.resolve(component.assetId, component.assetVersion);
    if (!module) fail("MISSING_MODULE", "Recipe references an unregistered module", component);
    if (module.approvalState === "DEPRECATED" && !component.allowDeprecated) fail("DEPRECATED_MODULE_NOT_ALLOWED", "Deprecated modules require an explicit allowance");
    if (module.approvalState !== "APPROVED" && module.approvalState !== "DEPRECATED") fail("MODULE_NOT_APPROVED", "Recipe modules must be approved");
    if (!module.recipeCompatibility.includes(recipe.recipeFamily)) fail("RECIPE_INCOMPATIBLE", "Module does not declare recipe compatibility");
    validateTransform(module, component.transform ?? {});
  }
  return { ok: true, recipeId: recipe.recipeId, recipeVersion: recipe.recipeVersion };
}

export function assembleLayerBRecipe(recipe, index, { seed, context = {} }) {
  validateLayerBRecipe(recipe, index);
  required(seed, "MISSING_DETERMINISTIC_SEED", "seed");
  const identity = createHash("sha256").update(canonical({ recipeId: recipe.recipeId, recipeVersion: recipe.recipeVersion, seed: String(seed), context })).digest("hex");
  const components = recipe.components.map((component, position) => {
    const module = index.resolve(component.assetId, component.assetVersion);
    const paletteIndex = parseInt(createHash("sha256").update(`${identity}:${position}`).digest("hex").slice(0, 8), 16) % module.palette.allowedPaletteIds.length;
    return { ...clone(component), orientation: component.orientation ?? module.orientationRules.allowed?.[0] ?? "N", selectedPaletteId: module.palette.allowedPaletteIds[paletteIndex] };
  });
  return { layer: "LAYER_C_RUNTIME_ASSEMBLY", runtimeIdentity: identity, sourceRecipe: `${recipe.recipeId}@${recipe.recipeVersion}`, seed: String(seed), context: clone(context), components, budget: aggregateRecipeBudget(recipe, index) };
}

export function aggregateRecipeBudget(recipe, index) {
  validateLayerBRecipe(recipe, index);
  const aggregate = { triangleCeiling: 0, preferredTriangles: 0, vertexCeiling: 0, materialIds: [], textureAtlasRefs: [], moduleCount: recipe.components.length, reusedModuleCount: 0, estimatedFileSizeBytes: 0 };
  for (const component of recipe.components) {
    const module = index.resolve(component.assetId, component.assetVersion);
    aggregate.triangleCeiling += module.geometryBudget.triangleCeiling;
    aggregate.preferredTriangles += module.geometryBudget.preferredTriangles;
    aggregate.vertexCeiling += module.geometryBudget.vertexCeiling;
    aggregate.estimatedFileSizeBytes += module.exportedFileSizeBudget.targetBytes;
    aggregate.materialIds.push(...module.materialBudget.materialIds);
    aggregate.textureAtlasRefs.push(...module.textureAtlases.map(ref => `${ref.textureAtlasId}@${ref.textureAtlasVersion}`));
  }
  aggregate.materialIds = [...new Set(aggregate.materialIds)].sort();
  aggregate.textureAtlasRefs = [...new Set(aggregate.textureAtlasRefs)].sort();
  aggregate.reusedModuleCount = aggregate.moduleCount - new Set(recipe.components.map(component => `${component.assetId}@${component.assetVersion}`)).size;
  return aggregate;
}

export function auditMasterAssetIndex(index, recipes = [], productionGeometry = []) {
  const findings = [];
  const ids = new Set();
  for (const module of index.index.modules) {
    const key = `${module.assetId}@${module.assetVersion}`;
    if (ids.has(key)) findings.push({ code: "DUPLICATE_ASSET_VERSION", key });
    ids.add(key);
    try { validateLayerAModule(module, index.context); } catch (error) { findings.push({ code: error.code, key }); }
  }
  for (const recipe of recipes) { try { validateLayerBRecipe(recipe, index); } catch (error) { findings.push({ code: error.code, recipeId: recipe.recipeId }); } }
  for (const geometry of productionGeometry) if (!index.resolve(geometry.assetId, geometry.assetVersion)) findings.push({ code: "UNREGISTERED_PRODUCTION_GEOMETRY", geometryId: geometry.geometryId ?? null });
  const referenced = new Set(recipes.flatMap(recipe => recipe.components?.map(component => `${component.assetId}@${component.assetVersion}`) ?? []));
  for (const module of index.index.modules) if (!referenced.has(`${module.assetId}@${module.assetVersion}`)) findings.push({ code: "ORPHANED_MODULE", assetId: module.assetId, assetVersion: module.assetVersion, severity: "INFO" });
  return { schemaVersion: "1.0.0", generatedDeterministically: true, status: findings.some(item => item.severity !== "INFO") ? "FAIL" : "PASS", findingCount: findings.length, findings };
}
