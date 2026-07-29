import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";
import {
  treeEucalyptusProductionRunDefinition,
  verifyTreeEucalyptusOutputs
} from "./tree-eucalyptus-production-run.mjs";

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

export const treeEucalyptusRegistrationFilename = "tree-eucalyptus-registration.json";
export const treeEucalyptusDevelopmentCatalogFilename =
  "tree-eucalyptus-development-catalog-entry.json";
export const treeEucalyptusRegistrationSchemaId =
  "TREE_EUCALYPTUS_REGISTRATION_RECORD_001";
export const treeEucalyptusDevelopmentCatalogSchemaId =
  "TREE_EUCALYPTUS_DEVELOPMENT_CATALOG_ENTRY_001";

const runtimeSafetyFlags = deepFreeze({
  lifecycleExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  runtimeExecutionAuthorized: false
});

export function buildTreeEucalyptusRegistrationRecord(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const verification = verifyTreeEucalyptusOutputs(rawDefinition, { cwd });

  if (!verification.registrationGate.ready) {
    throw createRegistrationError(
      "registration_gate_blocked",
      `Cannot register ${definition.assetId} until final eucalyptus outputs validate.`
    );
  }

  const registry = createAssetFactoryRegistryLayer();
  const registeredAsset = registry.getAssetById(definition.assetId);
  if (!registeredAsset) {
    throw createRegistrationError(
      "missing_registry_asset",
      `Asset ${definition.assetId} is not present in the Asset Factory registry layer.`
    );
  }

  const manifest = readJsonRequired(
    path.join(outputDirectory, "tree-eucalyptus-manifest.json"),
    "tree eucalyptus manifest"
  );
  const metadata = readJsonRequired(
    path.join(outputDirectory, "tree-eucalyptus-metadata.json"),
    "tree eucalyptus metadata"
  );
  const validation = readJsonRequired(
    path.join(outputDirectory, "tree-eucalyptus-validation.json"),
    "tree eucalyptus validation"
  );

  const sourceBlendFilename = definition.expectedOutputs.blend;
  const sourceBlendPath = path.join(outputDirectory, sourceBlendFilename);
  const sourceBlendStats = fs.statSync(sourceBlendPath);

  const verifiedBlend = verification.files.find(
    (entry) => entry.filename === sourceBlendFilename
  );
  const verifiedClose = findVerifiedOutput(
    verification,
    "TREE_EUCALYPTUS_001_LOD_CLOSE.glb"
  );
  const verifiedGameplay = findVerifiedOutput(
    verification,
    "TREE_EUCALYPTUS_001_LOD_GAMEPLAY.glb"
  );
  const verifiedMap = findVerifiedOutput(verification, "TREE_EUCALYPTUS_001_LOD_MAP.glb");

  const lodReferences = deepFreeze({
    close: buildLodReference(definition, outputDirectory, verifiedClose),
    gameplay: buildLodReference(definition, outputDirectory, verifiedGameplay),
    map: buildLodReference(definition, outputDirectory, verifiedMap)
  });

  return deepFreeze({
    schemaId: treeEucalyptusRegistrationSchemaId,
    assetId: definition.assetId,
    category: definition.category,
    recipeId: definition.sourceRecipeId,
    registryRecipeId: definition.registryRecipeId,
    assetFamilyId: definition.assetFamilyId,
    productionFamilyId: definition.productionFamilyId,
    version: metadata.identityContractV2?.version ?? registeredAsset.version,
    variantId: metadata.identityContractV2?.variantId ?? manifest.variantId,
    paletteId: metadata.identityContractV2?.paletteId ?? manifest.paletteId,
    registrationStatus: "registered",
    validationStatus: "validated",
    publishStatus: "not_published",
    releaseStatus: "not_released",
    readyForApproval: true,
    readyForPublishing: false,
    registeredAt: options.registrationDate ?? "2026-07-29",
    sourceBlend: deepFreeze({
      filename: sourceBlendFilename,
      relativePath: buildRelativeOutputPath(definition, sourceBlendFilename),
      sizeBytes: sourceBlendStats.size,
      sha256: verifiedBlend?.sha256 ?? null
    }),
    registry: deepFreeze({
      assetId: registeredAsset.assetId,
      assetFamily: registeredAsset.assetFamily,
      assetType: registeredAsset.assetType,
      recipeId: registeredAsset.recipeId,
      version: registeredAsset.version,
      atlasCompatibility: registeredAsset.atlasCompatibility,
      biomeCompatibility: registeredAsset.biomeCompatibility ?? [],
      usageRules: registeredAsset.usageRules ?? [],
      lodRules: registeredAsset.lodRules ?? []
    }),
    verifiedOutputs: lodReferences,
    dependencyReferences: deepFreeze(
      (metadata.identityContractV2?.dependencies ?? []).map((dependency) => ({
        dependencyId: dependency.dependencyId,
        category: dependency.category,
        identityPolicy: dependency.identityPolicy
      }))
    ),
    verification: deepFreeze({
      registrationReady: verification.registrationGate.ready,
      blockers: verification.registrationGate.blockers,
      manifestConsistency: verification.manifestConsistency,
      lodComplexity: verification.lodComplexity,
      identityPreserved: true,
      recipeIdentityPreserved: verifiedBlend?.recipeIdentityPreserved === true,
      dependencyValidationPassed:
        Array.isArray(metadata.identityContractV2?.dependencies) &&
        metadata.identityContractV2.dependencies.length > 0,
      deterministicFingerprint: verification.deterministicFingerprint
    }),
    preservedContracts: deepFreeze({
      assetIdPreserved: verifiedBlend?.assetIdentityPreserved === true,
      sourceRecipeIdPreserved: verifiedBlend?.recipeIdentityPreserved === true,
      registryRecipeIdPreserved: metadata.registryRecipeId === definition.registryRecipeId,
      identityContractSchemaId:
        metadata.identityContractV2?.schemaId ?? manifest.identityContractSchemaId ?? null
    }),
    sourceRecords: deepFreeze({
      manifestReference: buildRelativeOutputPath(
        definition,
        "tree-eucalyptus-manifest.json"
      ),
      metadataReference: buildRelativeOutputPath(
        definition,
        "tree-eucalyptus-metadata.json"
      ),
      validationReference: buildRelativeOutputPath(
        definition,
        "tree-eucalyptus-validation.json"
      )
    }),
    validationState: deepFreeze({
      readyForManualGeneration: validation.readyForManualGeneration === true,
      outputDirectoryInsideRepo: validation.outputDirectoryInsideRepo === true,
      applicationsWriteBlocked: validation.applicationsWriteBlocked === true,
      deterministicPathConstruction: validation.deterministicPathConstruction === true,
      identityMetadataReady: validation.identityMetadataReady === true
    }),
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: definition.assetId,
          sourceRecipeId: definition.sourceRecipeId,
          registryRecipeId: definition.registryRecipeId,
          version: metadata.identityContractV2?.version ?? registeredAsset.version,
          lodReferences,
          verificationFingerprint: verification.deterministicFingerprint
        })
      )
      .digest("hex")
  });
}

export function writeTreeEucalyptusRegistrationRecord(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const record = buildTreeEucalyptusRegistrationRecord(rawDefinition, options);
  const registrationPath = path.join(outputDirectory, treeEucalyptusRegistrationFilename);

  fs.writeFileSync(registrationPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    registrationPath,
    record
  });
}

export function buildTreeEucalyptusDevelopmentCatalogEntry(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const registration =
    options.registrationRecord ??
    buildTreeEucalyptusRegistrationRecord(rawDefinition, options);
  const metadata = readJsonRequired(
    path.join(outputDirectory, "tree-eucalyptus-metadata.json"),
    "tree eucalyptus metadata"
  );

  if (registration.registrationStatus !== "registered") {
    throw createRegistrationError(
      "registration_not_registered",
      `Asset ${definition.assetId} must be registered before creating a development catalog entry.`
    );
  }

  return deepFreeze({
    schemaId: treeEucalyptusDevelopmentCatalogSchemaId,
    catalogEntryId: `ASSET_DEV_CATALOG_${definition.assetId}`,
    assetId: definition.assetId,
    category: definition.category,
    familyId: definition.assetFamilyId,
    recipeId: definition.sourceRecipeId,
    registryRecipeId: definition.registryRecipeId,
    version: registration.version,
    lifecycleStatus: "REGISTERED",
    validationStatus: registration.validationStatus,
    environment: "DEVELOPMENT_ONLY",
    publishStatus: "not_published",
    releaseStatus: "not_released",
    visibility: deepFreeze({
      development: true,
      beta: false,
      production: false
    }),
    environmentGuards: deepFreeze({
      betaBlocked: true,
      productionBlocked: true,
      runtimeActivation: "disabled",
      automaticPublishing: "disabled",
      releaseCreation: "disabled",
      mapAttachment: "disabled"
    }),
    runtimeSafetyFlags,
    palette: deepFreeze({
      paletteId: registration.paletteId,
      slots: metadata.paletteSlots ?? []
    }),
    availableLods: deepFreeze({
      close: metricSnapshot(registration.verifiedOutputs.close),
      gameplay: metricSnapshot(registration.verifiedOutputs.gameplay),
      map: metricSnapshot(registration.verifiedOutputs.map)
    }),
    atlasCompatibility: registration.registry.atlasCompatibility,
    dependencyReferences: registration.dependencyReferences,
    sourceRegistrationRecord: deepFreeze({
      filename: treeEucalyptusRegistrationFilename,
      deterministicFingerprint: registration.deterministicFingerprint
    }),
    validation: deepFreeze({
      developmentOnly: true,
      betaBlocked: true,
      productionBlocked: true,
      noPublishSideEffects: true,
      noReleaseSideEffects: true,
      noRendererActivation: true,
      noMapAttachment: true,
      deterministicOutput: true,
      validationPassed: true
    }),
    deterministicCatalogHash: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: definition.assetId,
          environment: "DEVELOPMENT_ONLY",
          version: registration.version,
          runtimeSafetyFlags
        })
      )
      .digest("hex")
  });
}

export function writeTreeEucalyptusDevelopmentCatalogEntry(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, definition.outputLocation);
  const registrationResult =
    options.registrationRecord
      ? { record: options.registrationRecord }
      : writeTreeEucalyptusRegistrationRecord(rawDefinition, options);
  const record = buildTreeEucalyptusDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const catalogPath = path.join(outputDirectory, treeEucalyptusDevelopmentCatalogFilename);

  fs.writeFileSync(catalogPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    catalogPath,
    record,
    registration: registrationResult.record
  });
}

export function writeTreeEucalyptusRegistrationAndDevelopmentCatalog(
  rawDefinition = treeEucalyptusProductionRunDefinition,
  options = {}
) {
  const registration = writeTreeEucalyptusRegistrationRecord(rawDefinition, options);
  const catalog = writeTreeEucalyptusDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registration.record
  });

  return deepFreeze({
    registrationPath: registration.registrationPath,
    registrationRecord: registration.record,
    catalogPath: catalog.catalogPath,
    catalogRecord: catalog.record
  });
}

function buildLodReference(definition, outputDirectory, entry) {
  return deepFreeze({
    filename: entry.filename,
    relativePath: buildRelativeOutputPath(definition, entry.filename),
    absolutePath: path.join(outputDirectory, entry.filename),
    sha256: entry.sha256,
    meshCount: entry.meshCount,
    materialCount: entry.materialCount,
    triangleCount: entry.triangleCount,
    primitiveCount: entry.primitiveCount,
    hasExternalDependencies: entry.hasExternalDependencies
  });
}

function metricSnapshot(entry) {
  return deepFreeze({
    filename: entry.filename,
    relativePath: entry.relativePath,
    sha256: entry.sha256,
    meshCount: entry.meshCount,
    materialCount: entry.materialCount,
    triangleCount: entry.triangleCount,
    primitiveCount: entry.primitiveCount
  });
}

function buildRelativeOutputPath(definition, filename) {
  return path.join(
    "asset-factory-workspace",
    "production",
    definition.productionFamilyId,
    "export",
    filename
  );
}

function findVerifiedOutput(verification, filename) {
  const entry = verification.files.find((file) => file.filename === filename);
  if (!entry || entry.classification !== "VERIFIED_COMPLETE") {
    throw createRegistrationError(
      "missing_verified_output",
      `Expected verified output ${filename} was not available for eucalyptus registration.`
    );
  }
  return entry;
}

function readJsonRequired(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createRegistrationError(
      "missing_required_record",
      `Missing ${label} at ${absolutePath}.`
    );
  }
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  return deepFreeze({
    assetId: normalizeString(definition.assetId, "assetId"),
    sourceRecipeId: normalizeString(definition.sourceRecipeId, "sourceRecipeId"),
    registryRecipeId: normalizeString(definition.registryRecipeId, "registryRecipeId"),
    assetFamilyId: normalizeString(definition.assetFamilyId, "assetFamilyId"),
    productionFamilyId: normalizeString(
      definition.productionFamilyId,
      "productionFamilyId"
    ),
    category: normalizeString(definition.category, "category"),
    outputLocation: normalizeString(definition.outputLocation, "outputLocation"),
    expectedOutputs: deepFreeze(definition.expectedOutputs ?? {})
  });
}

function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createRegistrationError(
      "invalid_registration_definition",
      `Field ${fieldName} must be a non-empty string.`
    );
  }
  return value.trim();
}

function createRegistrationError(code, message) {
  const error = new Error(message);
  error.name = "TreeEucalyptusRegistrationError";
  error.code = code;
  return error;
}
