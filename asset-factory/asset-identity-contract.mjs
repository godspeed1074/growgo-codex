import fs from "node:fs";
import { createHash } from "node:crypto";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Reflect.ownKeys(value)) {
    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === "object") {
      deepFreeze(nestedValue);
    }
  }

  return Object.freeze(value);
}

export const assetIdentityContractPhase001SchemaId =
  "ASSET_IDENTITY_CONTRACT_PHASE_001";
export const assetIdentityContractPhase0011SchemaId =
  "ASSET_IDENTITY_CONTRACT_PHASE_001_1";

export const assetIdentityPolicyValues = deepFreeze([
  "ASSET_ROOT_AND_COMPONENTS",
  "ASSET_ROOT_AND_COMPONENTS_WITH_SHARED_DEPENDENCIES"
]);

export const assetIdentitySupportedLods = deepFreeze([
  "LOD_CLOSE",
  "LOD_GAMEPLAY",
  "LOD_MAP"
]);

const categoryPattern = /^[A-Z][A-Z0-9_]*$/;
const versionPattern =
  /^(?:v[0-9]{3,}|0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*)){0,2}$/;
const permanentIdPattern = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_[0-9]{3,}$/;
const tokenPattern = /^[A-Z0-9]+(?:_[A-Z0-9]+)*$/;
const metadataIdentityKeys = new Set([
  "assetId",
  "recipeId",
  "variantId",
  "paletteId",
  "lodProfile",
  "identityPolicy",
  "identityAnchor",
  "anchorRequired",
  "anchorValidation",
  "exportedIdentitySource",
  "dependencies",
  "contract",
  "extras",
  "extensions"
]);
const glbNamedSections = ["nodes", "meshes", "materials", "scenes"];

export function buildAssetIdentityContract(rawInput) {
  const input = asPlainObject(rawInput, "asset identity contract");
  const assetId = normalizePermanentId(input.assetId, "assetId");
  const category = normalizeCategory(input.category, "category");
  const recipeId = normalizeIdentityToken(input.recipeId, "recipeId");
  const version = normalizeVersion(input.version, "version");
  const variantId = normalizeOptionalIdentityToken(
    input.variantId,
    "variantId",
    "DEFAULT"
  );
  const paletteId = normalizeOptionalIdentityToken(
    input.paletteId,
    "paletteId",
    "PALETTE_UNSPECIFIED_001"
  );
  const lodProfile = normalizeOptionalIdentityToken(
    input.lodProfile,
    "lodProfile",
    "STANDARD_001"
  );
  const source = normalizeSource(input.source ?? {});
  const dependencies = normalizeDependencies(input.dependencies ?? []);
  const identityPolicy = normalizeIdentityPolicy(
    input.identityPolicy ?? "ASSET_ROOT_AND_COMPONENTS"
  );
  const identityAnchor = normalizeIdentityAnchor(
    input.identityAnchor,
    assetId
  );
  const anchorRequired = normalizeBoolean(
    input.anchorRequired ?? false,
    "anchorRequired"
  );
  const anchorValidation = normalizeOptionalIdentityToken(
    input.anchorValidation,
    "anchorValidation",
    anchorRequired ? "REQUIRE_EXPORTED_ANCHOR" : "OPTIONAL"
  );
  const exportedIdentitySource = normalizeOptionalIdentityToken(
    input.exportedIdentitySource,
    "exportedIdentitySource",
    "STRUCTURED_NAMES"
  );
  const requiredIdentityToken =
    input.requiredIdentityToken == null
      ? assetId
      : normalizeNonEmptyString(input.requiredIdentityToken, "requiredIdentityToken");
  const lodExpectations = normalizeLodExpectations(input.lodExpectations);

  return deepFreeze({
    schemaId: assetIdentityContractPhase0011SchemaId,
    compatibility: deepFreeze({
      previousSchemaId: assetIdentityContractPhase001SchemaId
    }),
    assetId,
    category,
    recipeId,
    version,
    variantId,
    paletteId,
    lodProfile,
    source,
    dependencies,
    identityPolicy,
    identityAnchor,
    anchorRequired,
    anchorValidation,
    exportedIdentitySource,
    requiredIdentityToken,
    namingRules: deepFreeze({
      rootCollection: assetId,
      requiredPrefix: `${assetId}_`,
      canonicalPatterns: deepFreeze([
        "{ASSET_ID}_ROOT",
        "{ASSET_ID}_{COMPONENT_ROLE}",
        "{ASSET_ID}_{COMPONENT_ROLE}_{VARIANT}",
        "{ASSET_ID}_VARIANT_{VARIANT}",
        "{ASSET_ID}_MATERIAL_{ROLE}",
        "{ASSET_ID}_{LOD_LABEL}",
        "{ASSET_ID}_{LOD_LABEL}_{ROLE}",
        "{ASSET_ID}_{LOD_LABEL}_IDENTITY_ANCHOR"
      ]),
      assetOwnedExamples: deepFreeze([
        `${assetId}_ROOT`,
        `${assetId}_TRUNK`,
        `${assetId}_CANOPY`,
        `${assetId}_MATERIAL_LEAF`,
        `${assetId}_LOD_CLOSE_ROOT`,
        `${assetId}_VARIANT_${variantId}`,
        `${assetId}_LOD_CLOSE_IDENTITY_ANCHOR`
      ]),
      dependencyExamples: deepFreeze(
        dependencies.slice(0, 3).map(
          (dependency) => `${dependency.dependencyId}_COMPONENT`
        )
      )
    }),
    lodExpectations
  });
}

export function createIdentityName(contractInput, componentRole, variant = null) {
  const contract = buildAssetIdentityContract(contractInput);
  const normalizedRole = normalizeIdentityToken(componentRole, "componentRole");
  const normalizedVariant =
    variant == null ? null : normalizeIdentityToken(variant, "variant");
  return normalizedVariant == null
    ? `${contract.assetId}_${normalizedRole}`
    : `${contract.assetId}_${normalizedRole}_${normalizedVariant}`;
}

export function createVariantIdentityName(contractInput, variantId = null) {
  const contract = buildAssetIdentityContract(contractInput);
  const variant =
    variantId == null
      ? contract.variantId
      : normalizeIdentityToken(variantId, "variantId");
  return `${contract.assetId}_VARIANT_${variant}`;
}

export function createLodIdentityName(contractInput, lodLabel, suffix = null) {
  const contract = buildAssetIdentityContract(contractInput);
  const normalizedLod = normalizeLodLabel(lodLabel, "lodLabel");
  const suffixToken =
    suffix == null ? null : normalizeIdentityToken(suffix, "lodSuffix");
  return suffixToken == null
    ? `${contract.assetId}_${normalizedLod}`
    : `${contract.assetId}_${normalizedLod}_${suffixToken}`;
}

export function createIdentityAnchorName(contractInput, lodLabel = null) {
  const contract = buildAssetIdentityContract(contractInput);
  if (lodLabel == null) {
    return `${contract.assetId}_IDENTITY_ANCHOR`;
  }
  const normalizedLod = normalizeLodLabel(lodLabel, "lodLabel");
  return `${contract.assetId}_${normalizedLod}_IDENTITY_ANCHOR`;
}

export function validateIdentityName(contractInput, name, options = {}) {
  const contract = buildAssetIdentityContract(contractInput);
  const normalizedName = normalizeNonEmptyString(name, options.label ?? "name");
  const allowExactAssetId = normalizeBoolean(
    options.allowExactAssetId ?? false,
    "allowExactAssetId"
  );
  const allowExactDependencies = normalizeBoolean(
    options.allowExactDependencies ?? true,
    "allowExactDependencies"
  );

  const parsed = classifyIdentityName(contract, normalizedName, {
    allowExactAssetId,
    allowExactDependencies
  });

  return deepFreeze({
    ok: parsed.ok,
    name: normalizedName,
    requiredIdentityToken: contract.requiredIdentityToken,
    ownerType: parsed.ownerType,
    ownerId: parsed.ownerId,
    identityKind: parsed.identityKind,
    viaMetadata: false,
    message: parsed.ok
      ? null
      : `Name '${normalizedName}' did not match the structured asset identity contract for '${contract.assetId}'.`
  });
}

export function validateBlenderObjectNames(contractInput, names = []) {
  return validateIdentityNameSet(contractInput, names, {
    label: "objectNames",
    type: "object"
  });
}

export function validateBlenderMeshNames(contractInput, names = []) {
  return validateIdentityNameSet(contractInput, names, {
    label: "meshNames",
    type: "mesh"
  });
}

export function validateBlenderMaterialNames(contractInput, names = []) {
  return validateIdentityNameSet(contractInput, names, {
    label: "materialNames",
    type: "material"
  });
}

export function validateBlenderCollectionNames(contractInput, names = []) {
  return validateIdentityNameSet(contractInput, names, {
    label: "collectionNames",
    type: "collection",
    allowExactAssetId: true
  });
}

export function validateDependencyIdentityNames(contractInput, names = []) {
  const contract = buildAssetIdentityContract(contractInput);
  const normalizedNames = normalizeNameArray(names, "dependencyIdentityNames");
  const invalidNames = normalizedNames.filter((name) => {
    const result = classifyIdentityName(contract, name, {
      allowExactAssetId: false,
      allowExactDependencies: true
    });
    return !result.ok || result.ownerType !== "dependency";
  });

  return deepFreeze({
    ok: invalidNames.length === 0,
    names: deepFreeze(normalizedNames),
    invalidNames: deepFreeze(invalidNames)
  });
}

export function validatePreExportIdentity(contractInput, rawInput = {}) {
  const contract = buildAssetIdentityContract(contractInput);
  const input = asPlainObject(rawInput, "pre-export identity input");
  const lodRoots = normalizeNameArray(input.lodRoots ?? [], "lodRoots");
  const identityAnchors = normalizeNameArray(
    input.identityAnchors ?? [],
    "identityAnchors"
  );
  const objectResult = validateBlenderObjectNames(contract, input.objectNames ?? []);
  const meshResult = validateBlenderMeshNames(contract, input.meshNames ?? []);
  const materialResult = validateBlenderMaterialNames(
    contract,
    input.materialNames ?? []
  );
  const collectionResult = validateBlenderCollectionNames(
    contract,
    input.collectionNames ?? []
  );

  const missingIdentityItems = [];
  const invalidDependencyItems = [];
  const missingLodIdentity = [];
  const missingAnchors = [];

  const lodChecks = lodRoots.map((lodRoot) => {
    const result = validateIdentityName(contract, lodRoot, { label: "lodRoot" });
    const lodMatch = assetIdentitySupportedLods.find((lodLabel) =>
      lodRoot.includes(lodLabel)
    );
    const lodValid = result.ok && result.ownerType === "asset" && lodMatch != null;
    if (!lodValid) {
      missingIdentityItems.push(`lodRoot:${lodRoot}`);
      if (lodMatch == null) {
        missingLodIdentity.push(lodRoot);
      }
    }
    return {
      name: lodRoot,
      ok: lodValid,
      lodLabel: lodMatch ?? null
    };
  });

  for (const [type, result] of [
    ["object", objectResult],
    ["mesh", meshResult],
    ["material", materialResult],
    ["collection", collectionResult]
  ]) {
    for (const item of result.unknownIdentityItems) {
      missingIdentityItems.push(`${type}:${item}`);
    }
    for (const item of result.invalidDependencyItems) {
      invalidDependencyItems.push(`${type}:${item}`);
    }
  }

  const ownedCoverageFailures = [];
  for (const [type, result] of [
    ["object", objectResult],
    ["mesh", meshResult],
    ["material", materialResult],
    ["collection", collectionResult]
  ]) {
    if (result.assetOwnedItems.length === 0) {
      ownedCoverageFailures.push(type);
      missingIdentityItems.push(`${type}:ASSET_OWNED_IDENTITY_REQUIRED`);
    }
  }

  const requiredLods = contract.lodExpectations.requiredLabels;
  const presentLods = new Set(
    lodChecks.filter((entry) => entry.ok).map((entry) => entry.lodLabel)
  );
  for (const requiredLod of requiredLods) {
    if (!presentLods.has(requiredLod)) {
      missingIdentityItems.push(`lod:${requiredLod}`);
      missingLodIdentity.push(requiredLod);
    }
    if (contract.anchorRequired) {
      const expectedAnchor = createIdentityAnchorName(contract, requiredLod);
      if (!identityAnchors.includes(expectedAnchor)) {
        missingIdentityItems.push(`anchor:${expectedAnchor}`);
        missingAnchors.push(expectedAnchor);
      }
    }
  }

  return deepFreeze({
    ok:
      missingIdentityItems.length === 0 &&
      invalidDependencyItems.length === 0 &&
      objectResult.ok &&
      meshResult.ok &&
      materialResult.ok &&
      collectionResult.ok,
    contract,
    checks: deepFreeze({
      lodRoots: deepFreeze(lodChecks),
      objectResult,
      meshResult,
      materialResult,
      collectionResult
    }),
    missingIdentityItems: deepFreeze(missingIdentityItems),
    invalidDependencyItems: deepFreeze(invalidDependencyItems),
    missingLodIdentity: deepFreeze(missingLodIdentity),
    ownedCoverageFailures: deepFreeze(ownedCoverageFailures),
    missingAnchors: deepFreeze(missingAnchors)
  });
}

export function inspectExportedGlbIdentityByPath(contractInput, filename) {
  const contract = buildAssetIdentityContract(contractInput);
  const data = fs.readFileSync(filename);
  return inspectExportedGlbIdentityBuffer(contract, data);
}

export function inspectExportedGlbIdentityBuffer(contractInput, data) {
  const contract = buildAssetIdentityContract(contractInput);
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  if (buffer.length <= 20) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      namedIdentityHits: deepFreeze([]),
      metadataIdentityHits: deepFreeze([]),
      anchorIdentityHits: deepFreeze([]),
      dependencyIdentityHits: deepFreeze([]),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      anchorIdentityPreserved: false,
      exportedIdentitySource: "missing",
      detail: "GLB was too small to trust."
    });
  }

  const magic = buffer.subarray(0, 4).toString("utf8");
  const version = buffer.readUInt32LE(4);
  const declaredLength = buffer.readUInt32LE(8);
  if (magic !== "glTF" || version !== 2 || declaredLength !== buffer.length) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      namedIdentityHits: deepFreeze([]),
      metadataIdentityHits: deepFreeze([]),
      anchorIdentityHits: deepFreeze([]),
      dependencyIdentityHits: deepFreeze([]),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      anchorIdentityPreserved: false,
      exportedIdentitySource: "missing",
      detail: "GLB header, version, or declared length was invalid."
    });
  }

  let offset = 12;
  let gltfJson = null;
  while (offset + 8 <= buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.subarray(offset + 4, offset + 8).toString("utf8");
    offset += 8;
    const chunk = buffer.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (chunkType === "JSON") {
      gltfJson = JSON.parse(chunk.toString("utf8").replace(/\0+$/u, "").trimEnd());
    }
  }

  if (!gltfJson) {
    return deepFreeze({
      valid: false,
      sha256: createHash("sha256").update(buffer).digest("hex"),
      namedIdentityHits: deepFreeze([]),
      metadataIdentityHits: deepFreeze([]),
      anchorIdentityHits: deepFreeze([]),
      dependencyIdentityHits: deepFreeze([]),
      meshCount: 0,
      materialCount: 0,
      triangleCount: 0,
      primitiveCount: 0,
      hasExternalDependencies: true,
      assetIdentityPreserved: false,
      anchorIdentityPreserved: false,
      exportedIdentitySource: "missing",
      detail: "GLB JSON chunk was missing."
    });
  }

  const meshes = Array.isArray(gltfJson.meshes) ? gltfJson.meshes : [];
  const materials = Array.isArray(gltfJson.materials) ? gltfJson.materials : [];
  const images = Array.isArray(gltfJson.images) ? gltfJson.images : [];
  const buffers = Array.isArray(gltfJson.buffers) ? gltfJson.buffers : [];
  const accessors = Array.isArray(gltfJson.accessors) ? gltfJson.accessors : [];

  const namedIdentityHits = [];
  const structuredNameIdentityHits = [];
  const legacyNameIdentityHits = [];
  const anchorIdentityHits = [];
  const dependencyIdentityHits = [];
  for (const key of glbNamedSections) {
    const values = Array.isArray(gltfJson[key]) ? gltfJson[key] : [];
    for (const value of values) {
      const name = value?.name;
      if (typeof name !== "string") {
        continue;
      }
      if (name.includes(contract.requiredIdentityToken)) {
        namedIdentityHits.push(name);
        const classified = classifyIdentityName(contract, name, {
          allowExactAssetId: true,
          allowExactDependencies: true
        });
        if (classified.ok && classified.ownerType === "asset") {
          structuredNameIdentityHits.push(name);
        } else {
          legacyNameIdentityHits.push(name);
        }
      }
      if (
        name === createIdentityAnchorName(contract) ||
        assetIdentitySupportedLods.some(
          (lodLabel) => name === createIdentityAnchorName(contract, lodLabel)
        )
      ) {
        anchorIdentityHits.push(name);
      }
      for (const dependency of contract.dependencies) {
        if (name.includes(dependency.dependencyId)) {
          dependencyIdentityHits.push(name);
        }
      }
    }
  }

  const metadataIdentityHits = collectMetadataIdentityHits(contract, gltfJson);
  if (metadataIdentityHits.some((hit) => hit.includes("IDENTITY_ANCHOR"))) {
    for (const hit of metadataIdentityHits) {
      if (hit.includes("IDENTITY_ANCHOR")) {
        anchorIdentityHits.push(hit);
      }
    }
  }

  let primitiveCount = 0;
  let triangleCount = 0;
  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh.primitives) ? mesh.primitives : [];
    for (const primitive of primitives) {
      primitiveCount += 1;
      const mode = primitive?.mode ?? 4;
      if (mode !== 4) {
        continue;
      }
      const accessorIndex = primitive?.indices;
      if (Number.isInteger(accessorIndex) && accessors[accessorIndex]) {
        triangleCount += Math.floor((accessors[accessorIndex].count ?? 0) / 3);
      }
    }
  }

  const hasExternalDependencies = images.some(
    (image) => image && typeof image === "object" && typeof image.uri === "string"
  ) || buffers.some(
    (entry) => entry && typeof entry === "object" && typeof entry.uri === "string"
  );

  return deepFreeze({
    valid: true,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    namedIdentityHits: deepFreeze(namedIdentityHits.slice(0, 24)),
    metadataIdentityHits: deepFreeze(metadataIdentityHits.slice(0, 24)),
    anchorIdentityHits: deepFreeze(anchorIdentityHits.slice(0, 24)),
    dependencyIdentityHits: deepFreeze(dependencyIdentityHits.slice(0, 24)),
    meshCount: meshes.length,
    materialCount: materials.length,
    triangleCount,
    primitiveCount,
    hasExternalDependencies,
    assetIdentityPreserved:
      namedIdentityHits.length > 0 ||
      metadataIdentityHits.length > 0 ||
      anchorIdentityHits.length > 0,
    anchorIdentityPreserved: anchorIdentityHits.length > 0,
    exportedIdentitySource: determineExportedIdentitySource({
      metadataIdentityHits,
      anchorIdentityHits,
      structuredNameIdentityHits,
      legacyNameIdentityHits
    }),
    detail: "GLB parsed successfully."
  });
}

function validateIdentityNameSet(contractInput, names, options = {}) {
  const contract = buildAssetIdentityContract(contractInput);
  const normalizedNames = normalizeNameArray(names, options.label ?? "names");
  const allowExactAssetId = normalizeBoolean(
    options.allowExactAssetId ?? false,
    "allowExactAssetId"
  );

  const assetOwnedItems = [];
  const dependencyOwnedItems = [];
  const invalidDependencyItems = [];
  const unknownIdentityItems = [];

  for (const name of normalizedNames) {
    const result = classifyIdentityName(contract, name, {
      allowExactAssetId,
      allowExactDependencies: true
    });

    if (!result.ok) {
      unknownIdentityItems.push(name);
      continue;
    }

    if (result.ownerType === "asset") {
      assetOwnedItems.push(name);
      continue;
    }

    if (result.ownerType === "dependency") {
      const dependency = contract.dependencies.find(
        (entry) => entry.dependencyId === result.ownerId
      );
      if (!dependency) {
        invalidDependencyItems.push(name);
      } else {
        dependencyOwnedItems.push(name);
      }
      continue;
    }

    unknownIdentityItems.push(name);
  }

  return deepFreeze({
    ok: unknownIdentityItems.length === 0 && invalidDependencyItems.length === 0,
    names: deepFreeze(normalizedNames),
    assetOwnedItems: deepFreeze(assetOwnedItems),
    dependencyOwnedItems: deepFreeze(dependencyOwnedItems),
    invalidDependencyItems: deepFreeze(invalidDependencyItems),
    unknownIdentityItems: deepFreeze(unknownIdentityItems)
  });
}

function classifyIdentityName(contract, rawName, options = {}) {
  const name = normalizeNonEmptyString(rawName, "name");
  const allowExactAssetId = options.allowExactAssetId === true;
  const allowExactDependencies = options.allowExactDependencies !== false;

  if (name === contract.assetId) {
    return {
      ok: allowExactAssetId,
      ownerType: allowExactAssetId ? "asset" : null,
      ownerId: allowExactAssetId ? contract.assetId : null,
      identityKind: allowExactAssetId ? "asset_exact" : null
    };
  }

  const assetClassification = classifyIdentityNameForOwner(
    contract.assetId,
    name,
    contract
  );
  if (assetClassification.ok) {
    return {
      ...assetClassification,
      ownerType: "asset",
      ownerId: contract.assetId
    };
  }

  for (const dependency of contract.dependencies) {
    if (allowExactDependencies && name === dependency.dependencyId) {
      return {
        ok: true,
        ownerType: "dependency",
        ownerId: dependency.dependencyId,
        identityKind: "dependency_exact"
      };
    }

    const dependencyClassification = classifyIdentityNameForOwner(
      dependency.dependencyId,
      name,
      contract,
      dependency
    );
    if (dependencyClassification.ok) {
      return {
        ...dependencyClassification,
        ownerType: "dependency",
        ownerId: dependency.dependencyId
      };
    }
  }

  return {
    ok: false,
    ownerType: null,
    ownerId: null,
    identityKind: null
  };
}

function classifyIdentityNameForOwner(ownerId, name, contract, dependency = null) {
  const prefix = `${ownerId}_`;
  if (!name.startsWith(prefix)) {
    return { ok: false };
  }

  const remainder = name.slice(prefix.length);
  if (!tokenPattern.test(remainder)) {
    return { ok: false };
  }

  if (remainder === "ROOT") {
    return { ok: true, identityKind: "root" };
  }

  if (remainder.startsWith("MATERIAL_")) {
    const role = remainder.slice("MATERIAL_".length);
    return role.length > 0 && tokenPattern.test(role)
      ? { ok: true, identityKind: "material" }
      : { ok: false };
  }

  if (remainder.startsWith("VARIANT_")) {
    const variantId = remainder.slice("VARIANT_".length);
    if (dependency) {
      return variantId.length > 0 && tokenPattern.test(variantId)
        ? { ok: true, identityKind: "dependency_variant" }
        : { ok: false };
    }
    return variantId === contract.variantId
      ? { ok: true, identityKind: "variant" }
      : { ok: false };
  }

  for (const lodLabel of contract.lodExpectations.requiredLabels) {
    if (remainder === lodLabel) {
      return { ok: true, identityKind: "lod" };
    }

    if (remainder.startsWith(`${lodLabel}_`)) {
      const suffix = remainder.slice(lodLabel.length + 1);
      return suffix.length > 0 && tokenPattern.test(suffix)
        ? { ok: true, identityKind: "lod_component" }
        : { ok: false };
    }
  }

  if (!dependency && contract.variantId !== "DEFAULT") {
    const expectedVariantSuffix = `_${contract.variantId}`;
    if (remainder.endsWith(expectedVariantSuffix)) {
      const role = remainder.slice(0, -expectedVariantSuffix.length);
      return role.length > 0 && tokenPattern.test(role)
        ? { ok: true, identityKind: "component_variant" }
        : { ok: false };
    }

    if (remainder.includes("_VARIANT_")) {
      return { ok: false };
    }
  }

  return { ok: true, identityKind: "component" };
}

function determineExportedIdentitySource({
  metadataIdentityHits,
  anchorIdentityHits,
  structuredNameIdentityHits,
  legacyNameIdentityHits
}) {
  if (metadataIdentityHits.length > 0) {
    return "metadata";
  }
  if (anchorIdentityHits.length > 0) {
    return "identity_anchor";
  }
  if (structuredNameIdentityHits.length > 0) {
    return "structured_names";
  }
  if (legacyNameIdentityHits.length > 0) {
    return "legacy_name_matching";
  }
  return "missing";
}

function collectMetadataIdentityHits(contract, gltfJson) {
  const hits = [];
  const dependencyIds = contract.dependencies.map((dependency) => dependency.dependencyId);

  function scan(value, path) {
    if (typeof value === "string") {
      if (
        value.includes(contract.assetId) ||
        value.includes(contract.recipeId) ||
        value.includes(contract.variantId) ||
        value.includes(contract.paletteId) ||
        value.includes(contract.lodProfile) ||
        dependencyIds.some((dependencyId) => value.includes(dependencyId))
      ) {
        hits.push(`${path}:${value}`);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => scan(entry, `${path}[${index}]`));
      return;
    }

    if (!value || typeof value !== "object") {
      return;
    }

    for (const [key, nested] of Object.entries(value)) {
      if (
        path === "$" ||
        metadataIdentityKeys.has(key) ||
        key.endsWith("Id") ||
        key === "name"
      ) {
        scan(nested, `${path}.${key}`);
      }
    }
  }

  scan(gltfJson.asset ?? {}, "$.asset");
  for (const section of glbNamedSections) {
    const values = Array.isArray(gltfJson[section]) ? gltfJson[section] : [];
    values.forEach((entry, index) => scan(entry, `$.${section}[${index}]`));
  }

  return hits;
}

function normalizeIdentityAnchor(rawValue, assetId) {
  const value = rawValue == null ? {} : asPlainObject(rawValue, "identityAnchor");
  const componentRole = normalizeOptionalIdentityToken(
    value.componentRole,
    "identityAnchor.componentRole",
    "IDENTITY_ANCHOR"
  );
  const rootName = normalizeOptionalIdentityToken(
    value.rootName,
    "identityAnchor.rootName",
    `${assetId}_${componentRole}`
  );
  return deepFreeze({
    componentRole,
    rootName,
    required: normalizeBoolean(value.required ?? false, "identityAnchor.required")
  });
}

function normalizeLodExpectations(rawValue) {
  if (rawValue == null) {
    return deepFreeze({
      profile: "STANDARD",
      requiredLabels: deepFreeze(assetIdentitySupportedLods.slice())
    });
  }

  const value = asPlainObject(rawValue, "lodExpectations");
  const labels = Array.isArray(value.requiredLabels)
    ? value.requiredLabels.map((entry, index) =>
        normalizeLodLabel(entry, `lodExpectations.requiredLabels[${index}]`)
      )
    : assetIdentitySupportedLods.slice();

  return deepFreeze({
    profile: normalizeOptionalIdentityToken(
      value.profile,
      "lodExpectations.profile",
      "STANDARD"
    ),
    requiredLabels: deepFreeze(labels)
  });
}

function normalizeDependencies(value) {
  if (!Array.isArray(value)) {
    throw new Error("dependencies must be an array.");
  }

  return deepFreeze(
    value.map((entry, index) => {
      if (typeof entry === "string") {
        return deepFreeze({
          dependencyId: normalizePermanentId(entry, `dependencies[${index}]`),
          category: null,
          identityPolicy: "DEPENDENCY_DECLARED_ONLY"
        });
      }

      const dependency = asPlainObject(entry, `dependencies[${index}]`);
      const dependencyId = normalizePermanentId(
        dependency.dependencyId ?? dependency.assetId,
        `dependencies[${index}].dependencyId`
      );

      return deepFreeze({
        dependencyId,
        category:
          dependency.category == null
            ? null
            : normalizeCategory(
                dependency.category,
                `dependencies[${index}].category`
              ),
        identityPolicy: normalizeOptionalIdentityToken(
          dependency.identityPolicy,
          `dependencies[${index}].identityPolicy`,
          "DEPENDENCY_DECLARED_ONLY"
        )
      });
    })
  );
}

function normalizeSource(rawValue) {
  const value = asPlainObject(rawValue, "source");
  return deepFreeze({
    generator: normalizeOptionalDescriptorToken(
      value.generator,
      "source.generator",
      "ASSET_FACTORY"
    ),
    authoringTool: normalizeOptionalDescriptorToken(
      value.authoringTool,
      "source.authoringTool",
      "BLENDER"
    ),
    creator:
      value.creator == null
        ? null
        : normalizeNonEmptyString(value.creator, "source.creator")
  });
}

function normalizeIdentityPolicy(value) {
  const normalized = normalizeIdentityToken(value, "identityPolicy");
  if (!assetIdentityPolicyValues.includes(normalized)) {
    throw new Error(
      `identityPolicy must be one of: ${assetIdentityPolicyValues.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeNameArray(value, fieldName) {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }
  return value.map((entry, index) =>
    normalizeNonEmptyString(entry, `${fieldName}[${index}]`)
  );
}

function normalizeIdentityToken(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toUpperCase();
  if (!tokenPattern.test(normalized)) {
    throw new Error(`${fieldName} must be uppercase underscore token text.`);
  }
  return normalized;
}

function normalizeOptionalIdentityToken(value, fieldName, fallback) {
  if (value == null) {
    return fallback;
  }
  return normalizeIdentityToken(value, fieldName);
}

function normalizeOptionalDescriptorToken(value, fieldName, fallback) {
  if (value == null) {
    return fallback;
  }
  const normalized = normalizeNonEmptyString(value, fieldName)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!tokenPattern.test(normalized)) {
    throw new Error(`${fieldName} must resolve to uppercase underscore token text.`);
  }
  return normalized;
}

function normalizePermanentId(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toUpperCase();
  if (!permanentIdPattern.test(normalized)) {
    throw new Error(`${fieldName} must be a permanent GrowGo asset identifier.`);
  }
  return normalized;
}

function normalizeVersion(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName);
  if (!versionPattern.test(normalized)) {
    throw new Error(
      `${fieldName} must be a semantic version-like string or a GrowGo version token like v001.`
    );
  }
  return normalized;
}

function normalizeCategory(value, fieldName) {
  const normalized = normalizeNonEmptyString(value, fieldName).toUpperCase();
  if (!categoryPattern.test(normalized)) {
    throw new Error(`${fieldName} must be uppercase category text.`);
  }
  return normalized;
}

function normalizeLodLabel(value, fieldName) {
  const normalized = normalizeIdentityToken(value, fieldName);
  if (!assetIdentitySupportedLods.includes(normalized)) {
    throw new Error(
      `${fieldName} must be one of: ${assetIdentitySupportedLods.join(", ")}.`
    );
  }
  return normalized;
}

function normalizeNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }
  return value.trim();
}

function normalizeBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldName} must be boolean.`);
  }
  return value;
}

function asPlainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a plain object.`);
  }
  return value;
}
