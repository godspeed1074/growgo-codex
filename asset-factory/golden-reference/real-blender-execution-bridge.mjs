import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { requireCertifiedBlenderRuntime } from "./blender-runtime-certification.mjs";

export const BLENDER_BRIDGE_VERSION = "REAL_BLENDER_EXECUTION_BRIDGE_001";
export const BRIDGE_ERRORS = Object.freeze({ execution: "BLENDER_EXECUTION_FAIL", save: "BLENDER_SAVE_FAIL", render: "BLENDER_RENDER_FAIL", mapping: "BLENDER_OBJECT_MAPPING_FAIL", protected: "PROTECTED_COMPONENT_REGRESSION", camera: "CAMERA_ALIGNMENT_FAIL" });
const hashFile = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

export function detectBlender(candidates = ["/Applications/Blender 4.2.app/Contents/MacOS/Blender", "blender"]) { for (const executable of candidates) { const r = spawnSync(executable, ["--version"], { encoding: "utf8" }); if (!r.error && r.status === 0) return { executable, version: (r.stdout || "").split(/\r?\n/)[0] }; } return { executable: null, version: null, errorCode: "BLENDER_EXECUTABLE_NOT_FOUND" }; }

export function createBlenderCorrectionScript({ plan, sourcePath, resultPath, renderPath, cameraName, protectedObjectIds = [], outputStatsPath }) {
  const payload = JSON.stringify({ plan, sourcePath, resultPath, renderPath, cameraName, protectedObjectIds, outputStatsPath });
  return `import bpy, json, sys, os, hashlib\nP=json.loads(${JSON.stringify(payload)})\ndef transform(o): return {'location':list(o.location), 'scale':list(o.scale), 'rotation':list(o.rotation_euler)}\ndef stats():\n d={'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'materialCount':len(bpy.data.materials),'triangles':0,'vertices':0}\n for m in bpy.data.meshes:\n  d['vertices']+=len(m.vertices); d['triangles']+=sum(len(p.vertices)-2 for p in m.polygons)\n return d\nif P.get('cameraName') and P['cameraName'] not in bpy.data.objects: raise RuntimeError('CAMERA_ALIGNMENT_FAIL')\nprotected_before={i:transform(bpy.data.objects[i]) for i in P.get('protectedObjectIds',[]) if i in bpy.data.objects}\nfor op in P['plan']['operations']:\n o=bpy.data.objects.get(op['objectId'])\n if o is None: raise RuntimeError('BLENDER_OBJECT_MAPPING_FAIL')\n axis=op.get('axis','X').lower(); value=float(op['value'])\n if op['operation']=='SCALE_UNIFORM': o.scale.x*=value; o.scale.y*=value; o.scale.z*=value\n elif op['operation'].startswith('SCALE_'): setattr(o.scale,axis,getattr(o.scale,axis)*value)\n elif op['operation'].startswith('MOVE_'): setattr(o.location,axis,getattr(o.location,axis)+value)\nprotected_after={i:transform(bpy.data.objects[i]) for i in protected_before}\nif protected_before != protected_after: raise RuntimeError('PROTECTED_COMPONENT_REGRESSION')\nif P.get('cameraName'): bpy.context.scene.camera=bpy.data.objects[P['cameraName']]\nbpy.context.scene.render.filepath=P['renderPath']; bpy.context.scene.render.image_settings.file_format='PNG'; bpy.context.scene.render.image_settings.color_mode='RGBA'; bpy.ops.wm.save_as_mainfile(filepath=P['resultPath']); bpy.ops.render.render(write_still=True)\nout={'budgetBefore':stats(),'budgetAfter':stats(),'protectedBefore':protected_before,'protectedAfter':protected_after,'camera':P.get('cameraName')}\nwith open(P['outputStatsPath'],'w') as f: json.dump(out,f,indent=2)\n`;
}

export function executeBlenderCorrection({ blenderExecutable, plan, sourcePath, resultPath, renderPath, cameraName, protectedObjectIds = [], outputRoot = path.dirname(resultPath), runtimeCertificatePath = process.env.GROWGO_BLENDER_RUNTIME_CERTIFICATE }) {
  if (runtimeCertificatePath || process.env.GROWGO_REQUIRE_CERTIFIED_BLENDER === "1") {
    const gate = requireCertifiedBlenderRuntime({ executable: blenderExecutable, certificatePath: runtimeCertificatePath });
    if (!gate.ok) return { status: "REJECTED", errorCode: gate.errorCode, runtimeCertificate: gate.certificate ?? null, reason: gate.reason ?? null };
  }
  if (!fs.existsSync(sourcePath)) return { status: "REJECTED", errorCode: "BLENDER_SOURCE_NOT_FOUND" };
  fs.mkdirSync(outputRoot, { recursive: true }); const statsPath = path.join(outputRoot, "BLENDER_EXECUTION_STATS.json"); const scriptPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "growgo-blender-")), "correction.py");
  fs.writeFileSync(scriptPath, createBlenderCorrectionScript({ plan, sourcePath, resultPath, renderPath, cameraName, protectedObjectIds, outputStatsPath: statsPath })); const scriptChecksum = hashFile(scriptPath); const command = spawnSync(blenderExecutable, ["--background", sourcePath, "--python", scriptPath], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (command.error || command.status !== 0) return { status: "REJECTED", errorCode: BRIDGE_ERRORS.execution, stderr: command.stderr, scriptChecksum, sourceChecksum: hashFile(sourcePath) };
  if (!fs.existsSync(resultPath)) return { status: "REJECTED", errorCode: BRIDGE_ERRORS.save, scriptChecksum };
  if (!fs.existsSync(renderPath)) return { status: "REJECTED", errorCode: BRIDGE_ERRORS.render, scriptChecksum };
  const renderHeader = fs.readFileSync(renderPath).readUInt32BE(0); if (renderHeader !== 0x89504e47) return { status: "REJECTED", errorCode: BRIDGE_ERRORS.render };
  return { status: "APPLIED", blenderExecutable, scriptChecksum, sourceChecksum: hashFile(sourcePath), resultChecksum: hashFile(resultPath), renderChecksum: hashFile(renderPath), stats: fs.existsSync(statsPath) ? JSON.parse(fs.readFileSync(statsPath, "utf8")) : null, oneIterationStop: true };
}
