import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { createAssetFactoryRegistryLayer } from "./asset-registry.mjs";

const OUTPUT_LOCATION =
  "asset-factory-workspace/production/COASTAL_NATURE_FAMILY_001/export";
const CATALOG_FILENAME = "tree-bottlebrush-development-catalog-entry.json";
const VALIDATION_FILENAME = "tree-bottlebrush-v002-validation.json";
const VERIFICATION_FILENAME = "tree-bottlebrush-v002-verification.json";
const PROMOTION_FILENAME = "tree-bottlebrush-v002-promotion.json";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

export function buildTreeBottlebrushV002Promotion(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const outputDirectory = path.resolve(cwd, OUTPUT_LOCATION);
  const catalog = readJson(path.join(outputDirectory, CATALOG_FILENAME));
  const validation = readJson(path.join(outputDirectory, VALIDATION_FILENAME));
  const verification = readJson(path.join(outputDirectory, VERIFICATION_FILENAME));
  const registryAsset = createAssetFactoryRegistryLayer().getAssetById(
    "TREE_BOTTLEBRUSH_001"
  );

  assertPromotionPreconditions({
    catalog,
    validation,
    verification,
    registryAsset,
    outputDirectory
  });

  const previousLods =
    catalog.revisions?.find((revision) => revision.version === "v001")
      ?.availableLods ?? catalog.availableLods;
  const v002Files = Object.fromEntries(
    validation.files.map((entry) => [entry.filename, entry])
  );
  const availableLods = deepFreeze({
    close: buildLod(
      v002Files.TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE_glb ??
        v002Files["TREE_BOTTLEBRUSH_001_v002_LOD_CLOSE.glb"]
    ),
    gameplay: buildLod(
      v002Files.TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY_glb ??
        v002Files["TREE_BOTTLEBRUSH_001_v002_LOD_GAMEPLAY.glb"]
    ),
    map: buildLod(
      v002Files.TREE_BOTTLEBRUSH_001_v002_LOD_MAP_glb ??
        v002Files["TREE_BOTTLEBRUSH_001_v002_LOD_MAP.glb"]
    )
  });
  const revisions = deepFreeze([
    deepFreeze({
      version: "v001",
      status: "historical_approved",
      protected: true,
      current: false,
      availableLods: previousLods,
      registrationRecord: "tree-bottlebrush-registration.json"
    }),
    deepFreeze({
      version: "v002",
      status: "approved",
      protected: false,
      current: true,
      availableLods,
      validationRecord: VALIDATION_FILENAME,
      verificationRecord: VERIFICATION_FILENAME
    })
  ]);
  const promotedCatalog = {
    ...catalog,
    version: "v002",
    currentDevelopmentVersion: "v002",
    lifecycleStatus: "APPROVED_CURRENT",
    validationStatus: "approved",
    availableLods,
    revisions,
    sourceRegistrationRecord: {
      ...catalog.sourceRegistrationRecord,
      version: "v001",
      status: "historical_approved",
      protected: true
    },
    sourceVerificationRecord: {
      filename: VERIFICATION_FILENAME,
      version: "v002",
      status: "approved",
      current: true,
      deterministicFingerprint: verification.deterministicFingerprint
    }
  };
  promotedCatalog.deterministicCatalogHash = hashJson({
    assetId: promotedCatalog.assetId,
    environment: promotedCatalog.environment,
    currentDevelopmentVersion: promotedCatalog.currentDevelopmentVersion,
    revisions,
    runtimeSafetyFlags: promotedCatalog.runtimeSafetyFlags
  });

  const promotedValidation = deepFreeze({
    ...validation,
    revisionStatus: "approved",
    promotionStatus: "approved/current",
    currentDevelopmentRevision: true,
    promotedToDevelopmentCatalog: true,
    registrationReplaced: false,
    visualApprovalReplaced: false,
    publishingPerformed: false,
    runtimeActivated: false
  });
  const promotionRecord = deepFreeze({
    schemaId: "TREE_BOTTLEBRUSH_V002_CATALOG_PROMOTION_001",
    assetId: "TREE_BOTTLEBRUSH_001",
    previousDevelopmentVersion: "v001",
    currentDevelopmentVersion: "v002",
    v001: deepFreeze({
      status: "historical_approved",
      protected: true,
      filesModified: false
    }),
    v002: deepFreeze({
      status: "approved",
      current: true,
      validationRecord: VALIDATION_FILENAME,
      verificationRecord: VERIFICATION_FILENAME
    }),
    scope: "ASSET_FACTORY_CATALOG_ONLY",
    published: false,
    runtimeActivated: false,
    registrationReplaced: false,
    visualApprovalReplaced: false,
    deterministicFingerprint: hashJson({
      assetId: "TREE_BOTTLEBRUSH_001",
      previousDevelopmentVersion: "v001",
      currentDevelopmentVersion: "v002",
      catalogHash: promotedCatalog.deterministicCatalogHash
    })
  });

  return deepFreeze({
    outputDirectory,
    registryAsset,
    before: deepFreeze({
      currentDevelopmentVersion: catalog.currentDevelopmentVersion ?? catalog.version,
      version: catalog.version,
      lifecycleStatus: catalog.lifecycleStatus,
      validationStatus: catalog.validationStatus
    }),
    after: deepFreeze({
      currentDevelopmentVersion: "v002",
      version: "v002",
      lifecycleStatus: "APPROVED_CURRENT",
      validationStatus: "approved"
    }),
    catalog: deepFreeze(promotedCatalog),
    validation: promotedValidation,
    promotionRecord
  });
}

export function writeTreeBottlebrushV002Promotion(options = {}) {
  const promotion = buildTreeBottlebrushV002Promotion(options);
  fs.writeFileSync(
    path.join(promotion.outputDirectory, CATALOG_FILENAME),
    `${JSON.stringify(promotion.catalog, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(promotion.outputDirectory, VALIDATION_FILENAME),
    `${JSON.stringify(promotion.validation, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(promotion.outputDirectory, PROMOTION_FILENAME),
    `${JSON.stringify(promotion.promotionRecord, null, 2)}\n`
  );
  return promotion;
}

function assertPromotionPreconditions({
  catalog,
  validation,
  verification,
  registryAsset,
  outputDirectory
}) {
  const checks = [
    [catalog.assetId === "TREE_BOTTLEBRUSH_001", "catalog identity mismatch"],
    [
      catalog.version === "v001" || catalog.version === "v002",
      "catalog version is neither v001 nor v002"
    ],
    [validation.readyToReplaceV001 === true, "v002 validation is not replacement-ready"],
    [
      verification.replacementReadiness?.readyToReplaceV001 === true,
      "v002 verification is not replacement-ready"
    ],
    [
      verification.replacementReadiness?.publishingPerformed === false,
      "v002 verification indicates publishing"
    ],
    [
      verification.replacementReadiness?.runtimeActivated === false,
      "v002 verification indicates runtime activation"
    ],
    [
      registryAsset?.currentDevelopmentVersion === "v002",
      "registry currentDevelopmentVersion is not v002"
    ],
    [
      ["CLOSE", "GAMEPLAY", "MAP"].every((lod) =>
        fs.existsSync(
          path.join(
            outputDirectory,
            `TREE_BOTTLEBRUSH_001_v002_LOD_${lod}.glb`
          )
        )
      ),
      "one or more v002 GLBs are missing"
    ]
  ];
  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    throw new Error(`Bottlebrush v002 promotion blocked: ${failed[1]}.`);
  }
}

function buildLod(entry) {
  if (!entry) {
    throw new Error("Bottlebrush v002 promotion blocked: missing validated LOD.");
  }
  return deepFreeze({
    filename: entry.filename,
    relativePath: `${OUTPUT_LOCATION}/${entry.filename}`,
    sha256: entry.sha256,
    meshCount: entry.meshCount,
    materialCount: entry.materialCount,
    triangleCount: entry.triangleCount,
    primitiveCount: entry.primitiveCount
  });
}

function readJson(filename) {
  if (!fs.existsSync(filename)) {
    throw new Error(`Bottlebrush v002 promotion blocked: missing ${filename}.`);
  }
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
