import { createHash } from "node:crypto";

import {
  createAssetReleaseManagementLayer,
  validateAssetReleaseRecord
} from "./asset-release-management.mjs";
import {
  createAssetChangeManagementLayer,
  validateAssetChangeRecord
} from "./asset-change-management.mjs";
import {
  createAssetAuditTrailLayer,
  validateAssetAuditRecord
} from "./asset-audit-trail.mjs";
import {
  createAssetVersioningLayer,
  validateAssetVersionRecord
} from "./asset-versioning.mjs";

export const assetReleaseDocumentationLayerSchemaId =
  "ASSET_RELEASE_DOCUMENTATION_LAYER_001";
export const assetReleaseDocumentationRecordSchemaId =
  "ASSET_RELEASE_DOCUMENTATION_RECORD_001";
export const assetReleaseDocumentationValidationSchemaId =
  "ASSET_RELEASE_DOCUMENTATION_VALIDATION_001";

export const assetReleaseDocumentationSections = deepFreeze([
  "RELEASE_SUMMARY",
  "NEW_ASSETS",
  "UPDATED_ASSETS",
  "PERFORMANCE_CHANGES",
  "BUG_FIXES",
  "COMPATIBILITY_CHANGES"
]);

const defaultAssetId = "GROUND_BEACH_SAND_001";
const documentationDate = "2026-07-27";

export function createAssetReleaseDocumentationLayer(
  rawReleaseLayer = createAssetReleaseManagementLayer(),
  rawChangeLayer = createAssetChangeManagementLayer(),
  rawAuditLayer = createAssetAuditTrailLayer(),
  rawVersioningLayer = createAssetVersioningLayer()
) {
  const releaseLayer = normalizeReleaseLayer(rawReleaseLayer);
  const changeLayer = normalizeChangeLayer(rawChangeLayer);
  const auditLayer = normalizeAuditLayer(rawAuditLayer);
  const versioningLayer = normalizeVersioningLayer(rawVersioningLayer);

  const layer = deepFreeze({
    schemaId: assetReleaseDocumentationLayerSchemaId,
    layerId: "ASSET_RELEASE_DOCUMENTATION_LAYER_001_DEFAULT",
    releaseLayerId: releaseLayer.layerId,
    changeLayerId: changeLayer.layerId,
    auditLayerId: auditLayer.layerId,
    versioningLayerId: versioningLayer.layerId,
    supportedSections: assetReleaseDocumentationSections,
    createDocumentationRecord(rawInput = {}) {
      return createDocumentationRecord(
        rawInput,
        releaseLayer,
        changeLayer,
        auditLayer,
        versioningLayer
      );
    }
  });

  const checked = validateAssetReleaseDocumentationLayer(layer);
  if (!checked.ok) {
    throw createDocumentationError(checked.errorCode, checked.message);
  }

  return layer;
}

export function validateAssetReleaseDocumentationLayer(rawLayer) {
  try {
    if (rawLayer?.schemaId !== assetReleaseDocumentationLayerSchemaId) {
      throw createDocumentationError(
        "invalid_asset_release_documentation_layer_schema",
        `Expected ${assetReleaseDocumentationLayerSchemaId} but received ${rawLayer?.schemaId}.`
      );
    }

    if (typeof rawLayer.createDocumentationRecord !== "function") {
      throw createDocumentationError(
        "invalid_asset_release_documentation_layer_api",
        "Asset release documentation layer must expose createDocumentationRecord."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetReleaseDocumentationLayer: rawLayer
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_release_documentation_layer_validation_failed",
      message: error.message,
      assetReleaseDocumentationLayer: null
    });
  }
}

export function validateAssetReleaseDocumentationRecord(rawRecord) {
  try {
    if (rawRecord?.schemaId !== assetReleaseDocumentationRecordSchemaId) {
      throw createDocumentationError(
        "invalid_asset_release_documentation_record_schema",
        `Expected ${assetReleaseDocumentationRecordSchemaId} but received ${rawRecord?.schemaId}.`
      );
    }

    if (rawRecord.validation?.schemaId !== assetReleaseDocumentationValidationSchemaId) {
      throw createDocumentationError(
        "invalid_asset_release_documentation_validation_schema",
        `Expected ${assetReleaseDocumentationValidationSchemaId} but received ${rawRecord.validation?.schemaId}.`
      );
    }

    for (const key of [
      "sourceRecordsExist",
      "documentationMatchesReleaseContents",
      "noUnsupportedClaims",
      "deterministicOutput",
      "validationPassed"
    ]) {
      if (rawRecord.validation[key] !== true) {
        throw createDocumentationError(
          "asset_release_documentation_record_validation_failed",
          `Asset release documentation validation flag ${key} must be true.`
        );
      }
    }

    const expectedHash = computeDeterministicHash(buildDocumentationSignature(rawRecord));
    if (expectedHash !== rawRecord.validation.deterministicDocumentationHash) {
      throw createDocumentationError(
        "asset_release_documentation_hash_mismatch",
        "Asset release documentation record hash does not match generated state."
      );
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      assetReleaseDocumentationRecord: rawRecord
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: error.code ?? "asset_release_documentation_record_validation_failed",
      message: error.message,
      assetReleaseDocumentationRecord: null
    });
  }
}

function createDocumentationRecord(
  rawInput,
  releaseLayer,
  changeLayer,
  auditLayer,
  versioningLayer
) {
  const input = normalizeDocumentationInput(rawInput);
  const releaseRecord =
    input.releaseRecord ??
    buildReleasedRecord(
      releaseLayer.createReleaseRecord({
        assetIds: input.assetIds ?? [defaultAssetId]
      }),
      releaseLayer
    );
  const changeRecords =
    input.changeRecords ?? buildChangeRecords(releaseRecord.assetList, changeLayer);
  const versionRecords =
    input.versionRecords ?? buildVersionRecords(releaseRecord.assetList, versioningLayer);
  const auditRecords =
    input.auditRecords ?? buildAuditRecords(releaseRecord.assetList, auditLayer);

  validateSourceRecords(releaseRecord, changeRecords, versionRecords, auditRecords);

  const sections = buildDocumentationSections(
    releaseRecord,
    changeRecords,
    versionRecords,
    auditRecords
  );
  const documentationBase = deepFreeze({
    schemaId: assetReleaseDocumentationRecordSchemaId,
    documentationId: `ASSET_RELEASE_DOCUMENTATION_${normalizeSlug(releaseRecord.releaseVersion)}`,
    releaseId: releaseRecord.releaseId,
    releaseSummary: buildReleaseSummary(releaseRecord, changeRecords),
    includedAssets: deepFreeze([...releaseRecord.assetList]),
    changes: buildChangeSummary(changeRecords),
    versionHistory: buildVersionHistory(versionRecords),
    impactSummary: buildImpactSummary(changeRecords),
    auditReferences: buildAuditReferences(auditRecords),
    sections,
    sourceReferences: deepFreeze({
      releaseId: releaseRecord.releaseId,
      changeRecordIds: deepFreeze(changeRecords.map((record) => record.changeRecordId)),
      versionRecordIds: deepFreeze(versionRecords.map((record) => record.versionRecordId)),
      auditEventIds: deepFreeze(auditRecords.map((record) => record.eventId))
    }),
    createdTimestamp: documentationDate,
    validation: null
  });

  const validation = buildDocumentationValidation(
    documentationBase,
    releaseRecord,
    changeRecords,
    versionRecords,
    auditRecords
  );
  const documentationRecord = deepFreeze({
    ...documentationBase,
    validation
  });

  const checked = validateAssetReleaseDocumentationRecord(documentationRecord);
  if (!checked.ok) {
    throw createDocumentationError(checked.errorCode, checked.message);
  }

  return documentationRecord;
}

function buildReleasedRecord(draftRecord, releaseLayer) {
  const validationPending = releaseLayer.advanceReleaseRecord(draftRecord, "VALIDATION_PENDING");
  const ready = releaseLayer.advanceReleaseRecord(validationPending, "READY");
  return releaseLayer.advanceReleaseRecord(ready, "RELEASED");
}

function buildChangeRecords(assetIds, changeLayer) {
  return deepFreeze(
    assetIds.map((assetId, index) => {
      if (index === 0) {
        return changeLayer.createChangeRecord({
          assetId,
          changeCategory: "VARIANT_ADDITION",
          changeReason: "Release packaging includes a newly available asset improvement."
        });
      }
      return changeLayer.createChangeRecord({
        assetId,
        changeCategory: "PERFORMANCE_OPTIMIZATION",
        changeReason: "Release packaging includes a performance-focused follow-up."
      });
    })
  );
}

function buildVersionRecords(assetIds, versioningLayer) {
  return deepFreeze(
    assetIds.map((assetId) =>
      versioningLayer.createVersionRecord({
        assetId
      })
    )
  );
}

function buildAuditRecords(assetIds, auditLayer) {
  let records = [];
  for (const assetId of assetIds) {
    for (const eventType of [
      "ASSET_CREATED",
      "ASSET_CHANGED",
      "ASSET_PUBLISHED"
    ]) {
      records = auditLayer.appendAuditRecord(records, { assetId, eventType });
    }
  }
  return deepFreeze(records);
}

function validateSourceRecords(releaseRecord, changeRecords, versionRecords, auditRecords) {
  const releaseCheck = validateAssetReleaseRecord(releaseRecord);
  if (!releaseCheck.ok) {
    throw createDocumentationError(releaseCheck.errorCode, releaseCheck.message);
  }

  for (const record of changeRecords) {
    const checked = validateAssetChangeRecord(record);
    if (!checked.ok) {
      throw createDocumentationError(checked.errorCode, checked.message);
    }
  }

  for (const record of versionRecords) {
    const checked = validateAssetVersionRecord(record);
    if (!checked.ok) {
      throw createDocumentationError(checked.errorCode, checked.message);
    }
  }

  for (let index = 0; index < auditRecords.length; index += 1) {
    const checked = validateAssetAuditRecord(
      auditRecords[index],
      index > 0 ? auditRecords[index - 1] : null
    );
    if (!checked.ok) {
      throw createDocumentationError(checked.errorCode, checked.message);
    }
  }
}

function buildDocumentationSections(releaseRecord, changeRecords, versionRecords, auditRecords) {
  const sections = [];

  sections.push(
    deepFreeze({
      sectionType: "RELEASE_SUMMARY",
      title: "Release Summary",
      content: buildReleaseSummary(releaseRecord, changeRecords)
    })
  );

  const newAssets = releaseRecord.assetList.filter((assetId) =>
    changeRecords.some(
      (record) =>
        record.assetId === assetId && record.changeCategory === "VARIANT_ADDITION"
    )
  );
  if (newAssets.length > 0) {
    sections.push(
      deepFreeze({
        sectionType: "NEW_ASSETS",
        title: "New Assets",
        content: deepFreeze(
          newAssets.map((assetId) => `Added ${humanizeAssetId(assetId)}.`)
        )
      })
    );
  }

  const updatedAssets = changeRecords
    .filter((record) => record.changeCategory !== "VARIANT_ADDITION")
    .map((record) => `${humanizeAssetId(record.assetId)} updated via ${record.changeCategory.toLowerCase()}.`);
  if (updatedAssets.length > 0) {
    sections.push(
      deepFreeze({
        sectionType: "UPDATED_ASSETS",
        title: "Updated Assets",
        content: deepFreeze(updatedAssets)
      })
    );
  }

  const performanceChanges = changeRecords
    .filter((record) => record.changeCategory === "PERFORMANCE_OPTIMIZATION")
    .map((record) => `${humanizeAssetId(record.assetId)} improved for runtime efficiency.`);
  if (performanceChanges.length > 0) {
    sections.push(
      deepFreeze({
        sectionType: "PERFORMANCE_CHANGES",
        title: "Performance Changes",
        content: deepFreeze(performanceChanges)
      })
    );
  }

  const bugFixes = changeRecords
    .filter((record) => record.changeCategory === "BUG_FIX")
    .map((record) => `${humanizeAssetId(record.assetId)} received a stability fix.`);
  if (bugFixes.length > 0) {
    sections.push(
      deepFreeze({
        sectionType: "BUG_FIXES",
        title: "Bug Fixes",
        content: deepFreeze(bugFixes)
      })
    );
  }

  const compatibilityChanges = changeRecords
    .filter((record) => record.changeCategory === "COMPATIBILITY_UPDATE")
    .map((record) => `${humanizeAssetId(record.assetId)} improved compatibility coverage.`);
  if (compatibilityChanges.length > 0) {
    sections.push(
      deepFreeze({
        sectionType: "COMPATIBILITY_CHANGES",
        title: "Compatibility Changes",
        content: deepFreeze(compatibilityChanges)
      })
    );
  }

  return deepFreeze(sections);
}

function buildReleaseSummary(releaseRecord, changeRecords) {
  const changeCount = changeRecords.length;
  return `Release ${releaseRecord.releaseVersion} packages ${releaseRecord.assetList.length} published asset${releaseRecord.assetList.length === 1 ? "" : "s"} with ${changeCount} documented change${changeCount === 1 ? "" : "s"}.`;
}

function buildChangeSummary(changeRecords) {
  return deepFreeze(
    changeRecords.map((record) =>
      deepFreeze({
        assetId: record.assetId,
        changeCategory: record.changeCategory,
        changeReason: record.changeReason,
        changeDelta: record.impactSummary.changeDelta,
        categoryImpact: record.impactSummary.categoryImpact
      })
    )
  );
}

function buildVersionHistory(versionRecords) {
  return deepFreeze(
    versionRecords.map((record) =>
      deepFreeze({
        assetId: record.assetId,
        versionNumber: record.versionNumber,
        parentVersion: record.parentVersion,
        versionState: record.versionState
      })
    )
  );
}

function buildImpactSummary(changeRecords) {
  const categoryCounts = new Map();
  for (const record of changeRecords) {
    categoryCounts.set(
      record.changeCategory,
      (categoryCounts.get(record.changeCategory) ?? 0) + 1
    );
  }

  return deepFreeze({
    totalChanges: changeRecords.length,
    categoryBreakdown: deepFreeze(
      [...categoryCounts.entries()]
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([changeCategory, count]) => deepFreeze({ changeCategory, count }))
    ),
    narrative: summarizeImpactNarrative(changeRecords)
  });
}

function summarizeImpactNarrative(changeRecords) {
  const impacts = new Set(changeRecords.map((record) => record.impactSummary.categoryImpact));
  return `Documented release impact covers ${[...impacts].sort().join(", ")}.`;
}

function buildAuditReferences(auditRecords) {
  return deepFreeze(
    auditRecords.map((record) =>
      deepFreeze({
        eventId: record.eventId,
        assetId: record.assetId,
        eventType: record.eventType,
        timestamp: record.timestamp
      })
    )
  );
}

function buildDocumentationValidation(
  documentationRecord,
  releaseRecord,
  changeRecords,
  versionRecords,
  auditRecords
) {
  const sourceRecordsExist =
    Boolean(releaseRecord?.releaseId) &&
    changeRecords.length > 0 &&
    versionRecords.length > 0 &&
    auditRecords.length > 0;
  const documentationMatchesReleaseContents =
    arraysEqual(
      documentationRecord.includedAssets,
      releaseRecord.assetList
    ) &&
    documentationRecord.versionHistory.every((entry) =>
      releaseRecord.includedVersions.some(
        (includedVersion) =>
          includedVersion.assetId === entry.assetId &&
          includedVersion.versionNumber === entry.versionNumber
      )
    );
  const noUnsupportedClaims = documentationHasSupportedClaims(
    documentationRecord,
    changeRecords,
    auditRecords
  );
  const deterministicOutput = true;
  const validationPassed =
    sourceRecordsExist &&
    documentationMatchesReleaseContents &&
    noUnsupportedClaims &&
    deterministicOutput;

  return deepFreeze({
    schemaId: assetReleaseDocumentationValidationSchemaId,
    sourceRecordsExist,
    documentationMatchesReleaseContents,
    noUnsupportedClaims,
    deterministicOutput,
    validationPassed,
    deterministicDocumentationHash: computeDeterministicHash(
      buildDocumentationSignature(documentationRecord)
    )
  });
}

function documentationHasSupportedClaims(documentationRecord, changeRecords, auditRecords) {
  const documentedAssetIds = new Set(documentationRecord.includedAssets);
  const changedAssetIds = new Set(changeRecords.map((record) => record.assetId));
  const auditedAssetIds = new Set(auditRecords.map((record) => record.assetId));

  for (const assetId of documentedAssetIds) {
    if (!changedAssetIds.has(assetId) || !auditedAssetIds.has(assetId)) {
      return false;
    }
  }

  for (const section of documentationRecord.sections) {
    if (!assetReleaseDocumentationSections.includes(section.sectionType)) {
      return false;
    }
  }

  return true;
}

function buildDocumentationSignature(record) {
  return [
    record.documentationId,
    record.releaseId,
    record.releaseSummary,
    record.includedAssets,
    record.changes,
    record.versionHistory,
    record.impactSummary,
    record.auditReferences,
    record.sections,
    record.sourceReferences,
    record.createdTimestamp
  ];
}

function normalizeDocumentationInput(rawInput) {
  const input = asPlainObject(rawInput, "assetReleaseDocumentationInput");
  return deepFreeze({
    assetIds: Array.isArray(input.assetIds)
      ? deepFreeze(input.assetIds.map((assetId) => normalizeAssetId(assetId)))
      : null,
    releaseRecord: input.releaseRecord ?? null,
    changeRecords: Array.isArray(input.changeRecords)
      ? deepFreeze([...input.changeRecords])
      : null,
    auditRecords: Array.isArray(input.auditRecords)
      ? deepFreeze([...input.auditRecords])
      : null,
    versionRecords: Array.isArray(input.versionRecords)
      ? deepFreeze([...input.versionRecords])
      : null
  });
}

function normalizeReleaseLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_RELEASE_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.createReleaseRecord !== "function" ||
    typeof rawLayer.advanceReleaseRecord !== "function"
  ) {
    throw createDocumentationError(
      "invalid_asset_release_documentation_release_layer",
      "Asset release documentation requires a valid release management layer."
    );
  }
  return rawLayer;
}

function normalizeChangeLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_CHANGE_MANAGEMENT_LAYER_001" ||
    typeof rawLayer.createChangeRecord !== "function"
  ) {
    throw createDocumentationError(
      "invalid_asset_release_documentation_change_layer",
      "Asset release documentation requires a valid change management layer."
    );
  }
  return rawLayer;
}

function normalizeAuditLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_AUDIT_TRAIL_LAYER_001" ||
    typeof rawLayer.appendAuditRecord !== "function"
  ) {
    throw createDocumentationError(
      "invalid_asset_release_documentation_audit_layer",
      "Asset release documentation requires a valid audit trail layer."
    );
  }
  return rawLayer;
}

function normalizeVersioningLayer(rawLayer) {
  if (
    !rawLayer ||
    rawLayer.schemaId !== "ASSET_VERSIONING_LAYER_001" ||
    typeof rawLayer.createVersionRecord !== "function"
  ) {
    throw createDocumentationError(
      "invalid_asset_release_documentation_versioning_layer",
      "Asset release documentation requires a valid versioning layer."
    );
  }
  return rawLayer;
}

function normalizeAssetId(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw createDocumentationError(
      "invalid_asset_release_documentation_asset_id",
      "assetIds must be non-empty strings."
    );
  }
  return value.trim().toUpperCase();
}

function humanizeAssetId(assetId) {
  return assetId.toLowerCase().replace(/_/g, " ");
}

function arraysEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function normalizeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function asPlainObject(value, label) {
  if (value == null) {
    return {};
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    throw createDocumentationError(
      `invalid_${label}`,
      `${label} must be an object when provided.`
    );
  }
  return value;
}

function computeDeterministicHash(input) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function createDocumentationError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  for (const key of Object.keys(value)) {
    deepFreeze(value[key]);
  }
  return value;
}
