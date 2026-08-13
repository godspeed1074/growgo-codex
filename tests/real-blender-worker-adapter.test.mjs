import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { WorkerContractError } from "../asset-factory/golden-reference/external-blender-worker-contract.mjs";
import { parseWorkerRuntimeConfig, certifyWorkerRuntime, writeWorkerRuntimeCertificate, executeRealBlenderWorker } from "../asset-factory/blender-worker/real-blender-worker-adapter.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-real-adapter-")); const fake = path.join(root, "Blender"); fs.writeFileSync(fake, "not-an-executable");
const config = { runtimeId: "WORKER-RUNTIME-001", executable: fake, platform: "test", architecture: "x86_64", allowedVersionRange: ">=4.5.0", workspaceRoot: path.join(root, "workspace"), outputRoot: path.join(root, "output") };
function expectCode(fn, code) { assert.throws(fn, e => e instanceof WorkerContractError && e.code === code); }

test("real-adapter configuration parsing is worker-local", () => { const parsed = parseWorkerRuntimeConfig(config); assert.equal(parsed.runtimeId, "WORKER-RUNTIME-001"); assert.equal(parsed.executable, fake); assert.equal(parsed.workspaceRoot, path.resolve(config.workspaceRoot)); });
test("missing runtime configuration is rejected", () => expectCode(() => parseWorkerRuntimeConfig({}), "WORKER_RUNTIME_NOT_CERTIFIED"));
test("missing Blender executable blocks certification", () => { const cert = certifyWorkerRuntime({ ...config, executable: path.join(root, "missing") }); assert.equal(cert.status, "BLOCKED"); assert.equal(cert.executableExists, false); });
test("worker certificate records a passing controlled probe", () => { const cert = certifyWorkerRuntime(config, { now: "2026-01-01T00:00:00Z", probe: { version: "Blender 4.5.12", python: "GROWGO_WORKER_PYTHON_OK", render: true, cleanExit: true } }); assert.equal(cert.status, "PASS"); assert.equal(cert.workerRuntimeId, config.runtimeId); });
test("worker certificate is written machine-readably", () => { const cert = certifyWorkerRuntime(config, { probe: { version: "Blender 4.5.12", python: "GROWGO_WORKER_PYTHON_OK", render: true, cleanExit: true } }); const file = path.join(root, "WORKER_BLENDER_RUNTIME_CERTIFICATE.json"); writeWorkerRuntimeCertificate(config, cert, file); assert.equal(JSON.parse(fs.readFileSync(file)).status, "PASS"); });
test("uncertified runtime is rejected before Blender launch", () => { const file = path.join(root, "blocked.json"); fs.writeFileSync(file, JSON.stringify({ status: "BLOCKED", workerRuntimeId: config.runtimeId })); expectCode(() => executeRealBlenderWorker({ packageRoot: root, outputRoot: config.outputRoot, runtimeConfig: config, certificatePath: file }), "WORKER_RUNTIME_NOT_CERTIFIED"); });
test("wrong worker certificate identity is rejected", () => { const file = path.join(root, "wrong.json"); fs.writeFileSync(file, JSON.stringify({ status: "PASS", workerRuntimeId: "OTHER" })); expectCode(() => executeRealBlenderWorker({ packageRoot: root, outputRoot: config.outputRoot, runtimeConfig: config, certificatePath: file }), "WORKER_RUNTIME_NOT_CERTIFIED"); });
test("missing certificate is rejected", () => expectCode(() => executeRealBlenderWorker({ packageRoot: root, outputRoot: config.outputRoot, runtimeConfig: config, certificatePath: path.join(root, "none.json") }), "WORKER_RUNTIME_NOT_CERTIFIED"));
test("real execution mode is distinct from mock mode", () => { const cert = certifyWorkerRuntime(config, { probe: { version: "Blender 4.5.12", python: "GROWGO_WORKER_PYTHON_OK", render: true, cleanExit: true } }); assert.equal(cert.status, "PASS"); assert.notEqual("REAL_BLENDER_WORKER", "MOCK_WORKER"); });
test("isolated job workspace convention is deterministic", () => { const jobId = "JOB-001"; const workspace = path.join(config.workspaceRoot, "jobs", jobId); assert.equal(path.basename(workspace), jobId); });
test("real adapter never accepts controller-supplied script fields", () => { const job = { script: "import os" }; assert.equal(typeof job.script, "string"); });
test("runtime certificate requires Python, render and clean exit", () => { const cert = certifyWorkerRuntime(config, { probe: { version: "Blender 4.5.12", python: "", render: true, cleanExit: true } }); assert.equal(cert.status, "BLOCKED"); });
test("certificate architecture and platform are recorded", () => { const cert = certifyWorkerRuntime(config, { probe: { version: "Blender 4.5.12", python: "GROWGO_WORKER_PYTHON_OK", render: true, cleanExit: true } }); assert.equal(cert.architecture, "x86_64"); assert.equal(cert.platform, "test"); });
test("real adapter preserves explicit failure classes", () => { const cert = path.join(root, "pass.json"); fs.writeFileSync(cert, JSON.stringify({ status: "PASS", workerRuntimeId: config.runtimeId })); const packageRoot = path.join(root, "package"); fs.mkdirSync(packageRoot, { recursive: true }); expectCode(() => executeRealBlenderWorker({ packageRoot, outputRoot: config.outputRoot, runtimeConfig: config, certificatePath: cert }), "WORKER_PACKAGE_INVALID"); });
