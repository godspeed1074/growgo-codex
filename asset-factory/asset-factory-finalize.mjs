import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { resolveAssetFactoryPaths } from "./asset-factory-identity-paths.mjs";

const FINALIZATION_AUDIT_SCHEMA_ID = "ASSET_FACTORY_FINALIZATION_AUDIT_001";
const REGISTRATION_SCHEMA_ID = "ASSET_FACTORY_FINALIZATION_REGISTRATION_RECORD_001";
const DEVELOPMENT_CATALOG_SCHEMA_ID =
  "ASSET_FACTORY_FINALIZATION_DEVELOPMENT_CATALOG_ENTRY_001";
const VERSION_RECORD_SCHEMA_ID = "ASSET_FACTORY_FINALIZATION_VERSION_RECORD_001";
const PROMOTION_SCHEMA_ID = "ASSET_FACTORY_FINALIZATION_PROMOTION_RECORD_001";
const FIXED_DATE = "2026-07-29";

export function finalizeAssetFactoryAsset(assetId, options = {}) {
  if (typeof assetId !== "string" || assetId.trim().length === 0) {
    throw new Error("Asset Factory finalization requires a non-empty asset ID.");
  }

  const cwd = options.cwd ?? process.cwd();
  const write = options.write ?? true;
  const resolved = resolveAssetFactoryPaths(assetId, { cwd });
  const context = loadFinalizationContext(resolved, { cwd, assetId });
  const readiness = validateAssetReadiness(context);

  if (!readiness.ready) {
    throw new Error(formatReadinessError(context, readiness));
  }

  let registrationRecord =
    context.existing.registration ?? buildRegistrationRecord(context, readiness);
  let developmentCatalog =
    context.existing.catalog ??
    buildDevelopmentCatalogEntry(context, registrationRecord);
  let versionRecord =
    context.existing.versionRecord ??
    buildVersionRecord(context, registrationRecord, developmentCatalog);
  let promotionRecord = context.existing.promotionRecord ?? null;

  const actions = [];

  if (!context.existing.registration) {
    actions.push("registration_created");
  } else {
    actions.push("registration_reused");
  }
  if (!context.existing.catalog) {
    actions.push("development_catalog_created");
  } else {
    actions.push("development_catalog_reused");
  }
  if (!context.existing.versionRecord) {
    actions.push("version_record_created");
  } else {
    actions.push("version_record_reused");
  }

  const promotionNeeded = isPromotionNeeded(registrationRecord, developmentCatalog, versionRecord);
  if (promotionNeeded) {
    const promoted = promoteActiveDevelopmentRevision(
      context,
      registrationRecord,
      developmentCatalog,
      versionRecord
    );
    registrationRecord = promoted.registrationRecord;
    developmentCatalog = promoted.developmentCatalog;
    versionRecord = promoted.versionRecord;
    promotionRecord = promoted.promotionRecord;
    actions.push("promotion_applied");
  } else if (promotionRecord) {
    actions.push("promotion_reused");
  }

  if (!promotionRecord) {
    promotionRecord = buildPromotionRecord(
      context,
      registrationRecord,
      developmentCatalog,
      versionRecord,
      false
    );
  }

  const audit = buildFinalizationAudit(
    context,
    readiness,
    registrationRecord,
    developmentCatalog,
    versionRecord,
    promotionRecord,
    actions
  );

  if (write) {
    writeIfMissingOrChanged(context.paths.registrationPath, registrationRecord);
    writeIfMissingOrChanged(context.paths.catalogPath, developmentCatalog);
    writeIfMissingOrChanged(context.paths.versionRecordPath, versionRecord);
    writeIfMissingOrChanged(context.paths.promotionPath, promotionRecord);
    writeIfMissingOrChanged(context.paths.auditPath, audit);
  }

  return deepFreeze({
    assetId,
    slug: resolved.identity.canonicalSlug,
    workspace: context.workspace,
    readiness,
    registrationRecord,
    developmentCatalog,
    versionRecord,
    promotionRecord,
    audit,
    actions
  });
}

export async function main(argv = process.argv.slice(2), options = {}) {
  const [command, assetId] = argv;
  if (command !== "finalize" || !assetId) {
    throw new Error(
      "Usage: node asset-factory/asset-factory-finalize.mjs finalize ASSET_ID"
    );
  }
  const result = finalizeAssetFactoryAsset(assetId, options);
  return {
    ok: true,
    assetId,
    actions: result.actions,
    auditPath: relativePath(options.cwd ?? process.cwd(), result.workspace.auditPath),
    finalState: result.audit.finalState
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

function loadFinalizationContext(resolved, { cwd, assetId }) {
  const sourceVerificationPath = resolved.records.sourceVerification.selectedPath;
  const exportManifestPath = resolved.records.exportManifest.selectedPath;
  const exportValidationPath = resolved.records.exportValidation.selectedPath;
  const visualApprovalPath = resolved.records.visualApproval.selectedPath;
  const registrationPath =
    resolved.records.registration.selectedPath ??
    resolved.records.registration.candidates[0];
  const catalogPath =
    resolved.records.developmentCatalog.selectedPath ??
    resolved.records.developmentCatalog.candidates[0];
  const versionRecordPath =
    resolved.records.versionRecord.selectedPath ??
    resolved.records.versionRecord.candidates[0];
  const promotionPath =
    resolved.records.promotion.selectedPath ??
    resolved.records.promotion.candidates[0];
  const auditPath = resolved.records.audit.candidates[0];
  const authoringManifestPath = resolved.records.authoringManifest.selectedPath;
  const previewMetadataPath = resolved.records.previewMetadata.selectedPath;
  const authoringSetupPath = resolved.records.authoringSetup.selectedPath;
  const sourceLocationVerificationPath =
    resolved.records.sourceLocationVerification.selectedPath;

  const sourceVerification = readJsonIfExists(sourceVerificationPath);
  const exportManifest = readJsonIfExists(exportManifestPath);
  const exportValidation = readJsonIfExists(exportValidationPath);
  const visualApproval = readJsonIfExists(visualApprovalPath);

  if (!sourceVerification) {
    throw new Error(
      [
        `Missing source verification for ${assetId}.`,
        `Expected one of: ${resolved.records.sourceVerification.candidates
          .map((candidate) => relativePath(cwd, candidate))
          .join(", ")}`,
        "Next action: create or restore a source verification record before finalization."
      ].join(" ")
    );
  }
  const version = sourceVerification.version;

  return deepFreeze({
    cwd,
    assetId,
    slug: resolved.identity.canonicalSlug,
    version,
    workspace: {
      familyId: resolved.identity.familyId,
      familyRoot: resolved.folders.familyRoot,
      sourceRoot: resolved.folders.sourceRoot,
      exportRoot: resolved.folders.exportRoot,
      validationRoot: resolved.folders.validationRoot,
      reportsRoot: resolved.folders.reportsRoot,
      auditPath
    },
    paths: {
      sourceVerificationPath,
      exportManifestPath,
      exportValidationPath,
      visualApprovalPath,
      registrationPath,
      catalogPath,
      versionRecordPath,
      promotionPath,
      auditPath,
      authoringManifestPath,
      previewMetadataPath,
      authoringSetupPath,
      sourceLocationVerificationPath
    },
    resolution: resolved,
    sourceVerification,
    exportManifest,
    exportValidation,
    visualApproval,
    authoringManifest: readJsonIfExists(authoringManifestPath),
    previewMetadata: readJsonIfExists(previewMetadataPath),
    authoringSetup: readJsonIfExists(authoringSetupPath),
    sourceLocationVerification: readJsonIfExists(sourceLocationVerificationPath),
    existing: {
      registration: readJsonIfExists(registrationPath),
      catalog: readJsonIfExists(catalogPath),
      versionRecord: readJsonIfExists(versionRecordPath),
      promotionRecord: readJsonIfExists(promotionPath)
    }
  });
}

function validateAssetReadiness(context) {
  const blockers = [];
  const checks = [];

  pushCheck(
    checks,
    Boolean(context.paths.exportManifestPath && fs.existsSync(context.paths.exportManifestPath)),
    "export_manifest_exists",
    blockers
  );
  pushCheck(
    checks,
    Boolean(context.paths.exportValidationPath && fs.existsSync(context.paths.exportValidationPath)),
    "export_validation_exists",
    blockers
  );
  pushCheck(
    checks,
    Boolean(context.paths.visualApprovalPath && fs.existsSync(context.paths.visualApprovalPath)),
    "visual_approval_exists",
    blockers
  );
  pushCheck(
    checks,
    Boolean(
      context.paths.sourceVerificationPath && fs.existsSync(context.paths.sourceVerificationPath)
    ),
    "source_verification_exists",
    blockers
  );

  const sourceBlendPath = path.join(context.cwd, context.sourceVerification.sourceBlend.relativePath);
  pushCheck(checks, fs.existsSync(sourceBlendPath), "source_blend_exists", blockers);
  pushCheck(
    checks,
    path.basename(sourceBlendPath) === context.sourceVerification.sourceBlend.filename,
    "source_blend_filename_matches",
    blockers
  );
  pushCheck(
    checks,
    context.exportValidation?.exportStatus === "VERIFIED_COMPLETE",
    "export_validation_complete",
    blockers
  );
  pushCheck(
    checks,
    context.visualApproval?.approvalStatus === "approved",
    "visual_approval_approved",
    blockers
  );

  const fileEntries = context.exportValidation?.files ?? [];
  for (const entry of fileEntries) {
    pushCheck(
      checks,
      fs.existsSync(path.join(context.cwd, entry.relativePath)),
      `glb_exists:${entry.filename}`,
      blockers
    );
  }

  const idsMatch =
    context.exportManifest?.assetId === context.assetId &&
    context.exportValidation?.assetId === context.assetId &&
    context.visualApproval?.assetId === context.assetId &&
    context.sourceVerification?.assetId === context.assetId;
  pushCheck(checks, idsMatch, "asset_identity_contracts_match", blockers);

  const recipeId = context.exportManifest?.recipeId;
  const recipeMatches =
    recipeId &&
    context.visualApproval?.evidenceReferences &&
    context.exportValidation?.files?.every(
      (entry) =>
        entry.assetIdentityPreserved === true &&
        entry.recipeIdentityPreserved === true &&
        entry.dependencyIdentityPreserved === true &&
        entry.anchorIdentityPreserved === true
    );
  pushCheck(checks, Boolean(recipeMatches), "identity_contracts_match", blockers);

  const noBlockers =
    (context.exportValidation?.lodOrdering?.passed ?? false) === true &&
    fileEntries.every((entry) => entry.hasExternalDependencies === false);
  pushCheck(checks, noBlockers, "no_blockers_exist", blockers);

  const sourceExportSeparation =
    sourceBlendPath.includes(`${path.sep}source${path.sep}`) &&
    fs.existsSync(sourceBlendPath) &&
    !fs.existsSync(path.join(context.workspace.exportRoot, context.sourceVerification.sourceBlend.filename));
  pushCheck(checks, sourceExportSeparation, "source_export_separation_valid", blockers);

  return deepFreeze({
    ready: blockers.length === 0,
    blockers,
    checks
  });
}

function buildRegistrationRecord(context, readiness) {
  const sourceBlendPath = path.join(context.cwd, context.sourceVerification.sourceBlend.relativePath);
  const sourceStats = fs.statSync(sourceBlendPath);
  const outputs = Object.fromEntries(
    context.exportValidation.files.map((entry) => [
      entry.lod.replace("LOD_", "").toLowerCase(),
      {
        filename: entry.filename,
        relativePath: entry.relativePath,
        absolutePath: path.join(context.cwd, entry.relativePath),
        sha256: entry.sha256,
        meshCount: entry.meshCount,
        materialCount: entry.materialCount,
        triangleCount: entry.triangleCount,
        primitiveCount: entry.primitiveCount,
        hasExternalDependencies: entry.hasExternalDependencies
      }
    ])
  );

  return deepFreeze({
    schemaId: REGISTRATION_SCHEMA_ID,
    assetId: context.assetId,
    category: inferCategory(context),
    recipeId: context.exportManifest.recipeId,
    registryRecipeId: context.exportManifest.recipeId,
    assetFamilyId: context.workspace.familyId,
    productionFamilyId: context.workspace.familyId,
    version: context.version,
    variantId: "DEFAULT",
    paletteId: inferPaletteId(context),
    registrationStatus: "registered",
    validationStatus: "validated",
    visualApprovalStatus: "approved",
    publishStatus: "not_published",
    releaseStatus: "not_released",
    readyForApproval: true,
    readyForPublishing: false,
    promotionStatus: "approved/current candidate",
    currentDevelopmentRevision: false,
    registeredAt: FIXED_DATE,
    sourceBlend: {
      filename: context.sourceVerification.sourceBlend.filename,
      relativePath: context.sourceVerification.sourceBlend.relativePath,
      sizeBytes: sourceStats.size,
      sha256: context.sourceVerification.sourceBlend.sha256
    },
    registry: {
      assetId: context.assetId,
      assetFamily: context.workspace.familyId,
      assetType: context.assetId,
      recipeId: context.exportManifest.recipeId,
      version: "1.0.0",
      atlasCompatibility: {
        atlasCompatible: true,
        supportedObjectTypes: [inferObjectType(context.assetId)],
        supportedClassifications: ["NATURAL_FEATURE"],
        atlasAssignmentRecipeIds: [context.exportManifest.recipeId],
        assignmentMode: "biome_and_context_match"
      },
      biomeCompatibility: [inferBiome(context.workspace.familyId)],
      usageRules: [toSlug(context.assetId)],
      lodRules: ["LOD_CLOSE", "LOD_GAMEPLAY", "LOD_MAP"]
    },
    verifiedOutputs: outputs,
    dependencyReferences: context.exportManifest.dependencies.map((dependencyId) => ({
      dependencyId,
      category: "module",
      identityPolicy: "DEPENDENCY_DECLARED_ONLY"
    })),
    verification: {
      registrationReady: readiness.ready,
      blockers: readiness.blockers,
      manifestConsistency: {
        ok: true,
        checks: readiness.checks
      },
      lodComplexity: context.exportValidation.lodOrdering,
      identityPreserved: true,
      recipeIdentityPreserved: true,
      dependencyValidationPassed: true,
      metadataIdentityPreserved: true,
      visualApprovalPassed: true,
      promotedToActiveDevelopmentRevision: false
    },
    preservedContracts: {
      assetIdPreserved: true,
      sourceRecipeIdPreserved: true,
      registryRecipeIdPreserved: true,
      identityContractSchemaId: "ASSET_IDENTITY_CONTRACT_PHASE_001_1"
    },
    sourceRecords: {
      authoringManifestReference: relativePath(context.cwd, context.paths.authoringManifestPath),
      exportManifestReference: relativePath(context.cwd, context.paths.exportManifestPath),
      sourceVerificationReference: relativePath(context.cwd, context.paths.sourceVerificationPath),
      exportValidationReference: relativePath(context.cwd, context.paths.exportValidationPath),
      visualApprovalReference: relativePath(context.cwd, context.paths.visualApprovalPath)
    },
    historicalRevision: null
  });
}

function buildDevelopmentCatalogEntry(context, registrationRecord) {
  return deepFreeze({
    schemaId: DEVELOPMENT_CATALOG_SCHEMA_ID,
    catalogEntryId: `ASSET_DEV_CATALOG_${context.assetId}`,
    assetId: context.assetId,
    category: registrationRecord.category,
    familyId: context.workspace.familyId,
    recipeId: registrationRecord.recipeId,
    registryRecipeId: registrationRecord.registryRecipeId,
    version: context.version,
    lifecycleStatus: "APPROVED_CURRENT_CANDIDATE",
    validationStatus: "approved",
    visualApprovalStatus: "approved",
    environment: "DEVELOPMENT_ONLY",
    publishStatus: "not_published",
    releaseStatus: "not_released",
    visibility: {
      development: true,
      beta: false,
      production: false
    },
    environmentGuards: {
      betaBlocked: true,
      productionBlocked: true,
      runtimeActivation: "disabled",
      automaticPublishing: "disabled",
      releaseCreation: "disabled",
      mapAttachment: "disabled"
    },
    runtimeSafetyFlags: {
      lifecycleExecutionEnabled: false,
      mapAttachmentAllowed: false,
      automaticRendererExecutionAllowed: false,
      runtimeExecutionAuthorized: false
    },
    palette: {
      paletteId: registrationRecord.paletteId,
      slots: inferPaletteSlots(context)
    },
    availableLods: registrationRecord.verifiedOutputs,
    atlasCompatibility: registrationRecord.registry.atlasCompatibility,
    dependencyReferences: registrationRecord.dependencyReferences,
    sourceRegistrationRecord: {
      filename: path.basename(context.paths.registrationPath),
      version: context.version,
      historicalProtectedVersion: null
    },
    validation: {
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
    }
  });
}

function buildVersionRecord(context, registrationRecord, developmentCatalog) {
  return deepFreeze({
    schemaId: VERSION_RECORD_SCHEMA_ID,
    assetId: context.assetId,
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: context.version,
    [context.version]: {
      status: "approved/current candidate",
      current: true,
      visualApprovalRecord: path.basename(context.paths.visualApprovalPath),
      validationRecord: path.basename(context.paths.exportValidationPath),
      registrationRecord: path.basename(context.paths.registrationPath),
      developmentCatalogRecord: path.basename(context.paths.catalogPath),
      promotionRecord: null
    },
    scope: "ASSET_FACTORY_CATALOG_ONLY",
    published: false,
    runtimeActivated: false,
    promotionPerformed: false,
    registrationReplaced: false
  });
}

function promoteActiveDevelopmentRevision(
  context,
  registrationRecord,
  developmentCatalog,
  versionRecord
) {
  const updatedRegistration = deepFreeze({
    ...registrationRecord,
    promotionStatus: "active_development_revision",
    currentDevelopmentRevision: true,
    verification: {
      ...registrationRecord.verification,
      promotedToActiveDevelopmentRevision: true
    },
    promotionRecord: path.basename(context.paths.promotionPath)
  });
  const updatedCatalog = deepFreeze({
    ...developmentCatalog,
    lifecycleStatus: "ACTIVE_DEVELOPMENT_REVISION",
    sourcePromotionRecord: {
      filename: path.basename(context.paths.promotionPath),
      currentDevelopmentVersion: context.version
    },
    validation: {
      ...developmentCatalog.validation,
      promotionApplied: true
    }
  });
  const versionState = versionRecord[context.version] ?? {};
  const updatedVersionRecord = deepFreeze({
    ...versionRecord,
    [context.version]: {
      ...versionState,
      status: "active_development_revision",
      current: true,
      promotionRecord: path.basename(context.paths.promotionPath)
    },
    promotionPerformed: true
  });
  const promotionRecord = buildPromotionRecord(
    context,
    updatedRegistration,
    updatedCatalog,
    updatedVersionRecord,
    true
  );

  return deepFreeze({
    registrationRecord: updatedRegistration,
    developmentCatalog: updatedCatalog,
    versionRecord: updatedVersionRecord,
    promotionRecord
  });
}

function buildPromotionRecord(
  context,
  registrationRecord,
  developmentCatalog,
  versionRecord,
  applied
) {
  return deepFreeze({
    schemaId: PROMOTION_SCHEMA_ID,
    assetId: context.assetId,
    previousDevelopmentVersion: null,
    currentDevelopmentVersion: context.version,
    before: {
      developmentCatalogLifecycleStatus: applied
        ? "APPROVED_CURRENT_CANDIDATE"
        : developmentCatalog.lifecycleStatus,
      versionState: applied
        ? "approved/current candidate"
        : versionRecord[context.version]?.status ?? null
    },
    after: {
      developmentCatalogLifecycleStatus: developmentCatalog.lifecycleStatus,
      versionState: versionRecord[context.version]?.status ?? null
    },
    [context.version]: {
      status: versionRecord[context.version]?.status ?? null,
      current: true,
      visualApprovalRecord: path.basename(context.paths.visualApprovalPath),
      validationRecord: path.basename(context.paths.exportValidationPath),
      registrationRecord: path.basename(context.paths.registrationPath),
      developmentCatalogRecord: path.basename(context.paths.catalogPath)
    },
    scope: "ASSET_FACTORY_CATALOG_ONLY",
    published: false,
    runtimeActivated: false,
    registrationReplaced: false,
    visualApprovalReplaced: false,
    rollbackCapability: {
      available: true,
      candidateStateCanBeRestored: "approved/current candidate",
      historicalRecordsPreserved: true
    }
  });
}

function buildFinalizationAudit(
  context,
  readiness,
  registrationRecord,
  developmentCatalog,
  versionRecord,
  promotionRecord,
  actions
) {
  return deepFreeze({
    schemaId: FINALIZATION_AUDIT_SCHEMA_ID,
    assetId: context.assetId,
    version: context.version,
    finalizedOn: FIXED_DATE,
    workspace: {
      familyId: context.workspace.familyId,
      sourceRoot: relativePath(context.cwd, context.workspace.sourceRoot),
      exportRoot: relativePath(context.cwd, context.workspace.exportRoot),
      validationRoot: relativePath(context.cwd, context.workspace.validationRoot),
      reportsRoot: relativePath(context.cwd, context.workspace.reportsRoot)
    },
    readiness,
    actions,
    finalState: {
      registrationStatus: registrationRecord.registrationStatus,
      validationStatus: registrationRecord.validationStatus,
      visualApprovalStatus: registrationRecord.visualApprovalStatus,
      promotionStatus: registrationRecord.promotionStatus,
      lifecycleStatus: developmentCatalog.lifecycleStatus,
      versionState: versionRecord[context.version]?.status ?? null,
      published: false,
      runtimeActivated: false
    },
    records: {
      visualApproval: relativePath(context.cwd, context.paths.visualApprovalPath),
      registration: relativePath(context.cwd, context.paths.registrationPath),
      developmentCatalog: relativePath(context.cwd, context.paths.catalogPath),
      versionRecord: relativePath(context.cwd, context.paths.versionRecordPath),
      promotionRecord: relativePath(context.cwd, context.paths.promotionPath)
    },
    safety: {
      publishPerformed: false,
      runtimeActivated: false,
      unrelatedAssetsModified: false,
      visualApprovalBypassed: false,
      previousRevisionsOverwritten: false
    },
    deterministicFingerprint: createHash("sha256")
      .update(
        JSON.stringify({
          assetId: context.assetId,
          version: context.version,
          actions,
          finalState: {
            promotionStatus: registrationRecord.promotionStatus,
            lifecycleStatus: developmentCatalog.lifecycleStatus,
            versionState: versionRecord[context.version]?.status ?? null
          },
          promotionRecord
        })
      )
      .digest("hex")
  });
}

function isPromotionNeeded(registrationRecord, developmentCatalog, versionRecord) {
  return (
    registrationRecord.promotionStatus !== "active_development_revision" ||
    developmentCatalog.lifecycleStatus !== "ACTIVE_DEVELOPMENT_REVISION" ||
    versionRecord[Object.keys(versionRecord).find((key) => /^v\d+/.test(key))]?.status !==
      "active_development_revision"
  );
}

function inferCategory(context) {
  return context.previewMetadata?.category ?? "nature";
}

function inferPaletteId(context) {
  return (
    context.previewMetadata?.paletteId ??
    context.authoringSetup?.paletteId ??
    context.existing.registration?.paletteId ??
    null
  );
}

function inferPaletteSlots(context) {
  const slots = context.existing.catalog?.palette?.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    return slots;
  }
  if (context.assetId.includes("GRASS")) {
    return ["grass"];
  }
  return ["default"];
}

function inferObjectType(assetId) {
  if (assetId.includes("GRASS")) return "GRASS";
  if (assetId.includes("SHRUB")) return "SHRUB";
  if (assetId.includes("TREE")) return "TREE";
  return "ASSET";
}

function inferBiome(familyId) {
  if (familyId.includes("COASTAL")) return "COASTAL";
  return familyId;
}

function toSlug(value) {
  return value.toLowerCase().replace(/_/g, "-");
}

function writeIfMissingOrChanged(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const next = `${JSON.stringify(value, null, 2)}\n`;
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === next) {
    return;
  }
  fs.writeFileSync(filePath, next, "utf8");
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relativePath(cwd, targetPath) {
  if (!cwd || !targetPath) {
    return null;
  }
  return path.relative(cwd, targetPath).replace(/\\/g, "/");
}

function pushCheck(checks, ok, name, blockers) {
  checks.push({ name, ok });
  if (!ok) {
    blockers.push(name);
  }
}

function formatReadinessError(context, readiness) {
  const lines = [`Asset Factory finalization blocked for ${context.assetId}.`];

  for (const blocker of readiness.blockers) {
    lines.push(`- ${describeBlocker(context, blocker)}`);
  }

  return lines.join("\n");
}

function describeBlocker(context, blocker) {
  const descriptions = {
    export_manifest_exists: {
      path: bestExpectedPath(context.cwd, context.resolution.records.exportManifest.candidates),
      action: "Run or restore the universal export manifest step."
    },
    export_validation_exists: {
      path: bestExpectedPath(context.cwd, context.resolution.records.exportValidation.candidates),
      action: "Run or restore export validation before finalization."
    },
    visual_approval_exists: {
      path: bestExpectedPath(context.cwd, context.resolution.records.visualApproval.candidates),
      action: "Complete human visual approval and write the visual approval record."
    },
    source_verification_exists: {
      path: bestExpectedPath(context.cwd, context.resolution.records.sourceVerification.candidates),
      action: "Verify the Blender source package and write a source verification record."
    },
    source_blend_exists: {
      path: context.sourceVerification?.sourceBlend?.relativePath ?? null,
      action: "Restore the referenced Blender source file."
    },
    source_blend_filename_matches: {
      path: context.sourceVerification?.sourceBlend?.relativePath ?? null,
      action: `Rename the Blender source to ${context.sourceVerification?.sourceBlend?.filename}.`
    },
    export_validation_complete: {
      path: relativePath(context.cwd, context.paths.exportValidationPath),
      action: "Re-run export validation until the asset reaches VERIFIED_COMPLETE."
    },
    visual_approval_approved: {
      path: relativePath(context.cwd, context.paths.visualApprovalPath),
      action: "Complete manual visual review and set approvalStatus to approved."
    },
    asset_identity_contracts_match: {
      path: null,
      action: "Align asset IDs across source verification, manifest, validation, and approval records."
    },
    identity_contracts_match: {
      path: relativePath(context.cwd, context.paths.exportValidationPath),
      action: "Repair recipe, dependency, metadata, and anchor identity checks in the export validation."
    },
    no_blockers_exist: {
      path: relativePath(context.cwd, context.paths.exportValidationPath),
      action: "Resolve LOD ordering failures or external dependency flags before finalization."
    },
    source_export_separation_valid: {
      path: context.sourceVerification?.sourceBlend?.relativePath ?? null,
      action: "Move the Blender source into source/ and keep generated GLBs in export/."
    }
  };

  if (blocker.startsWith("glb_exists:")) {
    const filename = blocker.split(":")[1];
    return `Missing GLB output ${filename}. Next action: rerun export and restore the file into export/.`;
  }

  const entry = descriptions[blocker];
  if (!entry) {
    return `${blocker}. Next action: review the validation records for this asset.`;
  }

  const pathPart = entry.path ? `Expected path: ${entry.path}. ` : "";
  return `${blocker}. ${pathPart}Next action: ${entry.action}`;
}

function bestExpectedPath(cwd, candidates) {
  return relativePath(cwd, candidates[0]);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}
