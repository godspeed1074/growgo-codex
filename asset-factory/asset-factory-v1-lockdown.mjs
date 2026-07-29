import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const assetFactoryV1LockdownSchemaId = "ASSET_FACTORY_V1_LOCKDOWN_001";
export const assetFactoryV1GoldenAssetSchemaId =
  "ASSET_FACTORY_V1_GOLDEN_ASSET_SET_001";
export const assetFactoryV1TemplateSchemaId =
  "ASSET_FACTORY_V1_TEMPLATE_LAYOUT_001";

const lifecycle = deepFreeze([
  "Specification",
  "Authoring Setup",
  "Blender Generation",
  "Source Verification",
  "Universal Export",
  "GLB Validation",
  "Visual Review",
  "Registration",
  "Promotion",
  "Recipe Ready"
]);

const requiredFolders = deepFreeze([
  "specification",
  "source",
  "export",
  "validation",
  "reports"
]);

const requiredFiles = deepFreeze({
  specification: [
    "family-specification.json",
    "asset-production-workflow.md",
    "production-checklist.md"
  ],
  source: ["source-verification.json"],
  export: ["authoring-manifest.json", "export-manifest.json"],
  validation: [
    "preflight-validation.json",
    "glb-validation.json",
    "visual-review.json"
  ],
  reports: ["verification-report.md", "promotion-report.json"]
});

const preflightRequirements = deepFreeze([
  {
    key: "asset_identity_exists",
    description: "Asset identity exists on source objects and metadata.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "recipe_identity_exists",
    description: "Recipe identity exists and matches the asset specification.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "dependency_identity_exists",
    description: "Declared dependency identities exist and remain declared-only.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "identity_anchors_exist",
    description: "Identity anchors exist for CLOSE, GAMEPLAY, and MAP LODs.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "required_lods_exist",
    description: "Required LOD roots exist for CLOSE, GAMEPLAY, and MAP.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "naming_conventions_valid",
    description: "Blend, GLB, manifest, metadata, and validation names follow the locked convention.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "metadata_exists",
    description: "Source manifest and metadata records exist before export.",
    gate: "PASS_REQUIRED"
  },
  {
    key: "folder_structure_correct",
    description: "The asset production folder contains the locked v1 folder structure.",
    gate: "PASS_REQUIRED"
  }
]);

const validationGates = deepFreeze([
  {
    phase: "Source Verification",
    gateId: "SOURCE_GATE_001",
    passCondition: "Blend exists in the correct family location and its hash is recorded."
  },
  {
    phase: "Universal Export",
    gateId: "EXPORT_GATE_001",
    passCondition:
      "Universal exporter validates identity, dependency, anchor, and LOD order requirements."
  },
  {
    phase: "GLB Validation",
    gateId: "GLB_GATE_001",
    passCondition:
      "All required GLBs validate with no external dependencies and descending CLOSE > GAMEPLAY > MAP complexity."
  },
  {
    phase: "Visual Review",
    gateId: "VISUAL_GATE_001",
    passCondition:
      "Manual Blender review or approved visual inspection record confirms the asset is visually acceptable."
  },
  {
    phase: "Registration",
    gateId: "REGISTRATION_GATE_001",
    passCondition:
      "Registration may occur only after source, export, GLB, and visual gates all pass."
  },
  {
    phase: "Promotion",
    gateId: "PROMOTION_GATE_001",
    passCondition:
      "Promotion may occur only after verification is complete, approved binaries remain unchanged, and any previous revision is preserved."
  }
]);

const visualApprovalGate = deepFreeze({
  gateId: "VISUAL_APPROVAL_GATE_001",
  required: true,
  manualReviewRequired: true,
  codexCanPrepareEvidence: true,
  blenderHumanReviewRequiredBeforeApproval: true,
  passCondition:
    "A manual visual review record explicitly marks the candidate revision acceptable before registration replacement or promotion."
});

const registrationRules = deepFreeze([
  "Codex may prepare manifests, metadata, validation, and registration candidates.",
  "Registration must target validated GLB outputs and the verified source blend only.",
  "Registration cannot proceed when any required LOD is missing, invalid, or externally dependent.",
  "Registration must record version, identity contract, dependency list, and deterministic fingerprints.",
  "Registration does not imply publishing, runtime activation, or promotion."
]);

const promotionRules = deepFreeze([
  "Promotion may change only the Asset Factory catalog state for the in-scope asset revision.",
  "A promoted current revision must have a completed verification record and a passing visual review gate.",
  "Any prior approved revision must be preserved as historical and protected.",
  "Promotion cannot overwrite protected historical source files or protected approved binaries.",
  "Promotion does not publish the asset and does not activate runtime use."
]);

const rollbackRules = deepFreeze([
  "Rollback restores catalog status to the previously protected approved revision without deleting historical records.",
  "Rollback must preserve both the failing candidate's verification evidence and the previous approved revision hashes.",
  "Rollback is required when identity validation fails, visual review is rejected, or post-promotion regression evidence breaks.",
  "Rollback must not delete source blends or GLBs for protected revisions.",
  "Rollback must create a report entry describing the trigger, restored revision, and preserved evidence."
]);

const goldenAssetRegistry = deepFreeze([
  {
    assetId: "TREE_EUCALYPTUS_001",
    version: "v001",
    role: "approved_tree_baseline",
    productionRegistrationRequired: true,
    productionRegistrationPath:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-eucalyptus-registration.json",
    universalExportManifestPath:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-eucalyptus-export-manifest.json"
  },
  {
    assetId: "TREE_BOTTLEBRUSH_001",
    version: "v002",
    role: "approved_revision_baseline",
    productionRegistrationRequired: true,
    productionRegistrationPath:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-registration.json",
    promotionRecordPath:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-promotion.json",
    universalExportManifestPath:
      "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export/tree-bottlebrush-v002-export-manifest.json"
  },
  {
    assetId: "SHRUB_COASTAL_LOW_001",
    version: "v001",
    role: "verified_shrub_baseline",
    productionRegistrationRequired: false,
    productionRegistrationPath: null,
    universalExportManifestPath:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/export/shrub-coastal-low-export-manifest.json",
    sourceSetupPath:
      "asset-factory-workspace/production/COASTAL_SHRUB_FAMILY_001/validation/manual-authoring-setup.json"
  }
]);

const checklist = deepFreeze({
  passFailGates: [
    "PASS: preflight identity and folder checks complete",
    "PASS: source blend exists and hash is recorded",
    "PASS: universal exporter validates identity and writes manifest",
    "PASS: GLB validation confirms no external dependencies and correct LOD order",
    "PASS: manual visual review explicitly approves the candidate",
    "PASS: registration or promotion state changes stay within the current phase scope",
    "FAIL: any identity, dependency, naming, or LOD gate fails",
    "FAIL: approved binaries would need to be overwritten to continue"
  ],
  codexUsage: [
    "Use Codex for specification drafting, generator/export script setup, validation records, manifest checks, registration preparation, promotion preparation, and regression testing.",
    "Do not use Codex alone to replace manual visual judgment for approval.",
    "Do not use Codex to publish or activate runtime during the locked v1 production workflow."
  ],
  manualBlenderReview: [
    "Manual Blender review is required after GLB validation and before approval or promotion.",
    "Manual Blender review is also required when a geometry refinement revision changes visible silhouette, canopy, proportion, or material balance."
  ],
  promotionAllowance: [
    "Promotion is allowed only after verification passes, visual review passes, and protected prior revisions remain unchanged.",
    "Promotion is blocked when the new revision lacks a verification record, a validation record, or a preserved rollback target."
  ]
});

export function createAssetFactoryV1LockdownDefinition({ cwd = process.cwd() } = {}) {
  const goldenAssets = goldenAssetRegistry.map((entry) =>
    inspectGoldenAsset(entry, cwd)
  );

  const definition = {
    schemaId: assetFactoryV1LockdownSchemaId,
    version: "v1",
    status: "locked_candidate",
    workflowName: "Asset Factory v1 Production Workflow",
    lifecycle,
    requiredFolders,
    requiredFiles,
    validationGates,
    visualApprovalGate,
    registrationRules,
    promotionRules,
    rollbackRules,
    preflightRequirements,
    goldenAssetSet: {
      schemaId: assetFactoryV1GoldenAssetSchemaId,
      registeredGoldenAssets: goldenAssets,
      regressionRule:
        "Future exporter or validation changes must preserve or intentionally explain identity, dependency, LOD, and hash expectations for every golden baseline."
    },
    template: {
      schemaId: assetFactoryV1TemplateSchemaId,
      rootPath:
        "asset-factory-workspace/templates/ASSET_FACTORY_V1_ASSET_TEMPLATE/asset-name",
      requiredFolders
    },
    checklist
  };

  return deepFreeze({
    ...definition,
    deterministicFingerprint: fingerprint(definition)
  });
}

export function validateAssetFactoryV1LockdownDefinition(rawDefinition) {
  try {
    if (rawDefinition?.schemaId !== assetFactoryV1LockdownSchemaId) {
      throw new Error(
        `Expected ${assetFactoryV1LockdownSchemaId} but received ${rawDefinition?.schemaId}.`
      );
    }

    if (JSON.stringify(rawDefinition.lifecycle) !== JSON.stringify(lifecycle)) {
      throw new Error("Locked lifecycle does not match the required Asset Factory v1 sequence.");
    }

    for (const folderName of requiredFolders) {
      if (!rawDefinition.requiredFolders?.includes(folderName)) {
        throw new Error(`Missing required folder '${folderName}'.`);
      }
    }

    for (const requirement of preflightRequirements) {
      if (!rawDefinition.preflightRequirements?.some((entry) => entry.key === requirement.key)) {
        throw new Error(`Missing preflight requirement '${requirement.key}'.`);
      }
    }

    if (rawDefinition.visualApprovalGate?.required !== true) {
      throw new Error("Visual approval gate must remain mandatory.");
    }

    if (rawDefinition.goldenAssetSet?.schemaId !== assetFactoryV1GoldenAssetSchemaId) {
      throw new Error("Golden asset registry schema is missing or invalid.");
    }

    if (
      !Array.isArray(rawDefinition.goldenAssetSet?.registeredGoldenAssets) ||
      rawDefinition.goldenAssetSet.registeredGoldenAssets.length !== 3
    ) {
      throw new Error("Golden asset registry must contain the three locked baselines.");
    }

    return deepFreeze({
      ok: true,
      errorCode: null,
      message: null,
      definition: rawDefinition
    });
  } catch (error) {
    return deepFreeze({
      ok: false,
      errorCode: "asset_factory_v1_lockdown_validation_failed",
      message: error.message,
      definition: null
    });
  }
}

function inspectGoldenAsset(entry, cwd) {
  const registrationExists = entry.productionRegistrationPath
    ? fs.existsSync(path.join(cwd, entry.productionRegistrationPath))
    : false;
  const exportManifestExists = fs.existsSync(path.join(cwd, entry.universalExportManifestPath));
  const promotionExists = entry.promotionRecordPath
    ? fs.existsSync(path.join(cwd, entry.promotionRecordPath))
    : false;
  const sourceSetupExists = entry.sourceSetupPath
    ? fs.existsSync(path.join(cwd, entry.sourceSetupPath))
    : false;

  return deepFreeze({
    ...entry,
    goldenBaselineRegistered: true,
    productionRegistrationExists: registrationExists,
    universalExportManifestExists: exportManifestExists,
    promotionRecordExists: promotionExists,
    sourceSetupExists,
    regressionChecksRequired: deepFreeze([
      "identity_preserved",
      "dependency_identity_preserved",
      "lod_order_preserved",
      "no_external_dependencies",
      "manifest_schema_preserved"
    ])
  });
}

function fingerprint(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
  }
  return value;
}
