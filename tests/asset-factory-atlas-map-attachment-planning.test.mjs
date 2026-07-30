import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const attachmentRoot = path.join(
  repoRoot,
  "asset-factory-workspace/atlas-map-attachment/ATLAS_MAP_ATTACHMENT_001"
);

const specificationPath = path.join(
  attachmentRoot,
  "specification/atlas-map-attachment-specification.json"
);
const contractsPath = path.join(
  attachmentRoot,
  "metadata/atlas-map-attachment-metadata-contracts.json"
);
const validationPath = path.join(
  attachmentRoot,
  "validation/atlas-map-attachment-validation.json"
);
const lifecyclePath = path.join(
  attachmentRoot,
  "lifecycle/atlas-map-attachment-lifecycle-rules.json"
);
const reportPath = path.join(
  attachmentRoot,
  "reports/atlas-map-attachment-architecture-report.md"
);

const moduleUnderTest = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "atlas-map-attachment-planning.mjs"
  )
);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

test("atlas map attachment planning is deterministic", () => {
  const first = moduleUnderTest.buildAtlasMapAttachmentPlanning({
    cwd: repoRoot
  });
  const second = moduleUnderTest.buildAtlasMapAttachmentPlanning({
    cwd: repoRoot
  });

  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(first.specification, second.specification);
  assert.deepEqual(first.contracts, second.contracts);
  assert.deepEqual(first.validation, second.validation);
  assert.deepEqual(first.lifecycleRules, second.lifecycleRules);
});

test("atlas map attachment planning defines coordinate, lookup, boundary, package, seed, permission, renderer, and failure contracts", () => {
  const planning = moduleUnderTest.buildAtlasMapAttachmentPlanning({
    cwd: repoRoot
  });
  const specification = planning.specification;

  assert.equal(specification.coordinateInputContract.requiredFields.length, 6);
  assert.equal(specification.mapToRegionLookupRules.lookupInputs.length >= 5, true);
  assert.equal(specification.regionBoundaryRules.requiredFields.length, 4);
  assert.equal(specification.packageLoadingRules.allowedArtifacts.length >= 4, true);
  assert.equal(
    specification.deterministicSeedGenerationFromCoordinates.seedInputs.length,
    7
  );
  assert.equal(specification.mapAttachmentPermissions.allowedStates.length, 4);
  assert.equal(specification.rendererBoundaryRules.blockedImports.length, 4);
  assert.equal(specification.failureHandling.reasonCodes.length >= 6, true);
});

test("atlas map attachment planning builds metadata-only representative lookup contexts", () => {
  const planning = moduleUnderTest.buildAtlasMapAttachmentPlanning({
    cwd: repoRoot
  });

  assert.equal(planning.contracts.representativeLookupContexts.length >= 3, true);
  assert.equal(
    planning.contracts.representativeLookupContexts.every(
      (entry) =>
        entry.coordinateInput.environment === "DEVELOPMENT_ONLY" &&
        entry.attachmentPermissions.runtimeActivationAuthorized === false &&
        entry.attachmentPermissions.mapDownloadsAuthorized === false &&
        entry.attachmentPermissions.rendererAttachmentAuthorized === false
    ),
    true
  );
  assert.equal(planning.contracts.failureContracts.length, 3);
});

test("atlas map attachment planning writes records and preserves blocked attachment behavior", () => {
  moduleUnderTest.writeAtlasMapAttachmentPlanning({ cwd: repoRoot });

  const specification = readJson(specificationPath);
  const contracts = readJson(contractsPath);
  const validation = readJson(validationPath);
  const lifecycleRules = readJson(lifecyclePath);
  const report = fs.readFileSync(reportPath, "utf8");

  assert.equal(validation.status, "pass");
  assert.equal(lifecycleRules.lifecycleStatus, "PLANNING_READY");
  assert.equal(validation.runtimeActivationAuthorized, false);
  assert.equal(validation.mapDownloadsAuthorized, false);
  assert.equal(validation.rendererAttachmentAuthorized, false);
  assert.equal(validation.blenderAuthorized, false);
  assert.equal(validation.glbAuthorized, false);
  assert.equal(validation.assetModificationAuthorized, false);
  assert.equal(specification.mapAttachmentPermissions.permissions.mapDownloadsAuthorized, false);
  assert.equal(contracts.representativeLookupContexts.length >= 3, true);
  assert.match(report, /Future map attachment: READY/);
});
