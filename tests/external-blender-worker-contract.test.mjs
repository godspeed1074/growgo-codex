import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  WORKER_CONTRACT_VERSION,
  createBackendRequest,
  createWorkerJob,
  serializeWorkerJob,
  validateWorkerResult,
  validateWorkerRenderLocally,
  assertOneIteration,
  WorkerContractError,
  fileChecksum,
} from "../asset-factory/golden-reference/external-blender-worker-contract.mjs";
import { encodePng } from "../asset-factory/golden-reference/golden-reference-raster-analysis.mjs";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-worker-contract-"));
const referencePath = path.join(tempRoot, "GOLDEN_REFERENCE.png");
const renderPath = path.join(tempRoot, "BLENDER_RENDER.png");
const rgba = Buffer.alloc(32 * 32 * 4, 0);
for (let y = 8; y < 24; y++) for (let x = 8; x < 24; x++) {
  const p = (y * 32 + x) * 4; rgba[p] = 180; rgba[p + 1] = 120; rgba[p + 2] = 60; rgba[p + 3] = 255;
}
fs.writeFileSync(referencePath, encodePng(32, 32, rgba));
fs.writeFileSync(renderPath, encodePng(32, 32, rgba));

function fixtureJob() {
  const referenceChecksum = fileChecksum(referencePath);
  return createWorkerJob({
    jobId: "GG-WORKER-JOB-SIMPLE-SHOP-001",
    backend: "EXTERNAL_BLENDER",
    assetId: "GG-REC-BLD-SIMPLE-SHOP-001",
    assetVersion: "1.0.0",
    recipeId: "GG-REC-BLD-SIMPLE-SHOP-001",
    recipeVersion: "1.0.0",
    blenderBuildId: "BLENDER-4.5.12-X86_64-CONTROLLED",
    goldenReference: { referenceId: "GG-REF-SIMPLE-SHOP-001", referenceVersion: "1.0.0", checksum: referenceChecksum },
    componentMappings: [{ componentId: "AWNING", objectId: "GG_BLD_AWNING_SHOP_001" }],
    modules: [{ componentId: "AWNING", assetId: "GG-BLD-AWNING-SHOP-001", assetVersion: "1.0.0", moduleId: "GG-BLD-AWNING-SHOP-001", moduleVersion: "1.0.0", moduleFamily: "SHOP_AWNING", recipeId: "GG-REC-BLD-SIMPLE-SHOP-001", recipeVersion: "1.0.0" }],
    operations: [{ componentId: "AWNING", objectId: "GG_BLD_AWNING_SHOP_001", operation: "SCALE_X", value: 1.1, moduleId: "GG-BLD-AWNING-SHOP-001", moduleVersion: "1.0.0" }],
    protectedComponents: ["MAIN_WALL"], protectedObjectIds: ["GG_BLD_WALL_SHOP_001"],
    budgetProfile: { profileId: "BUILDING_MODULE_LIGHT", hardTriangleCeiling: 1200, hardVertexCeiling: 1500, hardMaterialCeiling: 2 },
    cameraContract: { id: "GG-CAMERA-SIMPLE-SHOP-001", projection: "ORTHOGRAPHIC_LOCKED", resolution: "32x32" },
    renderContract: { format: "PNG", colorMode: "RGBA", width: 32, height: 32 },
    exportContract: { blendOutput: "SIMPLE_SHOP_BUILD_002.blend", glbOutputs: [] },
    checksums: { sourceBuild: "source-checksum-fixture", goldenReference: referenceChecksum, recipe: "recipe-checksum-fixture" },
  });
}

function fixtureResult(job) {
  return {
    jobId: job.jobId, status: "COMPLETED", assetId: job.assetId, assetVersion: job.assetVersion,
    recipeId: job.recipeId, recipeVersion: job.recipeVersion,
    blenderVersion: "4.5.12 LTS", executableIdentity: { path: "external-worker://blender", buildId: job.blenderBuildId, architecture: "x86_64" },
    sourceChecksum: job.checksums.sourceBuild, outputChecksum: "output-fixture-checksum",
    render: { path: renderPath, checksum: fileChecksum(renderPath), format: "PNG", colorMode: "RGBA", width: 32, height: 32 },
    goldenReference: { ...job.goldenReference }, modules: structuredClone(job.modules),
    transformsBeforeAfter: [{ componentId: "AWNING", operation: "SCALE_X", before: 1, after: 1.1 }],
    protectedObjectValidation: { allStable: true, components: ["MAIN_WALL"] },
    budget: { triangles: 100, vertices: 100, materials: 1, objectCount: 1, fileSizeBytes: 1000, textureReferences: 1, atlasReferences: ["GG-ATLAS-BUILDING-A@1.0.0"] },
    cameraValidation: structuredClone(job.cameraContract), executionDurationMs: 1, iteration: 1, oneIterationStop: true,
  };
}

function expectCode(fn, code) { assert.throws(fn, error => error instanceof WorkerContractError && error.code === code); }

test("creates a deterministic, untrusted external worker job", () => {
  const job = fixtureJob();
  assert.equal(job.contractVersion, WORKER_CONTRACT_VERSION);
  assert.equal(job.backend, "EXTERNAL_BLENDER"); assert.equal(job.untrustedWorker, true); assert.equal(job.deterministic, true);
  assert.equal(serializeWorkerJob(job), serializeWorkerJob(job));
  assert.match(job.generatedJobChecksum, /^[0-9a-f]{64}$/);
});

test("rejects operations outside the constrained worker allowlist", () => expectCode(() => createWorkerJob({ ...fixtureJob(), operations: [{ componentId: "X", objectId: "Y", operation: "EXECUTE_ARBITRARY_CODE", value: 1 }] }), "FORBIDDEN_WORKER_OPERATION"));

test("exposes local and external backends behind the same request contract", () => {
  const job = fixtureJob();
  for (const backend of ["LOCAL_BLENDER", "EXTERNAL_BLENDER"]) { const request = createBackendRequest(job, backend); assert.equal(request.contractVersion, WORKER_CONTRACT_VERSION); assert.equal(request.backend, backend); assert.equal(request.workerTrust, "UNTRUSTED_EXECUTION_ONLY"); }
});

test("accepts a completed result only with matching job, recipe, reference, modules, camera, protection, budgets and one iteration", () => {
  const job = fixtureJob(); const result = fixtureResult(job); const accepted = validateWorkerResult(result, job);
  assert.equal(accepted.ok, true); assert.equal(accepted.trusted, false); assert.equal(accepted.requiresLocalValidation, true);
});

test("rejects wrong job, asset, recipe, reference, source, camera, module, protection, budget and result status", () => {
  const job = fixtureJob();
  const cases = [
    ["jobId", "WORKER_JOB_MISMATCH"], ["assetId", "WORKER_IDENTITY_MISMATCH"], ["recipeId", "WORKER_IDENTITY_MISMATCH"],
    ["goldenReference", "WORKER_REFERENCE_MISMATCH"], ["sourceChecksum", "WORKER_SOURCE_CHECKSUM_MISMATCH"], ["executableIdentity", "WORKER_BUILD_MISMATCH"], ["cameraValidation", "WORKER_CAMERA_MISMATCH"],
    ["modules", "WORKER_MODULE_IDENTITY_MISMATCH"], ["protectedObjectValidation", "WORKER_PROTECTED_COMPONENT_FAILURE"], ["budget", "WORKER_BUDGET_METADATA_MISSING"], ["status", "WORKER_RESULT_NOT_COMPLETED"],
  ];
  for (const [field, code] of cases) { const result = fixtureResult(job); if (field === "goldenReference") result[field].checksum = "tampered"; else if (field === "modules") result[field][0].moduleId = "tampered"; else if (field === "protectedObjectValidation") result[field].allStable = false; else if (field === "budget") delete result[field].triangles; else if (field === "cameraValidation") result[field] = { id: "tampered" }; else if (field === "executableIdentity") result[field].buildId = "tampered"; else result[field] = field === "status" ? "FAILED" : "tampered"; expectCode(() => validateWorkerResult(result, job), code); }
});

test("rejects missing render metadata and invalid one-iteration results", () => {
  const job = fixtureJob(); const result = fixtureResult(job); delete result.render; expectCode(() => validateWorkerResult(result, job), "WORKER_RENDER_METADATA_MISSING");
  const second = fixtureResult(job); second.iteration = 2; expectCode(() => validateWorkerResult(second, job), "ONE_ITERATION_RULE_VIOLATION");
  const notStopped = fixtureResult(job); notStopped.oneIterationStop = false; expectCode(() => assertOneIteration(notStopped), "ONE_ITERATION_RULE_VIOLATION");
});

test("hands a real RGBA render artifact to the existing local raster analyzer", () => {
  const result = fixtureResult(fixtureJob()); const handoff = validateWorkerRenderLocally(result, referencePath);
  assert.equal(handoff.ok, true); assert.equal(handoff.workerUntrusted, true); assert.equal(handoff.rasterAnalysis.ok, true); assert.equal(handoff.rasterAnalysis.r.w, 32); assert.equal(handoff.rasterAnalysis.r.h, 32); assert.equal(handoff.rasterAnalysis.b.w, 32);
});

test("keeps Golden Reference identity local and immutable", () => {
  const before = fileChecksum(referencePath); const job = fixtureJob(); const result = fixtureResult(job); result.goldenReference.checksum = "attempted-worker-mutation";
  expectCode(() => validateWorkerResult(result, job), "WORKER_REFERENCE_MISMATCH"); assert.equal(fileChecksum(referencePath), before);
});
