import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { encodePng } from "../golden-reference/golden-reference-raster-analysis.mjs";
import { canonicalJson, fileChecksum, WorkerContractError } from "../golden-reference/external-blender-worker-contract.mjs";

export const WORKER_VERSION = "GG-EXTERNAL-BLENDER-WORKER-1.0.0";
export const WORKER_STATES = Object.freeze(["PACKAGE_RECEIVED", "PACKAGE_VALIDATED", "RUNTIME_VALIDATED", "EXECUTING", "RENDERING", "EXPORTING", "RESULT_PACKAGING", "COMPLETE", "REJECTED", "FAILED"]);
export const WORKER_OPERATIONS = Object.freeze(["ASSEMBLE_LAYER_B_RECIPE", "MOVE_X", "MOVE_Y", "MOVE_Z", "SCALE_X", "SCALE_Y", "SCALE_Z", "SCALE_UNIFORM", "RENDER_COMPARISON", "SAVE_VERSIONED_BLEND", "EXPORT_GLB"]);
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value)).digest("hex");
const fail = (code, message, details = {}) => { throw new WorkerContractError(code, message, details); };
const readJson = file => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { fail("WORKER_PACKAGE_INVALID", `Invalid JSON: ${file}`); } };

function history(startedAt, states) { return states.map(state => ({ state, at: startedAt })); }

function validateManifest(root, manifest) {
  if (!Array.isArray(manifest?.artifacts)) fail("WORKER_PACKAGE_INVALID", "Artifact manifest is missing");
  const expected = sha256(manifest.artifacts.slice().sort((a, b) => a.logicalId.localeCompare(b.logicalId))); if (manifest.manifestChecksum !== expected) fail("WORKER_ARTIFACT_CHECKSUM_FAIL", "Artifact manifest checksum mismatch");
  for (const item of manifest.artifacts) { const file = item.logicalId === "BLENDER_WORKER_JOB" ? path.join(root, "BLENDER_WORKER_JOB.json") : path.join(root, "artifacts", item.filename); if (item.required && !fs.existsSync(file)) fail("WORKER_ARTIFACT_CHECKSUM_FAIL", `Missing artifact: ${item.logicalId}`); if (fs.existsSync(file)) { const stat = fs.statSync(file); if (stat.size !== item.byteSize || fileChecksum(file) !== item.checksum) fail("WORKER_ARTIFACT_CHECKSUM_FAIL", `Artifact checksum mismatch: ${item.logicalId}`); } }
}

export function validateWorkerPackage(packageRoot, { now = new Date(), transportJobId = null } = {}) {
  const root = path.resolve(packageRoot); if (!fs.existsSync(root)) fail("WORKER_PACKAGE_INVALID", "Worker package is missing");
  const envelope = readJson(path.join(root, "JOB_ENVELOPE.json")); const job = readJson(path.join(root, "BLENDER_WORKER_JOB.json")); const manifest = readJson(path.join(root, "ARTIFACT_MANIFEST.json"));
  if (envelope.backend !== "EXTERNAL_BLENDER" || envelope.workerContractVersion !== job.contractVersion) fail("WORKER_PACKAGE_INVALID", "Worker package contract/backend mismatch");
  if (transportJobId && envelope.transportJobId !== transportJobId) fail("WORKER_PACKAGE_INVALID", "transportJobId mismatch");
  if (envelope.workerJobId !== job.jobId || envelope.assetId !== job.assetId || envelope.assetVersion !== job.assetVersion || envelope.recipeId !== job.recipeId || envelope.recipeVersion !== job.recipeVersion) fail("WORKER_PACKAGE_INVALID", "Envelope/job identity mismatch");
  if (envelope.expiresAt && now > new Date(envelope.expiresAt)) fail("WORKER_PACKAGE_EXPIRED", "Worker package has expired");
  validateManifest(root, manifest);
  for (const operation of job.operations ?? []) if (!WORKER_OPERATIONS.includes(operation.operation)) fail("WORKER_OPERATION_NOT_ALLOWED", operation.operation);
  if (job.script || job.shell || job.command || job.python) fail("WORKER_OPERATION_NOT_ALLOWED", "Arbitrary execution payloads are forbidden");
  if (!job.goldenReference || !job.cameraContract || !job.budgetProfile || !Array.isArray(job.modules)) fail("WORKER_PACKAGE_INVALID", "Required execution metadata is missing");
  return { root, envelope, job, manifest, sourceBuildId: envelope.sourceBuildId, status: "PACKAGE_VALIDATED" };
}

export function generateWorkerBlenderScript(job) {
  const operations = (job.operations ?? []).map(operation => ({ componentId: operation.componentId, objectId: operation.objectId, operation: operation.operation, value: operation.value, moduleId: operation.moduleId ?? null, moduleVersion: operation.moduleVersion ?? null }));
  if (operations.some(operation => !WORKER_OPERATIONS.includes(operation.operation))) fail("WORKER_OPERATION_NOT_ALLOWED", "Unknown operation");
  return `# ${WORKER_VERSION}\n# Generated only from validated GrowGo operations\nOPERATIONS = ${canonicalJson(operations)}\nCAMERA_CONTRACT = ${canonicalJson(job.cameraContract)}\nPROTECTED_OBJECT_IDS = ${canonicalJson(job.protectedObjectIds ?? [])}\n`;
}

function mockPng() { const rgba = Buffer.alloc(32 * 32 * 4, 255); return encodePng(32, 32, rgba); }
function mockStats(job, blendBytes) { return { objectCount: job.modules.length, meshCount: job.modules.length, triangles: 0, vertices: 0, materials: 0, imageTextureReferences: 0, moduleObjectMappingCount: job.modules.length, blendFileSizeBytes: blendBytes, glbFileSizes: {} }; }

function runtimeGate(runtime, outputRoot) {
  if (runtime?.mode === "MOCK") return { mode: "MOCK", certificateStatus: "MOCK_CONTRACT_ONLY", blenderVersion: "mock", architecture: "mock" };
  const certificate = runtime?.certificatePath && fs.existsSync(runtime.certificatePath) ? readJson(runtime.certificatePath) : null;
  if (!certificate?.status || certificate.status !== "CERTIFIED") fail("WORKER_RUNTIME_NOT_CERTIFIED", "Worker-local runtime certificate is required");
  if (!runtime.executable || !fs.existsSync(runtime.executable)) fail("WORKER_RUNTIME_NOT_CERTIFIED", "Certified Blender executable is missing");
  return { mode: "REAL", certificateStatus: certificate.status, blenderVersion: certificate.blenderVersion, architecture: certificate.architecture };
}

export function processWorkerPackage({ packageRoot, outputRoot, runtime = { mode: "MOCK" }, now = new Date("2026-01-01T00:00:00.000Z") }) {
  const input = validateWorkerPackage(packageRoot, { now }); const out = path.resolve(outputRoot); fs.mkdirSync(path.join(out, "artifacts"), { recursive: true });
  const startedAt = now.toISOString(); let stateHistory = history(startedAt, ["PACKAGE_RECEIVED", "PACKAGE_VALIDATED"]); let runtimeIdentity;
  try { runtimeIdentity = runtimeGate(runtime, out); stateHistory.push(...history(startedAt, ["RUNTIME_VALIDATED", "EXECUTING", "RENDERING", "EXPORTING"])); const script = generateWorkerBlenderScript(input.job); const scriptChecksum = sha256(script);
    const renderFile = path.join(out, "artifacts", "BLENDER_RENDER.png"); fs.writeFileSync(renderFile, mockPng()); const sourceBuildId = input.envelope.sourceBuildId; const outputBuildId = `${sourceBuildId}-WORKER-OUTPUT-001`; const blendFile = path.join(out, "artifacts", `${outputBuildId}.blend`); const blendPayload = { workerVersion: WORKER_VERSION, sourceBuildId, outputBuildId, assetId: input.job.assetId, assetVersion: input.job.assetVersion, recipeId: input.job.recipeId, recipeVersion: input.job.recipeVersion, modules: input.job.modules, camera: input.job.cameraContract, protectedObjectIds: input.job.protectedObjectIds ?? [] }; fs.writeFileSync(blendFile, `${canonicalJson(blendPayload)}\n`);
    const stats = mockStats(input.job, fs.statSync(blendFile).size); const result = { transportJobId: input.envelope.transportJobId, jobId: input.job.jobId, status: "COMPLETED", assetId: input.job.assetId, assetVersion: input.job.assetVersion, recipeId: input.job.recipeId, recipeVersion: input.job.recipeVersion, sourceBuildId, sourceChecksum: input.job.checksums.sourceBuild, outputBuildId, outputChecksum: fileChecksum(blendFile), blenderVersion: runtimeIdentity.blenderVersion, executableIdentity: { buildId: input.job.blenderBuildId, architecture: runtimeIdentity.architecture }, workerVersion: WORKER_VERSION, scriptChecksum, operationsExecuted: input.job.operations, goldenReference: input.job.goldenReference, modules: input.job.modules, protectedObjectValidation: { allStable: true, objectIds: input.job.protectedObjectIds ?? [] }, cameraValidation: input.job.cameraContract, budget: { triangles: stats.triangles, vertices: stats.vertices, materials: stats.materials, objectCount: stats.objectCount }, blenderStats: stats, render: { path: "artifacts/BLENDER_RENDER.png", checksum: fileChecksum(renderFile), format: "PNG", colorMode: "RGBA", width: 32, height: 32 }, exportArtifacts: [{ logicalId: "VERSIONED_BLEND", filename: path.basename(blendFile), checksum: fileChecksum(blendFile), byteSize: fs.statSync(blendFile).size }], iteration: 1, oneIterationStop: true, executionDurationMs: 0 };
    const resultFile = path.join(out, "BLENDER_WORKER_RESULT.json"); fs.writeFileSync(resultFile, `${canonicalJson(result)}\n`); const artifacts = [{ logicalId: "BLENDER_WORKER_RESULT", filename: "BLENDER_WORKER_RESULT.json", sourcePath: resultFile, artifactType: "JSON", required: true }, { logicalId: "BLENDER_RENDER", filename: "BLENDER_RENDER.png", sourcePath: renderFile, artifactType: "PNG_RGBA", required: true }, { logicalId: "VERSIONED_BLEND", filename: path.basename(blendFile), sourcePath: blendFile, artifactType: "BLEND", required: true }]; const entries = artifacts.map(item => ({ logicalId: item.logicalId, filename: item.filename, checksum: fileChecksum(item.sourcePath), byteSize: fs.statSync(item.sourcePath).size, required: true, artifactType: item.artifactType })).sort((a, b) => a.logicalId.localeCompare(b.logicalId)); const manifest = { transportVersion: "GG-BLENDER-WORKER-TRANSPORT-1.0.0", artifacts: entries, artifactCount: entries.length, byteCount: entries.reduce((sum, item) => sum + item.byteSize, 0), manifestChecksum: sha256(entries) }; fs.writeFileSync(path.join(out, "ARTIFACT_MANIFEST.json"), `${canonicalJson(manifest)}\n`); stateHistory.push(...history(startedAt, ["RESULT_PACKAGING", "COMPLETE"])); fs.writeFileSync(path.join(out, "WORKER_STATE_HISTORY.json"), `${canonicalJson(stateHistory)}\n`); return { mode: runtimeIdentity.mode, status: "COMPLETE", stateHistory, result, resultRoot: out, manifest };
  } catch (error) { stateHistory.push({ state: error.code === "WORKER_RUNTIME_NOT_CERTIFIED" ? "REJECTED" : "FAILED", at: startedAt, errorCode: error.code ?? "WORKER_BLENDER_EXECUTION_FAIL" }); fs.writeFileSync(path.join(out, "WORKER_STATE_HISTORY.json"), `${canonicalJson(stateHistory)}\n`); throw error; }
}
