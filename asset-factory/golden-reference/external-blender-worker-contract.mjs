import fs from "node:fs";
import { createHash } from "node:crypto";
import { analyseRaster } from "./golden-reference-raster-analysis.mjs";

export const WORKER_CONTRACT_VERSION = "GG-BLENDER-WORKER-CONTRACT-1.0.0";
export const WORKER_BACKENDS = Object.freeze(["LOCAL_BLENDER", "EXTERNAL_BLENDER"]);
export const WORKER_RESULT_STATUSES = Object.freeze(["COMPLETED", "REJECTED", "FAILED"]);
export const WORKER_OPERATION_ALLOWLIST = Object.freeze(["SCALE_X", "SCALE_Y", "SCALE_Z", "MOVE_X", "MOVE_Y", "MOVE_Z", "ROTATE"]);

export class WorkerContractError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = "WorkerContractError"; this.code = code; this.details = details; }
}
const fail = (code, message, details) => { throw new WorkerContractError(code, message, details); };
const clone = value => structuredClone(value);
const isObject = value => value && typeof value === "object" && !Array.isArray(value);
const required = (value, name) => { if (value == null || value === "") fail(`MISSING_${name.toUpperCase()}`, `${name} is required`); };
const canonicalize = value => Array.isArray(value) ? value.map(canonicalize) : isObject(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])])) : value;
export const canonicalJson = value => JSON.stringify(canonicalize(value));
export const sha256 = value => createHash("sha256").update(Buffer.isBuffer(value) ? value : typeof value === "string" ? value : canonicalJson(value)).digest("hex");
export const fileChecksum = file => sha256(fs.readFileSync(file));

function validateIdentity(identity, label = "identity") {
  if (!isObject(identity)) fail(`INVALID_${label.toUpperCase()}`, `${label} must be an object`);
  for (const field of ["assetId", "assetVersion", "recipeId", "recipeVersion"]) required(identity[field], `${label}.${field}`);
}

function validateOperation(operation) {
  if (!isObject(operation) || !WORKER_OPERATION_ALLOWLIST.includes(operation.operation)) fail("FORBIDDEN_WORKER_OPERATION", "Worker operation is outside the constrained allowlist");
  required(operation.componentId, "operation.componentId"); required(operation.objectId, "operation.objectId");
  if (!Number.isFinite(operation.value)) fail("INVALID_WORKER_OPERATION_VALUE", "Worker operation value must be numeric");
  if (operation.moduleId) required(operation.moduleVersion, "operation.moduleVersion");
}

export function createWorkerJob(input) {
  if (!isObject(input)) fail("INVALID_WORKER_JOB", "Worker job must be an object");
  for (const field of ["jobId", "assetId", "assetVersion", "recipeId", "recipeVersion", "blenderBuildId", "goldenReference", "componentMappings", "modules", "protectedComponents", "budgetProfile", "cameraContract", "renderContract", "exportContract"]) required(input[field], `job.${field}`);
  validateIdentity({ assetId: input.assetId, assetVersion: input.assetVersion, recipeId: input.recipeId, recipeVersion: input.recipeVersion }, "job");
  if (!WORKER_BACKENDS.includes(input.backend ?? "EXTERNAL_BLENDER")) fail("INVALID_WORKER_BACKEND", "Unknown worker backend");
  if (!Array.isArray(input.operations)) fail("INVALID_WORKER_OPERATIONS", "operations must be an array");
  input.operations.forEach(validateOperation);
  if (!Array.isArray(input.modules) || input.modules.some(module => !module.assetId || !module.assetVersion || !module.componentId || !module.moduleFamily)) fail("INVALID_MODULE_IDENTITY", "Every job module requires round-trip identity metadata");
  if (!input.checksums || !isObject(input.checksums)) fail("MISSING_INPUT_CHECKSUMS", "Input checksums are required");
  return clone({ ...input, contractVersion: WORKER_CONTRACT_VERSION, backend: input.backend ?? "EXTERNAL_BLENDER", deterministic: true, untrustedWorker: true, generatedJobChecksum: sha256({ ...input, contractVersion: WORKER_CONTRACT_VERSION, backend: input.backend ?? "EXTERNAL_BLENDER" }) });
}

export function serializeWorkerJob(job) {
  const normalized = createWorkerJob(job);
  return `${canonicalJson(normalized)}\n`;
}

export function validateWorkerResult(result, job, { requireRender = true } = {}) {
  if (!isObject(result)) fail("INVALID_WORKER_RESULT", "Worker result must be an object");
  required(result.jobId, "result.jobId");
  if (result.jobId !== job.jobId) fail("WORKER_JOB_MISMATCH", "Worker result jobId does not match submitted job");
  if (result.status !== "COMPLETED") fail("WORKER_RESULT_NOT_COMPLETED", "Worker result is not completed", { status: result.status });
  validateIdentity({ assetId: result.assetId, assetVersion: result.assetVersion, recipeId: result.recipeId, recipeVersion: result.recipeVersion }, "result");
  for (const field of ["assetId", "assetVersion", "recipeId", "recipeVersion"]) if (result[field] !== job[field]) fail("WORKER_IDENTITY_MISMATCH", `Worker result ${field} does not match job`);
  if (result.executableIdentity?.buildId !== job.blenderBuildId) fail("WORKER_BUILD_MISMATCH", "Worker Blender build identity does not match job");
  if (result.goldenReference?.referenceId !== job.goldenReference.referenceId || result.goldenReference?.referenceVersion !== job.goldenReference.referenceVersion || result.goldenReference?.checksum !== job.goldenReference.checksum) fail("WORKER_REFERENCE_MISMATCH", "Worker result Golden Reference identity/checksum does not match local job");
  if (result.sourceChecksum !== job.checksums.sourceBuild) fail("WORKER_SOURCE_CHECKSUM_MISMATCH", "Worker source checksum does not match job");
  if (JSON.stringify(result.cameraValidation) !== JSON.stringify(job.cameraContract)) fail("WORKER_CAMERA_MISMATCH", "Worker camera contract does not match job");
  if (!Array.isArray(result.modules) || result.modules.length !== job.modules.length) fail("WORKER_MODULE_IDENTITY_MISMATCH", "Worker module identity set is incomplete");
  for (const module of job.modules) {
    const returned = result.modules.find(candidate => candidate.componentId === module.componentId);
    if (!returned || returned.assetId !== module.assetId || returned.assetVersion !== module.assetVersion || returned.moduleId !== module.moduleId || returned.moduleVersion !== module.moduleVersion || returned.moduleFamily !== module.moduleFamily || returned.recipeId !== job.recipeId || returned.recipeVersion !== job.recipeVersion) fail("WORKER_MODULE_IDENTITY_MISMATCH", "Worker changed or omitted module identity", { componentId: module.componentId });
  }
  if (!result.protectedObjectValidation || result.protectedObjectValidation.allStable !== true) fail("WORKER_PROTECTED_COMPONENT_FAILURE", "Protected object verification did not pass");
  if (!result.budget || !Number.isFinite(result.budget.triangles) || !Number.isFinite(result.budget.vertices) || !Number.isFinite(result.budget.materials) || !Number.isFinite(result.budget.objectCount)) fail("WORKER_BUDGET_METADATA_MISSING", "Worker budget metadata is incomplete");
  if (requireRender && (!result.render || !result.render.path || !result.render.checksum || result.render.format !== "PNG" || result.render.colorMode !== "RGBA")) fail("WORKER_RENDER_METADATA_MISSING", "Worker render metadata must identify a PNG RGBA artifact");
  assertOneIteration(result);
  return { ok: true, trusted: false, requiresLocalValidation: true, jobId: result.jobId, result: clone(result) };
}

export function validateWorkerRenderLocally(result, referencePath) {
  if (!result?.render?.path || !fs.existsSync(result.render.path)) fail("WORKER_RENDER_MISSING", "Worker render artifact is missing");
  const actualChecksum = fileChecksum(result.render.path);
  if (actualChecksum !== result.render.checksum) fail("WORKER_RENDER_CHECKSUM_MISMATCH", "Worker render checksum does not match artifact");
  if (!referencePath || !fs.existsSync(referencePath)) fail("LOCAL_REFERENCE_MISSING", "Local Golden Reference is required for raster validation");
  const analysis = analyseRaster(referencePath, result.render.path);
  if (!analysis.ok) fail("WORKER_RENDER_RASTER_REJECTED", "Worker render failed local raster analysis", analysis);
  return { ok: true, workerUntrusted: true, rasterAnalysis: analysis };
}

export function createBackendRequest(job, backend = job.backend ?? "EXTERNAL_BLENDER") {
  if (!WORKER_BACKENDS.includes(backend)) fail("INVALID_WORKER_BACKEND", "Unknown worker backend");
  return Object.freeze({ contractVersion: WORKER_CONTRACT_VERSION, backend, job: createWorkerJob({ ...job, backend }), localAuthority: "GROWGO_ASSET_FACTORY", workerTrust: "UNTRUSTED_EXECUTION_ONLY" });
}

export function assertOneIteration(result) {
  if (result?.oneIterationStop !== true || result?.iteration !== 1) fail("ONE_ITERATION_RULE_VIOLATION", "Worker result must preserve the one-iteration stop rule");
  return true;
}
