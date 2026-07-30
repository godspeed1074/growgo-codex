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

export const coastalGravelPathDefinition = deepFreeze({
  assetId: "COASTAL_GRAVEL_PATH_001",
  category: "terrain",
  sourceRecipeId: "COASTAL_GRAVEL_PATH_RECIPE_001",
  registryRecipeId: "COASTAL_GRAVEL_PATH_RECIPE_001",
  assetFamilyId: "COASTAL_PATHWAY_FAMILY_001",
  productionFamilyId: "COASTAL_PATHWAY_FAMILY_001",
  version: "v001",
  variantId: "DEFAULT",
  paletteId: "AU_COASTAL_GRAVEL_PATH_001",
  lodProfile: "PATHWAY_LIGHTWEIGHT_001",
  outputLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export",
  sourceLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source",
  validationLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation",
  specificationLocation:
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/specification",
  expectedOutputs: deepFreeze({
    blend: "COASTAL_GRAVEL_PATH_001_v001.blend",
    close: "COASTAL_GRAVEL_PATH_001_LOD_CLOSE.glb",
    gameplay: "COASTAL_GRAVEL_PATH_001_LOD_GAMEPLAY.glb",
    map: "COASTAL_GRAVEL_PATH_001_LOD_MAP.glb"
  }),
  dependencies: deepFreeze([
    "MOD_PATH_STRAIGHT_SEGMENT_001",
    "MOD_PATH_EDGE_BLEND_001",
    "MOD_PATH_GROUND_SOCKET_COASTAL_001"
  ])
});

export const coastalGravelPathVisualApprovalFilename =
  "coastal-gravel-path-visual-approval.json";
export const coastalGravelPathRegistrationFilename =
  "coastal-gravel-path-registration.json";
export const coastalGravelPathDevelopmentCatalogFilename =
  "coastal-gravel-path-development-catalog-entry.json";
export const coastalGravelPathVersionRecordFilename =
  "coastal-gravel-path-v001-version-record.json";

const runtimeSafetyFlags = deepFreeze({
  lifecycleExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  runtimeExecutionAuthorized: false
});

export function buildCoastalGravelPathVisualApprovalRecord(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const sourceVerification = readSourceVerification(definition, options);
  const exportValidation = readExportValidation(definition, options);
  const exportManifest = readExportManifest(definition, options);

  assertFileExists(
    path.join(resolveRoot(options.cwd), definition.sourceLocation, definition.expectedOutputs.blend),
    "gravel path source blend"
  );

  return deepFreeze({
    schemaId: "COASTAL_GRAVEL_PATH_V001_VISUAL_APPROVAL_001",
    assetId: definition.assetId,
    version: definition.version,
    approvedOn: options.approvalDate ?? "2026-07-30",
    approvalStatus: "approved",
    approvalSource:
      options.approvalSource ??
      "Manual visual approval confirmed in the Phase 198.5 registration request.",
    reviewOutcome: deepFreeze({
      visualReviewComplete: true,
      visuallyApprovedForDevelopmentCatalog: true,
      revisionRequired: false
    }),
    evidenceReferences: deepFreeze({
      sourceVerification: buildSourceRelativePath(
        definition,
        "coastal-gravel-path-source-verification.json"
      ),
      exportValidation: buildValidationRelativePath(
        definition,
        "coastal-gravel-path-export-validation.json"
      ),
      exportManifest: buildExportRelativePath(
        definition,
        "coastal-gravel-path-export-manifest.json"
      ),
      exportVerificationReport: buildReportRelativePath(
        definition,
        "coastal-gravel-path-export-verification-report.md"
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

export function writeCoastalGravelPathVisualApprovalRecord(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const record = buildCoastalGravelPathVisualApprovalRecord(rawDefinition, options);
  const recordPath = path.join(outputDirectory, coastalGravelPathVisualApprovalFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    visualApprovalPath: recordPath,
    record
  });
}

export function buildCoastalGravelPathRegistrationRecord(
  rawDefinition = coastalGravelPathDefinition,
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
  const cleanupRecord = readCleanupRecord(definition, options);
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
    intakeRecord,
    cleanupRecord
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
    },
    {
      name: "canonical_source_lane_valid",
      ok:
        cleanupRecord.canonicalFamily === definition.productionFamilyId &&
        cleanupRecord.finalSourceState.canonicalSourceInPlace === true &&
        cleanupRecord.finalSourceState.quarantineEvidencePreserved === true
    }
  ]);

  const lodReferences = deepFreeze({
    close: buildLodReference(definition, verifiedClose),
    gameplay: buildLodReference(definition, verifiedGameplay),
    map: buildLodReference(definition, verifiedMap)
  });

  return deepFreeze({
    schemaId: "COASTAL_GRAVEL_PATH_REGISTRATION_RECORD_001",
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
      metadataIdentityPreserved: exportValidation.files.every(
        (entry) => entry.metadataPreserved === true
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
        "coastal-gravel-path-authoring-manifest.json"
      ),
      sourceVerificationReference: buildSourceRelativePath(
        definition,
        "coastal-gravel-path-source-verification.json"
      ),
      cleanupVerificationReference: buildValidationRelativePath(
        definition,
        "coastal-gravel-path-source-lane-cleanup.json"
      ),
      exportManifestReference: buildExportRelativePath(
        definition,
        "coastal-gravel-path-export-manifest.json"
      ),
      exportValidationReference: buildValidationRelativePath(
        definition,
        "coastal-gravel-path-export-validation.json"
      ),
      visualApprovalReference: buildExportRelativePath(
        definition,
        coastalGravelPathVisualApprovalFilename
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

export function writeCoastalGravelPathRegistrationRecord(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const visualApprovalResult = options.visualApprovalRecord
    ? { record: options.visualApprovalRecord }
    : writeCoastalGravelPathVisualApprovalRecord(rawDefinition, options);
  const record = buildCoastalGravelPathRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApprovalResult.record
  });
  const recordPath = path.join(outputDirectory, coastalGravelPathRegistrationFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    registrationPath: recordPath,
    record,
    visualApprovalRecord: visualApprovalResult.record
  });
}

export function buildCoastalGravelPathDevelopmentCatalogEntry(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalGravelPathRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_GRAVEL_PATH_DEVELOPMENT_CATALOG_ENTRY_001",
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
      slots: ["gravel", "edge_blend"]
    }),
    availableLods: deepFreeze({
      close: metricSnapshot(registration.verifiedOutputs.close),
      gameplay: metricSnapshot(registration.verifiedOutputs.gameplay),
      map: metricSnapshot(registration.verifiedOutputs.map)
    }),
    atlasCompatibility: registration.registry.atlasCompatibility,
    dependencyReferences: registration.dependencyReferences,
    sourceRegistrationRecord: deepFreeze({
      filename: coastalGravelPathRegistrationFilename,
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

export function writeCoastalGravelPathDevelopmentCatalogEntry(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalGravelPathRegistrationRecord(rawDefinition, options);
  const record = buildCoastalGravelPathDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalGravelPathDevelopmentCatalogFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    catalogPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function buildCoastalGravelPathVersionRecord(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalGravelPathRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_GRAVEL_PATH_V001_VERSION_RECORD_001",
    assetId: definition.assetId,
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: definition.version,
    v001: deepFreeze({
      status: "approved/current candidate",
      current: true,
      visualApprovalRecord: coastalGravelPathVisualApprovalFilename,
      validationRecord: "coastal-gravel-path-export-validation.json",
      registrationRecord: coastalGravelPathRegistrationFilename,
      developmentCatalogRecord: coastalGravelPathDevelopmentCatalogFilename,
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

export function writeCoastalGravelPathVersionRecord(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalGravelPathRegistrationRecord(rawDefinition, options);
  const record = buildCoastalGravelPathVersionRecord(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalGravelPathVersionRecordFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    versionRecordPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function writeCoastalGravelPathRegistrationPackage(
  rawDefinition = coastalGravelPathDefinition,
  options = {}
) {
  const visualApproval = writeCoastalGravelPathVisualApprovalRecord(rawDefinition, options);
  const registration = writeCoastalGravelPathRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApproval.record
  });
  const developmentCatalog = writeCoastalGravelPathDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registration.record
  });
  const versionRecord = writeCoastalGravelPathVersionRecord(rawDefinition, {
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
    coastalGravelPathVisualApprovalFilename
  );
  if (!fs.existsSync(absolutePath)) {
    return writeCoastalGravelPathVisualApprovalRecord(definition, options).record;
  }
  return readJsonRequired(absolutePath, "gravel path visual approval");
}

function assertRegistrationReadiness(
  definition,
  sourceVerification,
  exportValidation,
  exportManifest,
  visualApproval,
  authoringManifest,
  setupRecord,
  intakeRecord,
  cleanupRecord
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
  if (cleanupRecord.canonicalFamily !== definition.productionFamilyId) {
    throw createRegistrationError(
      "source_lane_invalid",
      `Asset ${definition.assetId} canonical source lane does not match ${definition.productionFamilyId}.`
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
      "coastal-gravel-path-source-verification.json"
    ),
    "gravel path source verification"
  );
}

function readExportManifest(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.outputLocation,
      "coastal-gravel-path-export-manifest.json"
    ),
    "gravel path export manifest"
  );
}

function readExportValidation(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-gravel-path-export-validation.json"
    ),
    "gravel path export validation"
  );
}

function readAuthoringManifest(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-gravel-path-authoring-manifest.json"
    ),
    "gravel path authoring manifest"
  );
}

function readManualAuthoringSetup(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-gravel-path-manual-authoring-setup.json"
    ),
    "gravel path manual authoring setup"
  );
}

function readIntakeRecord(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.specificationLocation,
      "coastal-gravel-path-001-intake.json"
    ),
    "gravel path intake record"
  );
}

function readCleanupRecord(definition, options) {
  return readJsonRequired(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-gravel-path-source-lane-cleanup.json"
    ),
    "gravel path source lane cleanup"
  );
}

function findFileValidation(exportValidation, filename) {
  const fileValidation = exportValidation.files.find((entry) => entry.filename === filename);
  if (!fileValidation) {
    throw createRegistrationError(
      "missing_export_file_validation",
      `Missing export validation entry for ${filename}.`
    );
  }
  return fileValidation;
}

function assertFileExists(filepath, label) {
  if (!fs.existsSync(filepath)) {
    throw createRegistrationError("missing_file", `Expected ${label} at ${filepath}.`);
  }
}

function readJsonRequired(filepath, label) {
  assertFileExists(filepath, label);
  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

function normalizeDefinition(definition) {
  return deepFreeze({ ...definition });
}

function createRegistrationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
