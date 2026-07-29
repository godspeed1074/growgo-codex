import fs from "node:fs";
import path from "node:path";

const ASSET_ID_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+_\d{3}$/;
const ASSET_REVISION_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+_\d{3}_v\d{3}$/;
const FAMILY_ID_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_FAMILY_\d{3}$/;

export function validateAssetFactoryName(name) {
  const value = typeof name === "string" ? name.trim() : "";
  const errors = [];

  if (!value) {
    errors.push("name must be a non-empty string");
  }
  if (value && value !== value.toUpperCase()) {
    errors.push("name must be uppercase");
  }
  if (value && /-|\s/.test(value)) {
    errors.push("name must use underscores instead of spaces or hyphens");
  }
  if (value && /__/.test(value)) {
    errors.push("name must not contain empty underscore segments");
  }

  const isAssetRevision = ASSET_REVISION_PATTERN.test(value);
  const isAssetId = ASSET_ID_PATTERN.test(value);
  const isFamilyId = FAMILY_ID_PATTERN.test(value);

  if (!isAssetRevision && !isAssetId && !isFamilyId && value) {
    errors.push("name must follow Asset Factory uppercase underscore naming");
    errors.push("expected ASSET_FAMILY_ITEM_001 or ASSET_FAMILY_ITEM_001_v001 format");
  }

  if (!isAssetRevision && !isAssetId && !isFamilyId) {
    return deepFreeze({
      ok: false,
      kind: "invalid",
      input: value,
      errors
    });
  }

  if (isFamilyId) {
    return deepFreeze({
      ok: true,
      kind: "family_id",
      input: value,
      familyId: value,
      errors: []
    });
  }

  const version = isAssetRevision ? value.match(/_v\d{3}$/)?.[0]?.slice(1) ?? null : null;
  const assetId = isAssetRevision ? value.replace(/_v\d{3}$/, "") : value;
  const tokens = assetId.split("_");

  return deepFreeze({
    ok: true,
    kind: isAssetRevision ? "asset_revision_id" : "asset_id",
    input: value,
    assetId,
    version,
    serial: tokens.at(-1),
    tokenCount: tokens.length,
    familyTokens: tokens.slice(1, -1),
    errors: []
  });
}

export function resolveAssetFactoryIdentity(reference, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const index = buildAssetFactoryIndex(cwd);
  const lookupKey = normalizeLookupKey(reference);
  const assetId = index.lookup.get(lookupKey);

  if (!assetId) {
    const availableExamples = Array.from(index.assetIds).sort().slice(0, 8);
    throw new Error(
      [
        `Unknown Asset Factory asset reference: ${reference}`,
        "Supported inputs: canonical asset IDs, revision IDs, and legacy compatibility names.",
        `Examples: ${availableExamples.join(", ")}`
      ].join(" ")
    );
  }

  const group = index.groups.get(assetId);
  return deepFreeze({
    assetId,
    familyId: group.familyId,
    assetType: group.assetType,
    version: group.version,
    lifecycleState: group.lifecycleState,
    lifecycleStateRaw: group.lifecycleStateRaw,
    canonicalSlug: group.slug,
    compatibilityNames: Array.from(group.aliases).sort(),
    sourceBlend: group.sourceBlend
  });
}

export function resolveAssetFactoryPaths(reference, options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const index = buildAssetFactoryIndex(cwd);
  const identity = resolveAssetFactoryIdentity(reference, { cwd });
  const group = index.groups.get(identity.assetId);
  const sourceRecords = group.registration?.payload?.sourceRecords ?? {};

  const familyRoot = path.join(
    cwd,
    "asset-factory-workspace",
    "production",
    identity.familyId
  );
  const folders = deepFreeze({
    familyRoot,
    specificationRoot: path.join(familyRoot, "specification"),
    sourceRoot: path.join(familyRoot, "source"),
    exportRoot: path.join(familyRoot, "export"),
    validationRoot: path.join(familyRoot, "validation"),
    reportsRoot: path.join(familyRoot, "reports")
  });
  const slug = identity.canonicalSlug;
  const version = identity.version;

  const sourceBlendCandidates = uniquePaths([
    group.sourceBlend?.relativePath
      ? path.join(cwd, group.sourceBlend.relativePath)
      : null,
    path.join(folders.sourceRoot, `${identity.assetId}_${version}.blend`),
    path.join(folders.exportRoot, `${identity.assetId}_${version}.blend`)
  ]);

  const recordCandidates = {
    sourceVerification: uniquePaths([
      resolveWorkspaceRelativePath(cwd, sourceRecords.sourceVerificationReference),
      path.join(folders.sourceRoot, `${slug}-${version}-source-verification.json`),
      path.join(folders.sourceRoot, `${slug}-source-verification.json`),
      path.join(folders.exportRoot, `${slug}-${version}-verification.json`),
      path.join(folders.exportRoot, `${slug}-verification.json`),
      path.join(folders.exportRoot, `${slug}-${version}-validation.json`),
      path.join(folders.exportRoot, `${slug}-validation.json`)
    ]),
    exportManifest: uniquePaths([
      resolveWorkspaceRelativePath(cwd, sourceRecords.exportManifestReference),
      path.join(folders.exportRoot, `${slug}-${version}-export-manifest.json`),
      path.join(folders.exportRoot, `${slug}-export-manifest.json`),
      path.join(folders.exportRoot, `${slug}-${version}-manifest.json`),
      path.join(folders.exportRoot, `${slug}-manifest.json`)
    ]),
    exportValidation: uniquePaths([
      resolveWorkspaceRelativePath(cwd, sourceRecords.exportValidationReference),
      path.join(folders.validationRoot, `${slug}-${version}-export-validation.json`),
      path.join(folders.validationRoot, `${slug}-export-validation.json`),
      path.join(folders.exportRoot, `${slug}-${version}-validation.json`),
      path.join(folders.exportRoot, `${slug}-validation.json`)
    ]),
    visualApproval: uniquePaths([
      resolveWorkspaceRelativePath(cwd, sourceRecords.visualApprovalReference),
      path.join(folders.exportRoot, `${slug}-${version}-visual-approval.json`),
      path.join(folders.exportRoot, `${slug}-visual-approval.json`),
      path.join(folders.exportRoot, `${slug}-${version}-manual-visual-review.json`),
      path.join(folders.exportRoot, `${slug}-manual-visual-review.json`)
    ]),
    registration: uniquePaths([
      path.join(folders.exportRoot, `${slug}-registration.json`)
    ]),
    developmentCatalog: uniquePaths([
      path.join(folders.exportRoot, `${slug}-development-catalog-entry.json`)
    ]),
    versionRecord: uniquePaths([
      path.join(folders.exportRoot, `${slug}-${version}-version-record.json`)
    ]),
    promotion: uniquePaths([
      path.join(folders.exportRoot, `${slug}-${version}-promotion.json`)
    ]),
    authoringManifest: uniquePaths([
      resolveWorkspaceRelativePath(cwd, sourceRecords.authoringManifestReference),
      path.join(folders.sourceRoot, `${slug}-${version}-authoring-manifest.json`),
      path.join(folders.sourceRoot, `${slug}-authoring-manifest.json`),
      path.join(folders.exportRoot, `${slug}-${version}-authoring-manifest.json`),
      path.join(folders.exportRoot, `${slug}-authoring-manifest.json`)
    ]),
    previewMetadata: uniquePaths([
      path.join(folders.validationRoot, `${slug}-preview-metadata.json`)
    ]),
    authoringSetup: uniquePaths([
      path.join(folders.validationRoot, `${slug}-${version}-manual-authoring-setup.json`),
      path.join(folders.validationRoot, `${slug}-manual-authoring-setup.json`),
      path.join(folders.validationRoot, "manual-authoring-setup.json"),
      path.join(folders.validationRoot, `manual-authoring-${version}-setup.json`)
    ]),
    sourceLocationVerification: uniquePaths([
      path.join(folders.validationRoot, `${slug}-source-location-verification.json`)
    ]),
    audit: uniquePaths([
      path.join(folders.reportsRoot, `${slug}-finalization-audit.json`)
    ])
  };

  return deepFreeze({
    identity,
    folders,
    sourceBlend: {
      candidates: sourceBlendCandidates,
      selectedPath: firstExistingPath(sourceBlendCandidates)
    },
    records: Object.fromEntries(
      Object.entries(recordCandidates).map(([key, candidates]) => [
        key,
        {
          candidates,
          selectedPath: firstExistingPath(candidates)
        }
      ])
    ),
    compatibility: {
      legacySourceBlendLocation:
        sourceBlendCandidates.find((candidate) => candidate?.includes(`${path.sep}export${path.sep}`)) ??
        null,
      canonicalSourceBlendPath: path.join(
        folders.sourceRoot,
        `${identity.assetId}_${version}.blend`
      )
    }
  });
}

function buildAssetFactoryIndex(cwd) {
  const productionRoot = path.join(cwd, "asset-factory-workspace", "production");
  const groups = new Map();
  const lookup = new Map();

  for (const familyId of listDirectories(productionRoot)) {
    const familyRoot = path.join(productionRoot, familyId);
    for (const folderName of ["source", "export", "validation", "specification"]) {
      const folderPath = path.join(familyRoot, folderName);
      if (!fs.existsSync(folderPath)) {
        continue;
      }
      for (const entry of fs.readdirSync(folderPath, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) {
          continue;
        }
        const filePath = path.join(folderPath, entry.name);
        const payload = readJsonIfExists(filePath);
        if (!payload?.assetId || typeof payload.assetId !== "string") {
          continue;
        }
        const assetId = payload.assetId;
        if (!groups.has(assetId)) {
          groups.set(assetId, createEmptyGroup(assetId));
        }
        const group = groups.get(assetId);
        group.familyIds.add(familyId);
        group.records.push({
          familyId,
          folderName,
          filePath,
          filename: entry.name,
          payload
        });
      }
    }
  }

  for (const [assetId, group] of groups) {
    group.slug = assetIdToSlug(assetId);
    group.familyId = selectFamilyId(group);
    group.registration = findRecord(group, /-registration\.json$/);
    group.catalog = findRecord(group, /-development-catalog-entry\.json$/);
    group.sourceVerification = findSourceVerificationRecord(group);
    group.exportManifest = findRecord(
      group,
      /-(?:v\d{3}-)?export-manifest\.json$|-(?:v\d{3}-)?manifest\.json$/
    );
    group.exportValidation = findRecord(
      group,
      /-(?:v\d{3}-)?export-validation\.json$|-(?:v\d{3}-)?validation\.json$/
    );
    group.visualApproval = findRecord(
      group,
      /-(?:v\d{3}-)?visual-approval\.json$|-manual-visual-review\.json$/
    );
    group.version = selectVersion(group);
    group.lifecycleStateRaw = selectLifecycleState(group);
    group.lifecycleState = normalizeLifecycleState(group.lifecycleStateRaw);
    group.assetType = selectAssetType(group);
    group.sourceBlend = selectSourceBlend(group);
    group.aliases = buildAliases(group);

    for (const alias of group.aliases) {
      lookup.set(normalizeLookupKey(alias), assetId);
    }
  }

  return deepFreeze({
    groups,
    lookup,
    assetIds: new Set(groups.keys())
  });
}

function createEmptyGroup(assetId) {
  return {
    assetId,
    familyIds: new Set(),
    records: [],
    aliases: new Set()
  };
}

function selectFamilyId(group) {
  return (
    group.registration?.payload?.productionFamilyId ??
    group.registration?.payload?.assetFamilyId ??
    group.catalog?.payload?.familyId ??
    Array.from(group.familyIds).sort()[0] ??
    null
  );
}

function selectVersion(group) {
  return (
    group.catalog?.payload?.currentDevelopmentVersion ??
    group.catalog?.payload?.version ??
    group.registration?.payload?.version ??
    group.sourceVerification?.payload?.version ??
    group.records
      .map((record) => record.payload?.targetVersion ?? record.payload?.currentDevelopmentVersion)
      .find(Boolean) ??
    "v001"
  );
}

function selectLifecycleState(group) {
  return (
    group.catalog?.payload?.lifecycleStatus ??
    group.registration?.payload?.promotionStatus ??
    group.registration?.payload?.registrationStatus ??
    group.visualApproval?.payload?.approvalStatus ??
    "UNKNOWN"
  );
}

function normalizeLifecycleState(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return "UNKNOWN";
  }
  return raw.toUpperCase().replaceAll(/[ /-]+/g, "_");
}

function selectAssetType(group) {
  return (
    group.registration?.payload?.registry?.assetType ??
    inferAssetTypeFromAssetId(group.assetId)
  );
}

function selectSourceBlend(group) {
  return (
    group.sourceVerification?.payload?.sourceBlend ??
    group.registration?.payload?.sourceBlend ??
    null
  );
}

function findSourceVerificationRecord(group) {
  return (
    findRecord(group, /-source-verification\.json$/) ??
    findRecord(group, /-v\d{3}-verification\.json$/) ??
    findRecord(group, /-verification\.json$/) ??
    findRecord(group, /-v\d{3}-validation\.json$/) ??
    findRecord(group, /-validation\.json$/)
  );
}

function findRecord(group, pattern) {
  const preferred = group.records
    .filter((record) => pattern.test(record.filename))
    .sort((left, right) => scoreRecord(right) - scoreRecord(left));
  return preferred[0] ?? null;
}

function scoreRecord(record) {
  let score = 0;
  if (record.folderName === "source") score += 50;
  if (record.folderName === "validation") score += 40;
  if (record.folderName === "export") score += 30;
  if (/v\d{3}/.test(record.filename)) score += 10;
  if (/source-verification/.test(record.filename)) score += 8;
  if (/export-manifest/.test(record.filename)) score += 8;
  if (/visual-approval/.test(record.filename)) score += 8;
  if (/manual-visual-review/.test(record.filename)) score += 6;
  if (/export-validation/.test(record.filename)) score += 7;
  return score;
}

function buildAliases(group) {
  const aliases = new Set([
    group.assetId,
    group.slug,
    group.assetId.toLowerCase(),
    group.slug.toLowerCase()
  ]);

  if (group.version) {
    aliases.add(`${group.assetId}_${group.version}`);
    aliases.add(`${group.slug}-${group.version}`);
  }

  if (group.sourceBlend?.filename) {
    aliases.add(path.basename(group.sourceBlend.filename, path.extname(group.sourceBlend.filename)));
  }

  for (const record of group.records) {
    aliases.add(path.basename(record.filename, ".json"));
  }

  return aliases;
}

function inferAssetTypeFromAssetId(assetId) {
  if (assetId.startsWith("TREE_")) return "TREE";
  if (assetId.startsWith("SHRUB_")) return "SHRUB";
  if (assetId.includes("_GRASS_")) return "GRASS";
  if (assetId.startsWith("BUILDING_")) return "BUILDING";
  return assetId.split("_").slice(0, -1).join("_");
}

function assetIdToSlug(assetId) {
  return assetId.replace(/_\d{3}$/, "").toLowerCase().replaceAll("_", "-");
}

function listDirectories(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function normalizeLookupKey(value) {
  return String(value).trim().replace(/\.(json|blend|glb)$/i, "").toLowerCase();
}

function uniquePaths(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function firstExistingPath(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function resolveWorkspaceRelativePath(cwd, relativeFilePath) {
  if (!relativeFilePath || typeof relativeFilePath !== "string") {
    return null;
  }
  return path.join(cwd, relativeFilePath);
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
