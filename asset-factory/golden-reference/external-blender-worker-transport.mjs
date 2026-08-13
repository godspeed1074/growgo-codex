import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  WORKER_CONTRACT_VERSION,
  canonicalJson,
  fileChecksum,
  validateWorkerResult,
  validateWorkerRenderLocally,
  WorkerContractError,
} from "./external-blender-worker-contract.mjs";
import { rasterizeComponents } from "./golden-reference-component-rasterization.mjs";
import { compareReference } from "./golden-reference-comparison-engine.mjs";

export const TRANSPORT_VERSION = "GG-BLENDER-WORKER-TRANSPORT-1.0.0";
export const TRANSPORT_TYPES = Object.freeze(["LOCAL_FOLDER", "SHARED_FOLDER", "SSH_SFTP", "CLOUD_OBJECT_STORAGE"]);
export const TRANSPORT_STATES = Object.freeze(["CREATED", "READY_TO_DISPATCH", "DISPATCHED", "RECEIVED", "VALIDATING", "ACCEPTED", "REJECTED", "EXPIRED", "FAILED"]);
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value)).digest("hex");
const clone = value => structuredClone(value);
const fail = (code, message, details = {}) => { throw new WorkerContractError(code, message, details); };
const required = (value, name) => { if (value == null || value === "") fail("TRANSPORT_PACKAGE_INVALID", `${name} is required`); };

function transition(history, state, at) {
  if (!TRANSPORT_STATES.includes(state)) fail("TRANSPORT_PACKAGE_INVALID", `Unknown transport state: ${state}`);
  history.push({ state, at });
}

function manifestEntries(artifacts = []) {
  return artifacts.map((artifact, index) => {
    required(artifact.logicalId, `artifacts[${index}].logicalId`); required(artifact.filename, `artifacts[${index}].filename`); required(artifact.sourcePath, `artifacts[${index}].sourcePath`);
    if (artifact.artifactType === "EXECUTABLE" || artifact.artifactType === "PYTHON_SCRIPT") fail("TRANSPORT_PACKAGE_INVALID", "Executable authority is not transportable");
    if (!fs.existsSync(artifact.sourcePath)) fail("WORKER_ARTIFACT_MISSING", `Artifact does not exist: ${artifact.sourcePath}`);
    const stat = fs.statSync(artifact.sourcePath); if (!stat.isFile()) fail("WORKER_ARTIFACT_MISSING", `Artifact is not a file: ${artifact.sourcePath}`);
    return { logicalId: artifact.logicalId, filename: artifact.filename, checksum: fileChecksum(artifact.sourcePath), byteSize: stat.size, required: artifact.required !== false, artifactType: artifact.artifactType ?? "DATA" };
  }).sort((a, b) => a.logicalId.localeCompare(b.logicalId));
}

export function createArtifactManifest({ artifacts = [] } = {}) {
  const entries = manifestEntries(artifacts);
  return { transportVersion: TRANSPORT_VERSION, artifacts: entries, artifactCount: entries.length, byteCount: entries.reduce((sum, item) => sum + item.byteSize, 0), manifestChecksum: sha256(entries) };
}

export function createTransportPackage({ job, artifacts = [], transportJobId, sourceBuildId, createdAt, expiresAt = null, sourceEnvironment = "GROWGO_CONTROLLED_FIXTURE", packageRoot }) {
  required(job?.jobId, "job.jobId"); required(transportJobId, "transportJobId"); required(sourceBuildId, "sourceBuildId"); required(createdAt, "createdAt"); required(packageRoot, "packageRoot");
  if (job.contractVersion !== WORKER_CONTRACT_VERSION) fail("TRANSPORT_PACKAGE_INVALID", "Worker contract version mismatch");
  const manifest = createArtifactManifest({ artifacts: [{ logicalId: "BLENDER_WORKER_JOB", filename: "BLENDER_WORKER_JOB.json", sourcePath: artifacts.jobPath, artifactType: "JSON", required: true }, ...artifacts.items ?? []] });
  const envelopeCore = { transportVersion: TRANSPORT_VERSION, transportJobId, workerJobId: job.jobId, assetId: job.assetId, assetVersion: job.assetVersion, recipeId: job.recipeId, recipeVersion: job.recipeVersion, sourceBuildId, createdAt, ...(expiresAt ? { expiresAt } : {}), sourceEnvironment, backend: "EXTERNAL_BLENDER", workerContractVersion: job.contractVersion, packageChecksum: null, artifactCount: manifest.artifactCount, expectedResultContractVersion: WORKER_CONTRACT_VERSION };
  const packageChecksum = sha256({ envelope: envelopeCore, manifest });
  const envelope = { ...envelopeCore, packageChecksum };
  const root = path.resolve(packageRoot); fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
  fs.copyFileSync(artifacts.jobPath, path.join(root, "BLENDER_WORKER_JOB.json"));
  for (const item of manifest.artifacts.filter(item => item.logicalId !== "BLENDER_WORKER_JOB")) { const source = [...(artifacts.items ?? [])].find(x => x.logicalId === item.logicalId)?.sourcePath; fs.copyFileSync(source, path.join(root, "artifacts", item.filename)); }
  fs.writeFileSync(path.join(root, "ARTIFACT_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`); fs.writeFileSync(path.join(root, "JOB_ENVELOPE.json"), `${JSON.stringify(envelope, null, 2)}\n`);
  return { root, envelope, manifest, packageChecksum, status: "READY_TO_DISPATCH", statusHistory: [{ state: "CREATED", at: createdAt }, { state: "READY_TO_DISPATCH", at: createdAt }] };
}

export function dispatchLocalFolder(pkg, destinationRoot, { dispatchedAt = new Date().toISOString(), destinationId = "LOCAL_FOLDER" } = {}) {
  required(pkg?.root, "package.root"); required(destinationRoot, "destinationRoot");
  try { validateManifest(pkg.root, pkg.manifest); } catch (error) { if (error instanceof WorkerContractError) fail("TRANSPORT_CHECKSUM_MISMATCH", error.message, { cause: error.code }); throw error; }
  const destination = path.join(path.resolve(destinationRoot), pkg.envelope.transportJobId); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.cpSync(pkg.root, destination, { recursive: true });
  const receipt = { transportVersion: TRANSPORT_VERSION, transportJobId: pkg.envelope.transportJobId, workerJobId: pkg.envelope.workerJobId, packageChecksum: pkg.packageChecksum, transportType: "LOCAL_FOLDER", destinationId, dispatchedAt, artifactCount: pkg.manifest.artifactCount, byteCount: pkg.manifest.byteCount, status: "DISPATCHED" };
  fs.writeFileSync(path.join(destination, "DISPATCH_RECEIPT.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  return { ...pkg, root: destination, status: "DISPATCHED", statusHistory: [...pkg.statusHistory, { state: "DISPATCHED", at: dispatchedAt }], dispatchReceipt: receipt };
}

function validateManifest(root, manifest, { result = false } = {}) {
  if (!manifest?.artifacts || manifest.manifestChecksum !== sha256(manifest.artifacts)) fail("TRANSPORT_PACKAGE_INVALID", "Artifact manifest checksum is invalid");
  for (const item of manifest.artifacts.filter(entry => entry.required)) { const rootFile = result && item.logicalId === "BLENDER_WORKER_RESULT" ? item.filename : item.logicalId === "BLENDER_WORKER_JOB" ? "BLENDER_WORKER_JOB.json" : null; const file = rootFile ? path.join(root, rootFile) : path.join(root, "artifacts", item.filename); if (!fs.existsSync(file)) fail("WORKER_ARTIFACT_MISSING", item.logicalId); if (fileChecksum(file) !== item.checksum) fail("WORKER_ARTIFACT_CHECKSUM_FAIL", item.logicalId); }
  return true;
}

export function createWorkerResultReceipt({ transportPackage, resultRoot, result, receivedAt = new Date().toISOString(), referencePath, comparisonInput = null, componentInput = null }) {
  const envelope = transportPackage.envelope; if (!resultRoot || !fs.existsSync(resultRoot)) fail("WORKER_RESULT_MISSING", "Result package is missing");
  const resultFile = path.join(resultRoot, "BLENDER_WORKER_RESULT.json"); const returnedManifestFile = path.join(resultRoot, "ARTIFACT_MANIFEST.json");
  if (!fs.existsSync(resultFile)) fail("WORKER_RESULT_MISSING", "BLENDER_WORKER_RESULT.json is missing"); if (!fs.existsSync(returnedManifestFile)) fail("WORKER_ARTIFACT_MISSING", "Returned artifact manifest is missing");
  const returnedManifest = JSON.parse(fs.readFileSync(returnedManifestFile, "utf8")); validateManifest(resultRoot, returnedManifest, { result: true });
  const actualResult = result ?? JSON.parse(fs.readFileSync(resultFile, "utf8"));
  if (actualResult.transportJobId && actualResult.transportJobId !== envelope.transportJobId) fail("WORKER_JOB_ID_MISMATCH", "Result transportJobId mismatch");
  if (actualResult.jobId !== envelope.workerJobId) fail("WORKER_JOB_ID_MISMATCH", "Result workerJobId mismatch");
  if (actualResult.assetId !== envelope.assetId) fail("WORKER_ASSET_ID_MISMATCH", "Result assetId mismatch"); if (actualResult.recipeId !== envelope.recipeId) fail("WORKER_RECIPE_ID_MISMATCH", "Result recipeId mismatch");
  const job = JSON.parse(fs.readFileSync(path.join(transportPackage.root, "BLENDER_WORKER_JOB.json"), "utf8"));
  if (job.checksums?.sourceBuild !== transportPackage.envelope.sourceBuildId) fail("WORKER_SOURCE_BUILD_MISMATCH", "Source build identity mismatch");
  const local = validateWorkerResult(actualResult, job); const render = validateWorkerRenderLocally(actualResult, path.resolve(referencePath));
  let raster = { analysis: render.rasterAnalysis }; if (componentInput) raster.components = rasterizeComponents(render.rasterAnalysis, componentInput.componentMap, componentInput.actualComponents); if (comparisonInput) raster.comparison = compareReference({ ...comparisonInput, referencePath, renderPath: actualResult.render.path, silhouetteIoU: render.rasterAnalysis.metrics.iou });
  return { transportVersion: TRANSPORT_VERSION, transportJobId: envelope.transportJobId, workerJobId: envelope.workerJobId, receivedAt, status: "ACCEPTED", statusHistory: [{ state: "RECEIVED", at: receivedAt }, { state: "VALIDATING", at: receivedAt }, { state: "ACCEPTED", at: receivedAt }], trusted: false, localValidation: local, raster, resultChecksum: fileChecksum(resultFile), duplicate: false };
}

export function receiveWorkerResult({ transportPackage, resultRoot, referencePath, comparisonInput, componentInput, receivedAt }) {
  const receiptPath = path.join(resultRoot, "WORKER_RESULT_RECEIPT.json"); if (fs.existsSync(receiptPath)) return { ...JSON.parse(fs.readFileSync(receiptPath, "utf8")), duplicate: true };
  if (transportPackage.envelope.expiresAt && new Date(receivedAt ?? Date.now()) > new Date(transportPackage.envelope.expiresAt)) fail("TRANSPORT_JOB_EXPIRED", "Worker job expired");
  const receipt = createWorkerResultReceipt({ transportPackage, resultRoot, referencePath, comparisonInput, componentInput, receivedAt }); fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`); return receipt;
}
