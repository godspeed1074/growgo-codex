import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { canonicalJson, fileChecksum, WorkerContractError } from "../golden-reference/external-blender-worker-contract.mjs";
import { generateWorkerBlenderScript } from "./worker-package-consumer.mjs";

export const REAL_EXECUTION_MODE = "REAL_BLENDER_WORKER";
export const CERTIFICATE_VERSION = "GG-WORKER-BLENDER-RUNTIME-CERTIFICATE-1.0.0";
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value)).digest("hex");
const fail = (code, message, details = {}) => { throw new WorkerContractError(code, message, details); };
const readJson = file => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (error) { fail("WORKER_PACKAGE_INVALID", `Invalid or missing worker package JSON: ${file}`, { cause: error.code }); } };

export function parseWorkerRuntimeConfig(config = {}) {
  for (const field of ["runtimeId", "executable", "platform", "architecture", "workspaceRoot"]) if (!config[field]) fail("WORKER_RUNTIME_NOT_CERTIFIED", `Missing worker runtime configuration: ${field}`);
  return Object.freeze({ runtimeId: String(config.runtimeId), executable: path.resolve(config.executable), platform: String(config.platform), architecture: String(config.architecture), allowedVersionRange: config.allowedVersionRange ?? ">=4.0.0", workspaceRoot: path.resolve(config.workspaceRoot), outputRoot: path.resolve(config.outputRoot ?? path.join(config.workspaceRoot, "outputs")) });
}

export function certifyWorkerRuntime(configInput, { now = new Date().toISOString(), probe = null } = {}) {
  const config = parseWorkerRuntimeConfig(configInput); const base = { certificateVersion: CERTIFICATE_VERSION, workerRuntimeId: config.runtimeId, platform: config.platform, architecture: config.architecture, executable: config.executable, allowedVersionRange: config.allowedVersionRange, timestamp: now };
  if (!fs.existsSync(config.executable)) return { ...base, status: "BLOCKED", executableExists: false, pythonExecuted: false, controlledRender: false, cleanExit: false };
  try {
    const version = probe?.version ?? execFileSync(config.executable, ["--background", "--version"], { encoding: "utf8", timeout: 30000 });
    const python = probe?.python ?? execFileSync(config.executable, ["--background", "--python-expr", "print(\"GROWGO_WORKER_PYTHON_OK\")"], { encoding: "utf8", timeout: 30000 });
    const render = probe?.render === true; const cleanExit = probe?.cleanExit ?? true; const pythonExecuted = String(python).includes("GROWGO_WORKER_PYTHON_OK");
    return { ...base, status: pythonExecuted && render && cleanExit ? "PASS" : "BLOCKED", executableExists: true, blenderVersion: String(version).trim(), pythonExecuted, controlledRender: render, cleanExit };
  } catch (error) { return { ...base, status: "BLOCKED", executableExists: true, pythonExecuted: false, controlledRender: false, cleanExit: false, error: error.message }; }
}

export function writeWorkerRuntimeCertificate(config, certificate, outputPath) { if (certificate.status === "PASS" && (!certificate.pythonExecuted || !certificate.controlledRender || !certificate.cleanExit)) fail("WORKER_RUNTIME_NOT_CERTIFIED", "Invalid PASS certificate"); fs.mkdirSync(path.dirname(outputPath), { recursive: true }); fs.writeFileSync(outputPath, `${canonicalJson(certificate)}\n`); return outputPath; }

function realScript(job, generatedScript, { renderPath, blendPath, statsPath }) {
  const operations = canonicalJson(job.operations ?? []); const camera = canonicalJson(job.cameraContract); const protectedIds = canonicalJson(job.protectedObjectIds ?? []);
  return `${generatedScript}\n# REAL_WORKER_EXECUTION_ADAPTER\nimport bpy, json, os\nOPS=${operations}\nCAMERA_CONTRACT=${camera}\nPROTECTED_IDS=${protectedIds}\ndef transform(o): return {'location': list(o.location), 'scale': list(o.scale), 'rotation': list(o.rotation_euler)}\nprotected_before={i: transform(bpy.data.objects[i]) for i in PROTECTED_IDS if i in bpy.data.objects}\nfor op in OPS:\n o=bpy.data.objects.get(op.get('objectId'))\n if o is None: raise RuntimeError('WORKER_OBJECT_MAPPING_FAIL')\n axis=op.get('operation','').split('_')[-1].lower(); value=float(op.get('value',1))\n if op['operation'].startswith('SCALE_') and op['operation'] != 'SCALE_UNIFORM': setattr(o.scale, axis, getattr(o.scale, axis) * value)\n elif op['operation'] == 'SCALE_UNIFORM': o.scale.x*=value; o.scale.y*=value; o.scale.z*=value\n elif op['operation'].startswith('MOVE_'): setattr(o.location, axis, getattr(o.location, axis) + value)\nprotected_after={i: transform(bpy.data.objects[i]) for i in protected_before}\nif protected_before != protected_after: raise RuntimeError('WORKER_PROTECTED_COMPONENT_MODIFIED')\nscene=bpy.context.scene\nscene.render.filepath=${JSON.stringify(renderPath)}\nscene.render.image_settings.file_format='PNG'\nscene.render.image_settings.color_mode='RGBA'\nscene.render.resolution_x=int(CAMERA_CONTRACT.get('width', 32) if isinstance(CAMERA_CONTRACT,dict) else 32)\nscene.render.resolution_y=int(CAMERA_CONTRACT.get('height', 32) if isinstance(CAMERA_CONTRACT,dict) else 32)\nbpy.ops.render.render(write_still=True)\nbpy.ops.wm.save_as_mainfile(filepath=${JSON.stringify(blendPath)})\nwith open(${JSON.stringify(statsPath)}, 'w') as f: json.dump({'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'vertices':sum(len(m.vertices) for m in bpy.data.meshes),'triangles':sum(sum(len(p.vertices)-2 for p in m.polygons) for m in bpy.data.meshes),'materials':len(bpy.data.materials),'moduleObjectMappingCount':len(OPS)}, f, sort_keys=True)\n`;
}

export function executeRealBlenderWorker({ packageRoot, outputRoot, runtimeConfig, certificatePath, now = new Date().toISOString() }) {
  const config = parseWorkerRuntimeConfig(runtimeConfig); if (!certificatePath || !fs.existsSync(certificatePath)) fail("WORKER_RUNTIME_NOT_CERTIFIED", "Worker runtime certificate is missing"); const certificate = readJson(certificatePath); if (certificate.status !== "PASS" || certificate.workerRuntimeId !== config.runtimeId) fail("WORKER_RUNTIME_NOT_CERTIFIED", "Worker runtime certificate is not valid for this worker");
  const job = readJson(path.join(packageRoot, "BLENDER_WORKER_JOB.json")); const jobRoot = path.join(config.workspaceRoot, "jobs", job.jobId); const inputs = path.join(jobRoot, "inputs"); const working = path.join(jobRoot, "working"); const outputs = path.resolve(outputRoot); fs.mkdirSync(inputs, { recursive: true }); fs.mkdirSync(working, { recursive: true }); fs.mkdirSync(outputs, { recursive: true }); fs.copyFileSync(path.join(packageRoot, "BLENDER_WORKER_JOB.json"), path.join(inputs, "BLENDER_WORKER_JOB.json"));
  const generated = generateWorkerBlenderScript(job); const script = realScript(job, generated, { renderPath: path.join(outputs, "BLENDER_RENDER.png"), blendPath: path.join(outputs, `${job.checksums.sourceBuild}-WORKER-OUTPUT-001.blend`), statsPath: path.join(outputs, "BLENDER_STATS.json") }); const scriptPath = path.join(working, "generated-worker-script.py"); fs.writeFileSync(scriptPath, script); const startedAt = now; const proc = spawnSync(config.executable, ["--background", "--python", scriptPath], { encoding: "utf8", timeout: 120000, maxBuffer: 20 * 1024 * 1024 }); fs.writeFileSync(path.join(jobRoot, "worker.stdout.log"), proc.stdout ?? ""); fs.writeFileSync(path.join(jobRoot, "worker.stderr.log"), proc.stderr ?? ""); if (proc.error || proc.status !== 0) fail(proc.signal ? "WORKER_BLENDER_CRASH" : "WORKER_BLENDER_EXECUTION_FAIL", proc.error?.message ?? `Blender exit ${proc.status}`);
  if (!fs.existsSync(path.join(outputs, "BLENDER_RENDER.png"))) fail("WORKER_RENDER_FAIL", "Real Blender render is missing"); if (!fs.existsSync(path.join(outputs, `${job.checksums.sourceBuild}-WORKER-OUTPUT-001.blend`))) fail("WORKER_SAVE_FAIL", "Versioned Blender output is missing"); return { executionMode: REAL_EXECUTION_MODE, startedAt, endedAt: new Date().toISOString(), scriptChecksum: sha256(script), outputRoot: outputs, runtime: certificate };
}
