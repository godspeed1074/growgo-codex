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

export const coastalBoardwalkDefinition = deepFreeze({
  assetId: "COASTAL_BOARDWALK_001",
  category: "environment_navigation_structure",
  sourceRecipeId: "COASTAL_BOARDWALK_RECIPE_001",
  registryRecipeId: "COASTAL_BOARDWALK_RECIPE_001",
  assetFamilyId: "COASTAL_PATHWAY_FAMILY_001",
  productionFamilyId: "COASTAL_PATHWAY_FAMILY_001",
  version: "v001",
  variantId: "DEFAULT",
  paletteId: "AU_COASTAL_BOARDWALK_001",
  lodProfile: "PATHWAY_LIGHTWEIGHT_001",
  outputLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/export",
  sourceLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/source",
  validationLocation: "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/validation",
  specificationLocation:
    "asset-factory-workspace/production/COASTAL_PATHWAY_FAMILY_001/specification",
  expectedOutputs: deepFreeze({
    blend: "COASTAL_BOARDWALK_001_v001.blend",
    close: "COASTAL_BOARDWALK_001_LOD_CLOSE.glb",
    gameplay: "COASTAL_BOARDWALK_001_LOD_GAMEPLAY.glb",
    map: "COASTAL_BOARDWALK_001_LOD_MAP.glb"
  }),
  dependencies: deepFreeze([
    "MOD_BOARDWALK_DECK_SEGMENT_001",
    "MOD_BOARDWALK_POST_RAIL_SET_001",
    "MOD_BOARDWALK_GROUND_SOCKET_COASTAL_001"
  ])
});

export const coastalBoardwalkVisualApprovalFilename =
  "coastal-boardwalk-visual-approval.json";
export const coastalBoardwalkRegistrationFilename =
  "coastal-boardwalk-registration.json";
export const coastalBoardwalkDevelopmentCatalogFilename =
  "coastal-boardwalk-development-catalog-entry.json";
export const coastalBoardwalkVersionRecordFilename =
  "coastal-boardwalk-v001-version-record.json";

const runtimeSafetyFlags = deepFreeze({
  lifecycleExecutionEnabled: false,
  mapAttachmentAllowed: false,
  automaticRendererExecutionAllowed: false,
  runtimeExecutionAuthorized: false
});

export function buildCoastalBoardwalkVisualApprovalRecord(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const sourceVerification = readSourceVerification(definition, options);
  const exportValidation = readExportValidation(definition, options);
  const exportManifest = readExportManifest(definition, options);

  assertFileExists(
    path.join(resolveRoot(options.cwd), definition.sourceLocation, definition.expectedOutputs.blend),
    "boardwalk source blend"
  );

  return deepFreeze({
    schemaId: "COASTAL_BOARDWALK_V001_VISUAL_APPROVAL_001",
    assetId: definition.assetId,
    version: definition.version,
    approvedOn: options.approvalDate ?? "2026-07-30",
    approvalStatus: "approved",
    approvalSource:
      options.approvalSource ??
      "Manual visual approval confirmed in the Phase 199.5 registration request.",
    reviewOutcome: deepFreeze({
      visualReviewComplete: true,
      visuallyApprovedForDevelopmentCatalog: true,
      revisionRequired: false
    }),
    evidenceReferences: deepFreeze({
      sourceVerification: buildSourceRelativePath(
        definition,
        "coastal-boardwalk-source-verification.json"
      ),
      exportValidation: buildValidationRelativePath(
        definition,
        "coastal-boardwalk-export-validation.json"
      ),
      exportManifest: buildExportRelativePath(
        definition,
        "coastal-boardwalk-export-manifest.json"
      ),
      exportVerificationReport: buildReportRelativePath(
        definition,
        "coastal-boardwalk-export-verification-report.md"
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

export function writeCoastalBoardwalkVisualApprovalRecord(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const record = buildCoastalBoardwalkVisualApprovalRecord(rawDefinition, options);
  const recordPath = path.join(outputDirectory, coastalBoardwalkVisualApprovalFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    visualApprovalPath: recordPath,
    record
  });
}

export function buildCoastalBoardwalkRegistrationRecord(
  rawDefinition = coastalBoardwalkDefinition,
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
      name: "canonical_source_lane_valid",
      ok:
        sourceVerification.sourceIdentityVerification.canonicalSourceFolder === true &&
        sourceVerification.sourceBlend.relativePath ===
          buildSourceRelativePath(definition, definition.expectedOutputs.blend)
    },
    {
      name: "source_export_separation_valid",
      ok:
        sourceVerification.sourceIdentityVerification.noBlendFilesPresentInExport === true &&
        sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport ===
          false
    }
  ]);

  const lodReferences = deepFreeze({
    close: buildLodReference(verifiedClose, root),
    gameplay: buildLodReference(verifiedGameplay, root),
    map: buildLodReference(verifiedMap, root)
  });

  return deepFreeze({
    schemaId: "COASTAL_BOARDWALK_REGISTRATION_RECORD_001",
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
        "coastal-boardwalk-authoring-manifest.json"
      ),
      sourceVerificationReference: buildSourceRelativePath(
        definition,
        "coastal-boardwalk-source-verification.json"
      ),
      exportManifestReference: buildExportRelativePath(
        definition,
        "coastal-boardwalk-export-manifest.json"
      ),
      exportValidationReference: buildValidationRelativePath(
        definition,
        "coastal-boardwalk-export-validation.json"
      ),
      visualApprovalReference: buildExportRelativePath(
        definition,
        coastalBoardwalkVisualApprovalFilename
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

export function writeCoastalBoardwalkRegistrationRecord(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const visualApprovalResult = options.visualApprovalRecord
    ? { record: options.visualApprovalRecord }
    : writeCoastalBoardwalkVisualApprovalRecord(rawDefinition, options);
  const record = buildCoastalBoardwalkRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApprovalResult.record
  });
  const recordPath = path.join(outputDirectory, coastalBoardwalkRegistrationFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    registrationPath: recordPath,
    record,
    visualApprovalRecord: visualApprovalResult.record
  });
}

export function buildCoastalBoardwalkDevelopmentCatalogEntry(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalBoardwalkRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_BOARDWALK_DEVELOPMENT_CATALOG_ENTRY_001",
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
      slots: ["timber deck", "timber support"]
    }),
    availableLods: deepFreeze({
      close: metricSnapshot(registration.verifiedOutputs.close),
      gameplay: metricSnapshot(registration.verifiedOutputs.gameplay),
      map: metricSnapshot(registration.verifiedOutputs.map)
    }),
    atlasCompatibility: registration.registry.atlasCompatibility,
    dependencyReferences: registration.dependencyReferences,
    sourceRegistrationRecord: deepFreeze({
      filename: coastalBoardwalkRegistrationFilename,
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

export function writeCoastalBoardwalkDevelopmentCatalogEntry(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalBoardwalkRegistrationRecord(rawDefinition, options);
  const record = buildCoastalBoardwalkDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalBoardwalkDevelopmentCatalogFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    catalogPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function buildCoastalBoardwalkVersionRecord(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const registration =
    options.registrationRecord ??
    buildCoastalBoardwalkRegistrationRecord(rawDefinition, options);

  return deepFreeze({
    schemaId: "COASTAL_BOARDWALK_V001_VERSION_RECORD_001",
    assetId: definition.assetId,
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: definition.version,
    v001: deepFreeze({
      status: "approved/current candidate",
      current: true,
      visualApprovalRecord: coastalBoardwalkVisualApprovalFilename,
      validationRecord: "coastal-boardwalk-export-validation.json",
      registrationRecord: coastalBoardwalkRegistrationFilename,
      developmentCatalogRecord: coastalBoardwalkDevelopmentCatalogFilename,
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

export function writeCoastalBoardwalkVersionRecord(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const definition = normalizeDefinition(rawDefinition);
  const outputDirectory = resolveOutputDirectory(definition, options);
  const registrationResult = options.registrationRecord
    ? { record: options.registrationRecord }
    : writeCoastalBoardwalkRegistrationRecord(rawDefinition, options);
  const record = buildCoastalBoardwalkVersionRecord(rawDefinition, {
    ...options,
    registrationRecord: registrationResult.record
  });
  const recordPath = path.join(outputDirectory, coastalBoardwalkVersionRecordFilename);

  fs.writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  return deepFreeze({
    versionRecordPath: recordPath,
    record,
    registrationRecord: registrationResult.record
  });
}

export function writeCoastalBoardwalkRegistrationPackage(
  rawDefinition = coastalBoardwalkDefinition,
  options = {}
) {
  const visualApproval = writeCoastalBoardwalkVisualApprovalRecord(rawDefinition, options);
  const registration = writeCoastalBoardwalkRegistrationRecord(rawDefinition, {
    ...options,
    visualApprovalRecord: visualApproval.record
  });
  const developmentCatalog = writeCoastalBoardwalkDevelopmentCatalogEntry(rawDefinition, {
    ...options,
    registrationRecord: registration.record
  });
  const versionRecord = writeCoastalBoardwalkVersionRecord(rawDefinition, {
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

function buildLodReference(fileValidation, root) {
  return deepFreeze({
    filename: fileValidation.filename,
    relativePath: fileValidation.relativePath,
    absolutePath: path.join(root, fileValidation.relativePath),
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

function normalizeDefinition(rawDefinition) {
  return rawDefinition ?? coastalBoardwalkDefinition;
}

function readJson(filepath, description) {
  assertFileExists(filepath, description);
  return JSON.parse(fs.readFileSync(filepath, "utf8"));
}

function readSourceVerification(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.sourceLocation,
      "coastal-boardwalk-source-verification.json"
    ),
    "boardwalk source verification"
  );
}

function readExportValidation(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-boardwalk-export-validation.json"
    ),
    "boardwalk export validation"
  );
}

function readExportManifest(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.outputLocation,
      "coastal-boardwalk-export-manifest.json"
    ),
    "boardwalk export manifest"
  );
}

function readAuthoringManifest(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-boardwalk-authoring-manifest.json"
    ),
    "boardwalk authoring manifest"
  );
}

function readManualAuthoringSetup(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.validationLocation,
      "coastal-boardwalk-manual-authoring-setup.json"
    ),
    "boardwalk authoring setup"
  );
}

function readIntakeRecord(definition, options) {
  return readJson(
    path.join(
      resolveRoot(options.cwd),
      definition.specificationLocation,
      "coastal-boardwalk-001-intake.json"
    ),
    "boardwalk intake record"
  );
}

function ensureVisualApprovalRecord(definition, options) {
  const filepath = path.join(
    resolveRoot(options.cwd),
    definition.outputLocation,
    coastalBoardwalkVisualApprovalFilename
  );
  return readJson(filepath, "boardwalk visual approval");
}

function findFileValidation(exportValidation, filename) {
  const match = exportValidation.files.find((entry) => entry.filename === filename);
  if (!match) {
    throw createRegistrationError(
      "missing_export_output",
      `Missing export validation entry for ${filename}.`
    );
  }
  return match;
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
  const checks = [
    [exportValidation.exportStatus === "VERIFIED_COMPLETE", "boardwalk export validation is not complete"],
    [exportManifest.assetId === definition.assetId, "boardwalk export manifest asset ID mismatch"],
    [exportManifest.recipeId === definition.sourceRecipeId, "boardwalk export manifest recipe mismatch"],
    [visualApproval.approvalStatus === "approved", "boardwalk visual approval is not approved"],
    [sourceVerification.sourceIdentityVerification.assetIdentityMatches === true, "boardwalk source identity mismatch"],
    [sourceVerification.sourceIdentityVerification.recipeIdentityMatches === true, "boardwalk source recipe mismatch"],
    [sourceVerification.sourceIdentityVerification.canonicalSourceFolder === true, "boardwalk canonical source folder mismatch"],
    [sourceVerification.sourceIdentityVerification.assetSpecificBlendFilesPresentInExport === false, "boardwalk source/export separation violated"],
    [authoringManifest.assetId === definition.assetId, "boardwalk authoring manifest asset mismatch"],
    [setupRecord.assetId === definition.assetId, "boardwalk setup record asset mismatch"],
    [intakeRecord.assetIdentity.assetId === definition.assetId, "boardwalk intake asset mismatch"]
  ];

  for (const [ok, message] of checks) {
    if (!ok) {
      throw createRegistrationError("boardwalk_registration_precondition_failed", message);
    }
  }
}

function assertFileExists(filepath, description) {
  if (!fs.existsSync(filepath)) {
    throw createRegistrationError(
      "missing_required_file",
      `Missing ${description}: ${filepath}`
    );
  }
}

function createRegistrationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
