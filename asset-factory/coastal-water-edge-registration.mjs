import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";

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

export const coastalWaterEdgeDefinition = deepFreeze({
  assetId: "COASTAL_WATER_EDGE_001",
  category: "nature",
  sourceRecipeId: "COASTAL_WATER_EDGE_RECIPE_001",
  registryRecipeId: "COASTAL_WATER_EDGE_RECIPE_001",
  assetFamilyId: "COASTAL_NATURE_FAMILY_001",
  productionFamilyId: "COASTAL_NATURE_FAMILY_001",
  version: "v001",
  variantId: "DEFAULT",
  paletteId: "AU_COASTAL_WATER_EDGE_001",
  lodProfile: "NATURE_LIGHTWEIGHT_001",
  outputLocation: "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export",
  sourceLocation: "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/source",
  validationLocation: "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/validation",
  specificationLocation:
    "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/specification",
  expectedOutputs: deepFreeze({
    blend: "COASTAL_WATER_EDGE_001_v001.blend",
    close: "COASTAL_WATER_EDGE_001_LOD_CLOSE.glb",
    gameplay: "COASTAL_WATER_EDGE_001_LOD_GAMEPLAY.glb",
    map: "COASTAL_WATER_EDGE_001_LOD_MAP.glb"
  }),
  dependencies: deepFreeze([
    "MOD_WATER_EDGE_SHORE_BAND_001",
    "MOD_WATER_EDGE_WET_MARGIN_001",
    "MOD_WATER_EDGE_GROUND_SOCKET_001"
  ])
});

export const coastalWaterEdgeVisualApprovalFilename =
  "coastal-water-edge-visual-approval.json";
export const coastalWaterEdgeRegistrationFilename =
  "coastal-water-edge-registration.json";
export const coastalWaterEdgeDevelopmentCatalogFilename =
  "coastal-water-edge-development-catalog-entry.json";
export const coastalWaterEdgeVersionRecordFilename =
  "coastal-water-edge-v001-version-record.json";

const runtimeSafetyFlags = deepFreeze({
  lifecycleExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  runtimeExecutionAuthorized: false
});

export function buildCoastalWaterEdgeVisualApprovalRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const sourceVerification = readSourceVerification(definition, options);
  const exportValidation = readExportValidation(definition, options);
  const exportManifest = readExportManifest(definition, options);

  assertFileExists(
    path.join(resolveRoot(options.cwd), definition.sourceLocation, definition.expectedOutputs.blend),
    "water-edge source blend"
  );

  return deepFreeze({
    schemaId: "COASTAL_WATER_EDGE_V001_VISUAL_APPROVAL_001",
    assetId: definition.assetId,
    version: definition.version,
    approvedOn: options.approvalDate ?? "2026-07-30",
    approvalStatus: "approved",
    approvalSource:
      options.approvalSource ??
      "Manual visual approval confirmed in the Phase 197.5 registration request.",
    reviewOutcome: deepFreeze({
      visualReviewComplete: true,
      visuallyApprovedForDevelopmentCatalog: true,
      revisionRequired: false
    }),
    evidenceReferences: deepFreeze({
      sourceVerification: buildSourceRelativePath(
        definition,
        "coastal-water-edge-source-verification.json"
      ),
      exportValidation: buildValidationRelativePath(
        definition,
        "coastal-water-edge-export-validation.json"
      ),
      exportManifest: buildExportRelativePath(
        definition,
        "coastal-water-edge-export-manifest.json"
      ),
      exportVerificationReport: buildReportRelativePath(
        definition,
        "coastal-water-edge-export-verification-report.md"
      )
    }),
    preservedHashes: deepFreeze({
      blend: sourceVerification.sourceBlend.sha256,
      close: findFileValidation(exportValidation, definition.expectedOutputs.close).sha256,
      gameplay: findFileValidation(exportValidation, definition.expectedOutputs.gameplay).sha256,
      map: findFileValidation(exportValidation, definition.expectedOutputs.map).sha256
    }),
    verification: deepFreeze({
      sourceVerified: sourceVerification.sourceIdentityVerification.assetIdentityMatches === true,
      exportValidated: exportValidation.exportStatus === "VERIFIED_COMPLETE",
      manifestAssetIdMatches: exportManifest.assetId === definition.assetId,
      manifestRecipeMatches: exportManifest.recipeId === definition.sourceRecipeId
    }),
    safety: deepFreeze({
      published: false,
      runtimeActivated: false,
      registrationReplaced: false,
      promotionPerformed: false
    })
  });
}

export function writeCoastalWaterEdgeVisualApprovalRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const record = buildCoastalWaterEdgeVisualApprovalRecord(rawDefinition, options);
  const recordPath = path.join(outputDirectory, coastalWaterEdgeVisualApprovalFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    visualApprovalPath: recordPath,
    record
  });
}

export function buildCoastalWaterEdgeRegistrationRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registry = createAssetFactoryRegistryLayer();
  const registeredAsset = registry.getAssetById(definition.assetId);
  if (!registeredAsset) {
    throw createRegistrationError(
      "missing_registry_asset",
      `Asset ${definition.assetId} is not present in the Asset Factory registry layer.`
    );
  }

  const sourceVerification = readSourceVerification(definition, options);
  const exportValidation = readExportValidation(definition, options);
  const exportManifest = readExportManifest(definition, options);
  const authoringManifest = readAuthoringManifest(definition, options);
  const setupRecord = readManualAuthoringSetup(definition, options);
  const intakeRecord = readIntakeRecord(definition, options);
  const visualApproval =
    options.visualApprovalRecord ?? ensureVisualApprovalRecord(definition, options);

  const root = resolveRoot(options.cwd);
  const sourceBlendPath = path.join(
    root,
    definition.sourceLocation,
    definition.expectedOutputs.blend
  );
  const sourceBlendStats = fs.statSync(sourceBlendPath);

  const verifiedClose = findFileValidation(exportValidation, definition.expectedOutputs.close);
  const verifiedGameplay = findFileValidation(
    exportValidation,
    definition.expectedOutputs.gameplay
  );
  const verifiedMap = findFileValidation(exportValidation, definition.expectedOutputs.map);

  assertRegistrationReadiness(
    definition,
    sourceVerification,
    exportValidation,
    exportManifest,
    visualApproval,
    authoringManifest,
    setupRecord,
    intakeRecord
  );

  const manifestChecks = deepFreeze([
    { name: "export_validation_exists", ok: true },
    { name: "export_manifest_exists", ok: true },
    { name: "visual_approval_exists", ok: true },
    { name: "source_verification_exists", ok: true },
    {
      name: "identity_contracts_match",
      ok:
        authoringManifest.assetId === definition.assetId &&
        authoringManifest.recipeId === definition.sourceRecipeId &&
        setupRecord.assetId === definition.assetId &&
        intakeRecord.assetIdentity.assetId === definition.assetId &&
        exportManifest.assetId === definition.assetId &&
        exportManifest.recipeId === definition.sourceRecipeId
    },
    {
      name: "source_export_separation_valid",
      ok:
        sourceVerification.sourceIdentityVerification.canonicalSourceFolder === true &&
        sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport ===
          false
    }
  ]);

  const lodReferences = deepFreeze({
    close: buildLodReference(definition, verifiedClose),
    gameplay: buildLodReference(definition, verifiedGameplay),
    map: buildLodReference(definition, verifiedMap)
  });

  return deepFreeze({
    schemaId: "COASTAL_WATER_EDGE_REGISTRATION_RECORD_001",
    assetId: definition.assetId,
    category: definition.category,
    recipeId: definition.sourceRecipeId,
    registryRecipeId: definition.registryRecipeId,
    assetFamilyId: definition.assetFamilyId,
    productionFamilyId: definition.productionFamilyId,
    version: definition.version,
    variantId: definition.variantId,
    paletteId: definition.paletteId,
    registrationStatus: "registered",
    validationStatus: "validated",
    visualApprovalStatus: "approved",
    publishStatus: "not_published",
    releaseStatus: "not_released",
    readyForApproval: true,
    readyForPublishing: false,
    promotionStatus: "approved/current candidate",
    currentDevelopmentRevision: true,
    registeredAt: options.registrationDate ?? "2026-07-30",
    sourceBlend: deepFreeze({
      filename: definition.expectedOutputs.blend,
      relativePath: sourceVerification.sourceBlend.relativePath,
      sizeBytes: sourceBlendStats.size,
      sha256: sourceVerification.sourceBlend.sha256
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
      definition.dependencies.map((dependencyId) => ({
        dependencyId,
        category: "module",
        identityPolicy: "DEPENDENCY_DECLARED_ONLY"
      }))
    ),
    verification: deepFreeze({
      registrationReady: true,
      blockers: [],
      manifestConsistency: deepFreeze({
        ok: manifestChecks.every((check) => check.ok === true),
        checks: manifestChecks
      }),
      lodComplexity: exportValidation.lodOrdering,
      identityPreserved: exportValidation.files.every(
        (entry) => entry.assetIdentityPreserved === true
      ),
      recipeIdentityPreserved: exportValidation.files.every(
        (entry) => entry.recipeIdentityPreserved === true
      ),
      dependencyValidationPassed: exportValidation.files.every(
        (entry) => entry.dependencyIdentityPreserved === true
      ),
      visualApprovalPassed: visualApproval.approvalStatus === "approved",
      promotedToActiveDevelopmentRevision: false
    }),
    preservedContracts: deepFreeze({
      assetIdPreserved: exportValidation.files.every(
        (entry) => entry.assetIdentityPreserved === true
      ),
      sourceRecipeIdPreserved: exportValidation.files.every(
        (entry) => entry.recipeIdentityPreserved === true
      ),
      registryRecipeIdPreserved: registeredAsset.recipeId === definition.registryRecipeId,
      identityContractSchemaId: "ASSET_FACTORY_V1_SOURCE_EXPORT_IDENTITY_CONTRACT_001"
    }),
    sourceRecords: deepFreeze({
      authoringManifestReference: buildValidationRelativePath(
        definition,
        "coastal-water-edge-authoring-manifest.json"
      ),
      sourceVerificationReference: buildSourceRelativePath(
        definition,
        "coastal-water-edge-source-verification.json"
      ),
      exportManifestReference: buildExportRelativePath(
        definition,
        "coastal-water-edge-export-manifest.json"
      ),
      exportValidationReference: buildValidationRelativePath(
        definition,
        "coastal-water-edge-export-validation.json"
      ),
      visualApprovalReference: buildExportRelativePath(
        definition,
        coastalWaterEdgeVisualApprovalFilename
      )
    }),
    historicalRevision: null,
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: definition.assetId,
          version: definition.version,
          sourceBlendHash: sourceVerification.sourceBlend.sha256,
          lodHashes: {
            close: verifiedClose.sha256,
            gameplay: verifiedGameplay.sha256,
            map: verifiedMap.sha256
          },
          visualApprovalApprovedOn: visualApproval.approvedOn
        })
      )
      .digest("hex")
  });
}

export function writeCoastalWaterEdgeRegistrationRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const visualApprovalResult = options.visualApprovalRecord
    ? { record: options.visualApprovalRecord }
    : writeCoastalWaterEdgeVisualApprovalRecord(rawDefinition, options);
  const record = buildCoastalWaterEdgeRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApprovalResult.record
  });
  const recordPath = path.join(outputDirectory, coastalWaterEdgeRegistrationFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    registrationPath: recordPath,
    record,
    visualApprovalRecord: visualApprovalResult.record
  });
}

export function buildCoastalWaterEdgeDevelopmentCatalogEntry(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalWaterEdgeRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_WATER_EDGE_DEVELOPMENT_CATALOG_ENTRY_001",
    catalogEntryId: `ASSET_DEV_CATALOG_${definition.assetId}`,
    assetId: definition.assetId,
    category: definition.category,
    familyId: definition.assetFamilyId,
    recipeId: definition.sourceRecipeId,
    registryRecipeId: definition.registryRecipeId,
    version: registration.version,
    lifecycleStatus: "APPROVED_CURRENT_CANDIDATE",
    validationStatus: "approved",
    visualApprovalStatus: "approved",
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
      slots: ["shoreline band", "wet margin"]
    }),
    availableLods: deepFreeze({
      close: metricSnapshot(registration.verifiedOutputs.close),
      gameplay: metricSnapshot(registration.verifiedOutputs.gameplay),
      map: metricSnapshot(registration.verifiedOutputs.map)
    }),
    atlasCompatibility: registration.registry.atlasCompatibility,
    dependencyReferences: registration.dependencyReferences,
    sourceRegistrationRecord: deepFreeze({
      filename: coastalWaterEdgeRegistrationFilename,
      version: registration.version,
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
      validationPassed: true,
      promotionApplied: false
    })
  });
}

export function writeCoastalWaterEdgeDevelopmentCatalogEntry(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalWaterEdgeRegistrationRecord(rawDefinition, options);
  const record = buildCoastalWaterEdgeDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalWaterEdgeDevelopmentCatalogFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    catalogPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function buildCoastalWaterEdgeVersionRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalWaterEdgeRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_WATER_EDGE_V001_VERSION_RECORD_001",
    assetId: definition.assetId,
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: definition.version,
    v001: deepFreeze({
      status: "approved/current candidate",
      current: true,
      visualApprovalRecord: coastalWaterEdgeVisualApprovalFilename,
      validationRecord: "coastal-water-edge-export-validation.json",
      registrationRecord: coastalWaterEdgeRegistrationFilename,
      developmentCatalogRecord: coastalWaterEdgeDevelopmentCatalogFilename,
      promotionRecord: null
    }),
    scope: "ASSET_FACTORY_CATALOG_ONLY",
    published: false,
    runtimeActivated: false,
    promotionPerformed: false,
    registrationReplaced: false,
    registrationFingerprint: registration.deterministicFingerprint
  });
}

export function writeCoastalWaterEdgeVersionRecord(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalWaterEdgeRegistrationRecord(rawDefinition, options);
  const record = buildCoastalWaterEdgeVersionRecord(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalWaterEdgeVersionRecordFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    versionRecordPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function writeCoastalWaterEdgeRegistrationPackage(
  rawDefinition = coastalWaterEdgeDefinition,
  options = {}
) {
  const visualApproval = writeCoastalWaterEdgeVisualApprovalRecord(rawDefinition, options);
  const registration = writeCoastalWaterEdgeRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApproval.record
  });
  const developmentCatalog = writeCoastalWaterEdgeDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registration.record
  });
  const versionRecord = writeCoastalWaterEdgeVersionRecord(rawDefinition, {
    ...options,
    registrationRecord: registration.record
  });

  return deepFreeze({
    visualApprovalPath: visualApproval.visualApprovalPath,
    visualApprovalRecord: visualApproval.record,
    registrationPath: registration.registrationPath,
    registrationRecord: registration.record,
    developmentCatalogPath: developmentCatalog.catalogPath,
    developmentCatalogRecord: developmentCatalog.record,
    versionRecordPath: versionRecord.versionRecordPath,
    versionRecord: versionRecord.record
  });
}

function resolveRoot(cwd) {
  return path.resolve(cwd ?? process.cwd());
}

function resolveOutputDirectory(definition, options) {
  return path.resolve(resolveRoot(options.cwd), definition.outputLocation);
}

function buildExportRelativePath(definition, filename) {
  return path.join(
    "asset-factory-workspace",
    "production",
    definition.productionFamilyId,
    "export",
    filename
  );
}

function buildSourceRelativePath(definition, filename) {
  return path.join(
    "asset-factory-workspace",
    "production",
    definition.productionFamilyId,
    "source",
    filename
  );
}

function buildValidationRelativePath(definition, filename) {
  return path.join(
    "asset-factory-workspace",
    "production",
    definition.productionFamilyId,
    "validation",
    filename
  );
}

function buildReportRelativePath(definition, filename) {
  return path.join(
    "asset-factory-workspace",
    "production",
    definition.productionFamilyId,
    "reports",
    filename
  );
}

function buildLodReference(definition, fileValidation) {
  return deepFreeze({
    filename: fileValidation.filename,
    relativePath: fileValidation.relativePath,
    absolutePath: path.join(resolveRoot(), fileValidation.relativePath),
    sha256: fileValidation.sha256,
    meshCount: fileValidation.meshCount,
    materialCount: fileValidation.materialCount,
    triangleCount: fileValidation.triangleCount,
    primitiveCount: fileValidation.primitiveCount,
    hasExternalDependencies: fileValidation.hasExternalDependencies
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

function ensureVisualApprovalRecord(definition, options) {
  const absolutePath = path.join(
    resolveOutputDirectory(definition, options),
    coastalWaterEdgeVisualApprovalFilename
  );
  if (!fs.existsSync(absolutePath)) {
    return writeCoastalWaterEdgeVisualApprovalRecord(definition, options).record;
  }
  return readJsonRequired(absolutePath, "water-edge visual approval");
}

function assertRegistrationReadiness(
  definition,
  sourceVerification,
  exportValidation,
  exportManifest,
  visualApproval,
  authoringManifest,
  setupRecord,
  intakeRecord
) {
  if (exportValidation.exportStatus !== "VERIFIED_COMPLETE") {
    throw createRegistrationError(
      "export_not_verified",
      `Asset ${definition.assetId} is not export-verified.`
    );
  }
  if (visualApproval.approvalStatus !== "approved") {
    throw createRegistrationError(
      "visual_approval_missing",
      `Asset ${definition.assetId} is not visually approved.`
    );
  }
  if (
    sourceVerification.sourceIdentityVerification.canonicalSourceFolder !== true ||
    sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport !==
      false
  ) {
    throw createRegistrationError(
      "source_export_separation_invalid",
      `Asset ${definition.assetId} does not preserve source/export separation.`
    );
  }
  if (
    authoringManifest.assetId !== definition.assetId ||
    setupRecord.assetId !== definition.assetId ||
    intakeRecord.assetIdentity.assetId !== definition.assetId ||
    exportManifest.assetId !== definition.assetId
  ) {
    throw createRegistrationError(
      "identity_contract_mismatch",
      `Asset identity records do not match for ${definition.assetId}.`
    );
  }
  if (
    authoringManifest.recipeId !== definition.sourceRecipeId ||
    setupRecord.recipeId !== definition.sourceRecipeId ||
    intakeRecord.recipeIdentity.recipeId !== definition.sourceRecipeId ||
    exportManifest.recipeId !== definition.sourceRecipeId
  ) {
    throw createRegistrationError(
      "recipe_contract_mismatch",
      `Recipe identity records do not match for ${definition.assetId}.`
    );
  }
}

function readSourceVerification(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.sourceLocation,
      "coastal-water-edge-source-verification.json"
    ),
    "water-edge source verification"
  );
}

function readExportManifest(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.outputLocation,
      "coastal-water-edge-export-manifest.json"
    ),
    "water-edge export manifest"
  );
}

function readExportValidation(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-water-edge-export-validation.json"
    ),
    "water-edge export validation"
  );
}

function readAuthoringManifest(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-water-edge-authoring-manifest.json"
    ),
    "water-edge authoring manifest"
  );
}

function readManualAuthoringSetup(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-water-edge-manual-authoring-setup.json"
    ),
    "water-edge manual authoring setup"
  );
}

function readIntakeRecord(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.specificationLocation,
      "coastal-water-edge-001-intake.json"
    ),
    "water-edge intake record"
  );
}

function findFileValidation(exportValidation, filename) {
  const fileValidation = exportValidation.files.find((entry) => entry.filename === filename);
  if (!fileValidation) {
    throw createRegistrationError(
      "missing_export_validation_entry",
      `Missing export validation entry for ${filename}.`
    );
  }
  return fileValidation;
}

function assertFileExists(absolutePath, label) {
  if (!fs.existsSync(absolutePath)) {
    throw createRegistrationError(
      "missing_required_file",
      `Missing ${label} at ${absolutePath}.`
    );
  }
}

function readJsonRequired(absolutePath, label) {
  assertFileExists(absolutePath, label);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function normalizeDefinition(rawDefinition) {
  const definition = rawDefinition ?? {};
  return deepFreeze({
    assetId: normalizeString(definition.assetId, "assetId"),
    category: normalizeString(definition.category, "category"),
    sourceRecipeId: normalizeString(definition.sourceRecipeId, "sourceRecipeId"),
    registryRecipeId: normalizeString(definition.registryRecipeId, "registryRecipeId"),
    assetFamilyId: normalizeString(definition.assetFamilyId, "assetFamilyId"),
    productionFamilyId: normalizeString(definition.productionFamilyId, "productionFamilyId"),
    version: normalizeString(definition.version, "version"),
    variantId: normalizeString(definition.variantId, "variantId"),
    paletteId: normalizeString(definition.paletteId, "paletteId"),
    lodProfile: normalizeString(definition.lodProfile, "lodProfile"),
    outputLocation: normalizeString(definition.outputLocation, "outputLocation"),
    sourceLocation: normalizeString(definition.sourceLocation, "sourceLocation"),
    validationLocation: normalizeString(
      definition.validationLocation,
      "validationLocation"
    ),
    specificationLocation: normalizeString(
      definition.specificationLocation,
      "specificationLocation"
    ),
    expectedOutputs: deepFreeze({
      blend: normalizeString(definition.expectedOutputs?.blend, "expectedOutputs.blend"),
      close: normalizeString(definition.expectedOutputs?.close, "expectedOutputs.close"),
      gameplay: normalizeString(
        definition.expectedOutputs?.gameplay,
        "expectedOutputs.gameplay"
      ),
      map: normalizeString(definition.expectedOutputs?.map, "expectedOutputs.map")
    }),
    dependencies: deepFreeze(
      Array.isArray(definition.dependencies)
        ? definition.dependencies.map((dependency) =>
            normalizeString(dependency, "dependencies[]")
          )
        : []
    )
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
  error.name = "CoastalWaterEdgeRegistrationError";
  error.code = code;
  return error;
}
