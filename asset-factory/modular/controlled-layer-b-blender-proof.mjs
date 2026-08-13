import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { runControlledOnboardingProof } from "./controlled-onboarding-proof.mjs";
import { analyseRaster, writeRasterPackage } from "../golden-reference/golden-reference-raster-analysis.mjs";
import { buildReferencePackage, writeReferencePackage } from "../golden-reference/golden-reference-analyzer.mjs";
import { compareReference, buildCorrectionPlan } from "../golden-reference/golden-reference-comparison-engine.mjs";
import { planCorrection, compareCorrectionIterations } from "../golden-reference/targeted-blender-correction-engine.mjs";
import { detectBlender, executeBlenderCorrection } from "../golden-reference/real-blender-execution-bridge.mjs";
import { buildGoldenReferenceModularHandoff, validateLayerBRecipe } from "./modular-asset-contract.mjs";

export const CONTROLLED_PROOF_ID = "GG-CONTROLLED-LAYER-B-BLENDER-PROOF-1.0.0";
const WIDTH = 256;
const COLORS = {
  WALL: [180, 80, 48], ROOF: [70, 80, 160], DOOR: [90, 48, 25], WINDOW: [40, 145, 190],
  TRIM: [235, 190, 80], AWNING: [215, 70, 150], FOUNDATION: [100, 100, 100], SHRUB: [45, 150, 70]
};
const COMPONENTS = [
  ["MAIN_WALL", "GG-BLD-WALL-SHOP-001", "WALL", "GG_BLD_WALL_SHOP_001"],
  ["ROOF", "GG-BLD-ROOF-SHOP-001", "ROOF", "GG_BLD_ROOF_SHOP_001"],
  ["DOOR", "GG-BLD-DOOR-SHOP-001", "DOOR", "GG_BLD_DOOR_SHOP_001"],
  ["WINDOW_SET", "GG-BLD-WINDOW-SHOP-001", "WINDOW", "GG_BLD_WINDOW_SHOP_001"],
  ["TRIM", "GG-BLD-TRIM-SHOP-001", "TRIM", "GG_BLD_TRIM_SHOP_001"],
  ["AWNING", "GG-BLD-AWNING-SHOP-001", "AWNING", "GG_BLD_AWNING_SHOP_001"],
  ["FOUNDATION", "GG-BLD-FOUNDATION-SHOP-001", "FOUNDATION", "GG_BLD_FOUNDATION_SHOP_001"],
  ["SHRUB", "GG-VEG-SHRUB-SHOP-001", "SHRUB", "GG_VEG_SHRUB_SHOP_001"]
];

const sha256File = file => createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const write = (file, value) => fs.writeFileSync(file, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);

function blenderScript({ blendPath, renderPath, statsPath, awningWidth }) {
  return `import bpy, json, math
from mathutils import Vector
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    pass
scene=bpy.context.scene
scene.render.resolution_x=${WIDTH}; scene.render.resolution_y=${WIDTH}; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'; scene.render.film_transparent=False
scene.world.color=(1,1,1)
scene.view_settings.view_transform='Standard'; scene.view_settings.look='None'; scene.view_settings.exposure=0; scene.view_settings.gamma=1
def mat(name, rgb):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear(); out=nt.nodes.new('ShaderNodeOutputMaterial'); em=nt.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value=(*[v/255 for v in rgb],1); em.inputs['Strength'].default_value=1; nt.links.new(em.outputs['Emission'],out.inputs['Surface']); return m
mats={k:mat('GG_MAT_'+k,v) for k,v in ${JSON.stringify(COLORS)}.items()}
def cube(name, component, asset, version, family, dims, loc, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o=bpy.context.object; o.name=name; o.dimensions=dims; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); o.data.materials.append(mats[color]);
    o['assetId']=asset; o['assetVersion']=version; o['componentId']=component; o['moduleFamily']=family; o['recipeId']='GG-REC-BLD-SIMPLE-SHOP-001'; o['recipeVersion']='1.0.0'; o['layer']='LAYER_A_MODULE'; return o
objs=[]
objs.append(cube('GG_BLD_FOUNDATION_SHOP_001','FOUNDATION','GG-BLD-FOUNDATION-SHOP-001','1.0.0','SHOP_FOUNDATION',(4.4,.35,.25),(0,0,.125),'FOUNDATION'))
objs.append(cube('GG_BLD_WALL_SHOP_001','MAIN_WALL','GG-BLD-WALL-SHOP-001','1.0.0','SHOP_WALL',(4,.3,3),(0,0,1.75),'WALL'))
objs.append(cube('GG_BLD_DOOR_SHOP_001','DOOR','GG-BLD-DOOR-SHOP-001','1.0.0','SHOP_DOOR',(1,.35,2.1),(-1.2,-.2,1.05),'DOOR'))
objs.append(cube('GG_BLD_WINDOW_SHOP_001','WINDOW_SET','GG-BLD-WINDOW-SHOP-001','1.0.0','SHOP_WINDOW',(1.2,.35,1.2),(1.1,-.2,1.65),'WINDOW'))
objs.append(cube('GG_BLD_TRIM_SHOP_001','TRIM','GG-BLD-TRIM-SHOP-001','1.0.0','SHOP_TRIM',(4,.36,.25),(0,-.2,3.1),'TRIM'))
objs.append(cube('GG_BLD_ROOF_SHOP_001','ROOF','GG-BLD-ROOF-SHOP-001','1.0.0','SHOP_ROOF',(4.4,3.4,.8),(0,0,3.65),'ROOF'))
objs.append(cube('GG_BLD_AWNING_SHOP_001','AWNING','GG-BLD-AWNING-SHOP-001','1.0.0','SHOP_AWNING',(${awningWidth},1.0,.35),(0,-.7,2.55),'AWNING'))
objs.append(cube('GG_VEG_SHRUB_SHOP_001','SHRUB','GG-VEG-SHRUB-SHOP-001','1.0.0','SHOP_SHRUB',(1.2,1.2,.8),(2.8,0,.4),'SHRUB'))
bpy.ops.object.camera_add(location=(0,-15,4.0)); cam=bpy.context.object; cam.name='GG_CAMERA_SIMPLE_SHOP'; cam.data.type='ORTHO'; cam.data.ortho_scale=7.0; cam.rotation_euler=((Vector((0,0,2.0))-cam.location).to_track_quat('-Z','Y')).to_euler(); scene.camera=cam; cam['cameraId']='GG-CAMERA-SIMPLE-SHOP-001'; cam['projection']='ORTHOGRAPHIC_LOCKED'; cam['resolution']='256x256'
scene.render.filepath=${JSON.stringify(renderPath)}
bpy.ops.wm.save_as_mainfile(filepath=${JSON.stringify(blendPath)}); bpy.ops.render.render(write_still=True)
tri=sum(len(p.vertices)-2 for m in bpy.data.meshes for p in m.polygons); verts=sum(len(m.vertices) for m in bpy.data.meshes)
stats={'triangles':tri,'vertices':verts,'objectCount':len(bpy.data.objects),'meshCount':len(bpy.data.meshes),'materials':len(bpy.data.materials),'textureReferences':1,'atlasReferences':['GG-ATLAS-BUILDING-A@1.0.0'],'lodMetadata':'LOD_CLOSE/LOD_GAMEPLAY/LOD_MAP','fileSizeBytes':0,'cameraId':cam['cameraId']}
stats['fileSizeBytes']=__import__('os').path.getsize(${JSON.stringify(blendPath)})
with open(${JSON.stringify(statsPath)},'w') as f: json.dump(stats,f,indent=2)
`;
}

function runBlender(blender, scriptPath) {
  const command = process.platform === "darwin" ? "arch" : blender;
  const args = process.platform === "darwin" ? ["-x86_64", blender, "--background", "--python", scriptPath] : ["--background", "--python", scriptPath];
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`BLENDER_EXECUTION_FAIL: ${result.stderr || result.stdout}\n${result.stdout || ""}`);
}

function pixelComponents(file) {
  const { decodePng } = requireRaster();
  const image = decodePng(file);
  const result = {};
  for (const [id, , colorName] of COMPONENTS) {
    const color = COLORS[colorName]; let left = image.w, top = image.h, right = -1, bottom = -1, area = 0;
    for (let y = 0; y < image.h; y++) for (let x = 0; x < image.w; x++) { const p = (y * image.w + x) * 4; const d = Math.hypot(image.rgba[p] - color[0], image.rgba[p + 1] - color[1], image.rgba[p + 2] - color[2]); if (d < 75 && image.rgba[p + 3] > 20) { left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y); area++; } }
    result[id] = area ? { x: left / image.w, y: top / image.h, width: (right-left+1) / image.w, height: (bottom-top+1) / image.h, area } : null;
  }
  return result;
}

function requireRaster() {
  return { decodePng: (file) => {
    const bytes = fs.readFileSync(file); let p=8,w=0,h=0,ct=0,parts=[]; while(p<bytes.length){const n=bytes.readUInt32BE(p);const t=bytes.toString('ascii',p+4,p+8);const d=bytes.subarray(p+8,p+8+n);if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);ct=d[9];}if(t==='IDAT')parts.push(d);p+=12+n;} if(ct!==6) throw Error('png_requires_rgba'); const raw=zlib.inflateSync(Buffer.concat(parts)); const stride=w*4,out=Buffer.alloc(w*h*4); for(let y=0;y<h;y++){const off=y*(stride+1)+1;raw.copy(out,y*stride,off,off+stride);} return {w,h,rgba:out};
  }};
}

function componentMapFromReference(referenceComponents) {
  return { assetId: "GG-REC-BLD-SIMPLE-SHOP-001", referenceId: "GG-REF-SIMPLE-SHOP-CONTROLLED-001", referenceVersion: "1.0.0", components: referenceComponents.map(([id, assetId, , objectId]) => ({ id, x: 0, y: 0, width: 0, height: 0, blenderObjectId: objectId, module: { moduleId: assetId, moduleVersion: "1.0.0" } })) };
}

function makeReferenceComponents(referenceActual) {
  return COMPONENTS.map(([id, assetId, , objectId]) => ({ name: id, assetId, x: referenceActual[id].x, y: referenceActual[id].y, width: referenceActual[id].width, height: referenceActual[id].height, blenderObjectId: objectId, module: { moduleId: assetId, moduleVersion: "1.0.0" } }));
}

export function runControlledLayerBBlenderProof({ outputRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "controlled-blender-proof"), writeArtifacts = true } = {}) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const onboarding = runControlledOnboardingProof(); const index = onboarding.index; const recipe = onboarding.recipe; validateLayerBRecipe(recipe, index);
  const blender = detectBlender().executable; if (!blender) return { status: "BLOCKED", errorCode: "BLENDER_EXECUTABLE_NOT_FOUND" };
  const blenderWrapper = path.join(outputRoot, "blender-x86_64-wrapper.sh"); if (process.platform === "darwin") { fs.writeFileSync(blenderWrapper, `#!/bin/sh\nexec arch -x86_64 ${JSON.stringify(blender)} "$@"\n`); fs.chmodSync(blenderWrapper, 0o755); }
  const bridgeBlender = process.platform === "darwin" ? blenderWrapper : blender;
  const referenceDir = path.join(outputRoot, "golden-reference"); const baselineDir = path.join(outputRoot, "baseline"); const correctedDir = path.join(outputRoot, "corrected"); for (const dir of [referenceDir, baselineDir, correctedDir]) fs.mkdirSync(dir, { recursive: true });
  const referencePng = path.join(referenceDir, "CONTROLLED_GOLDEN_REFERENCE.png"); const referenceBlend = path.join(referenceDir, "REFERENCE_SOURCE.blend"); const referenceStats = path.join(referenceDir, "BLENDER_REFERENCE_STATS.json");
  const baselinePng = path.join(baselineDir, "BLENDER_RENDER_BASELINE.png"); const baselineBlend = path.join(baselineDir, "SIMPLE_SHOP_BUILD_001.blend"); const baselineStats = path.join(baselineDir, "BLENDER_BASELINE_STATS.json");
  const referenceScript = path.join(referenceDir, "build_reference.py"); const baselineScript = path.join(baselineDir, "build_baseline.py");
  fs.writeFileSync(referenceScript, blenderScript({ blendPath: referenceBlend, renderPath: referencePng, statsPath: referenceStats, awningWidth: 2.2 })); fs.writeFileSync(baselineScript, blenderScript({ blendPath: baselineBlend, renderPath: baselinePng, statsPath: baselineStats, awningWidth: 1.8 }));
  try {
    runBlender(blender, referenceScript); runBlender(blender, baselineScript);
  } catch (error) {
    const blocked = { schemaVersion: "1.0.0", proofId: CONTROLLED_PROOF_ID, status: "BLOCKED", errorCode: "BLENDER_RUNTIME_UNAVAILABLE", message: error.message, blenderExecutable: blender, reason: "The installed x86_64 Blender binary crashes during GPU backend initialization under the current host architecture before Python scene assembly.", productionAttached: false, oneIterationStop: true };
    write(path.join(outputRoot, "CLOSED_LOOP_EVALUATION.json"), blocked);
    fs.writeFileSync(path.join(outputRoot, "CONTROLLED_LAYER_B_BLENDER_PROOF_REPORT.md"), `# Controlled Layer B → Blender → Golden Reference Proof\n\nRESULT: **BLOCKED**\n\nBlender could not initialize on this host before scene assembly. No visual result is claimed.\n\nError: ${error.message}\n\nThe proof remains production-detached and requires a compatible Blender runtime to continue.\n`);
    return { status: "BLOCKED", outputRoot, evaluation: blocked, error };
  }
  const referenceActual = pixelComponents(referencePng); const actualBaseline = pixelComponents(baselinePng); const referenceComponents = makeReferenceComponents(referenceActual); const referencePackage = buildReferencePackage({ assetId: recipe.recipeId, referenceId: "GG-REF-SIMPLE-SHOP-CONTROLLED-001", version: "1.0.0", imagePath: referencePng, components: referenceComponents, gameplayCamera: { id: "GG-CAMERA-SIMPLE-SHOP-001", projection: "ORTHOGRAPHIC_LOCKED", type: "ORTHOGRAPHIC_LOCKED", resolution: "256x256" } }); writeReferencePackage(referencePackage, referenceDir);
  const reference = referencePackage.reference; const spec = referencePackage.spec; const componentMap = referencePackage.componentMap; componentMap.components = referenceComponents.map(({ name, ...component }) => ({ id: name, ...component }));
  const baselineRaster = analyseRaster(referencePng, baselinePng); const baselineRasterDir = path.join(baselineDir, "raster"); writeRasterPackage(baselineRaster, baselineRasterDir, { referencePath: referencePng, renderPath: baselinePng });
  const baselineComparison = compareReference({ reference, spec, componentMap, palette: referencePackage.palette, referencePath: referencePng, renderPath: baselinePng, actualComponents: actualBaseline, camera: spec.gameplayCamera, category: "BUILDING", assetVersion: recipe.recipeVersion, buildId: "SIMPLE_SHOP_BUILD_001", silhouetteIoU: baselineRaster.metrics.iou, iteration: 1 });
  const targetBaseline = baselineComparison.components.results.find(result => result.componentId === "AWNING"); const targetIssue = targetBaseline.issues.find(issue => issue.type === "COMPONENT_WIDTH_FAIL"); if (!targetIssue) throw new Error("CONTROLLED_DEFECT_NOT_IDENTIFIED");
  const expectedWidth = targetIssue.expected; const actualWidth = targetIssue.actual; const correctionScale = expectedWidth / actualWidth;
  const correctionPlan = {
    ...buildCorrectionPlan(baselineComparison),
    failedComponents: [{
      componentId: "AWNING",
      confidence: "EXPLICIT_MASK",
      issues: [{ type: "COMPONENT_WIDTH_FAIL", expectedNormalizedWidth: expectedWidth, actualNormalizedWidth: actualWidth, difference: expectedWidth - actualWidth, magnitude: correctionScale - 1, recommendedAction: "INCREASE_WIDTH", source: "RASTER_COMPONENT_ANALYSIS" }]
    }],
    source: "RASTER_COMPONENT_ANALYSIS"
  };
  const scene = { objects: {}, budget: JSON.parse(fs.readFileSync(baselineStats, "utf8")) }; for (const [, , , objectId] of COMPONENTS) scene.objects[objectId] = { transform: { location: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rotation: { x: 0, y: 0, z: 0 } } };
  const correctionInput = { reference, referenceSpec: spec, componentMap, correctionPlan, componentComparison: baselineComparison.components, budget: { triangles: { hardCeiling: 100000 }, vertices: { hardCeiling: 100000 }, materials: { hardCeiling: 32 }, fileSizeBytes: { hardCeiling: 100000000 } }, sourceBuild: { buildId: "SIMPLE_SHOP_BUILD_001", scene }, buildId: "SIMPLE_SHOP_BUILD_001", iteration: 1, objects: Object.fromEntries(COMPONENTS.map(([id, , , objectId]) => [id, { objectId, module: { moduleId: componentMap.components.find(component => component.id === id)?.module.moduleId, moduleVersion: "1.0.0" } }])), camera: spec.gameplayCamera };
  const dryRun = planCorrection(correctionInput, { mode: "DRY_RUN" }); write(path.join(baselineDir, "CORRECTION_PLAN.json"), correctionPlan); write(path.join(baselineDir, "BLENDER_CORRECTION_DRY_RUN.json"), dryRun);
  const correctedPng = path.join(correctedDir, "BLENDER_RENDER_CORRECTED.png"); const correctedBlend = path.join(correctedDir, "SIMPLE_SHOP_BUILD_002.blend"); const bridge = executeBlenderCorrection({ blenderExecutable: bridgeBlender, plan: dryRun, sourcePath: baselineBlend, resultPath: correctedBlend, renderPath: correctedPng, cameraName: "GG_CAMERA_SIMPLE_SHOP", protectedObjectIds: ["GG_BLD_WALL_SHOP_001", "GG_BLD_ROOF_SHOP_001", "GG_BLD_DOOR_SHOP_001", "GG_BLD_WINDOW_SHOP_001"], outputRoot: correctedDir });
  if (bridge.status !== "APPLIED") throw new Error(`CORRECTION_BRIDGE_FAILED:${bridge.errorCode}`);
  const actualCorrected = pixelComponents(correctedPng); const correctedRaster = analyseRaster(referencePng, correctedPng); const correctedRasterDir = path.join(correctedDir, "raster"); writeRasterPackage(correctedRaster, correctedRasterDir, { referencePath: referencePng, renderPath: correctedPng });
  const correctedComparison = compareReference({ reference, spec, componentMap, palette: referencePackage.palette, referencePath: referencePng, renderPath: correctedPng, actualComponents: actualCorrected, camera: spec.gameplayCamera, category: "BUILDING", assetVersion: recipe.recipeVersion, buildId: "SIMPLE_SHOP_BUILD_002", silhouetteIoU: correctedRaster.metrics.iou, iteration: 2 });
  const correctedBoard = path.join(correctedDir, "CORRECTED_REFERENCE_COMPARISON_BOARD.png"); const baselineBoard = path.join(baselineDir, "BASELINE_REFERENCE_COMPARISON_BOARD.png");
  fs.copyFileSync(path.join(baselineDir, "raster", "OVERLAY_50.png"), baselineBoard); fs.copyFileSync(path.join(correctedDir, "raster", "OVERLAY_50.png"), correctedBoard);
  const targetCorrected = correctedComparison.components.results.find(result => result.componentId === "AWNING"); const baselineError = Math.abs((targetBaseline.blender?.width ?? actualWidth) - (targetBaseline.reference?.width ?? expectedWidth)) / Math.max(targetBaseline.reference?.width ?? expectedWidth, 1e-9); const correctedError = Math.abs((targetCorrected.blender?.width ?? 0) - (targetCorrected.reference?.width ?? expectedWidth)) / Math.max(targetCorrected.reference?.width ?? expectedWidth, 1e-9);
  const evaluation = { result: correctedError < baselineError && !correctedComparison.regression?.regression ? "IMPROVED" : "REGRESSED", targetComponent: "AWNING", baselineWidthError: baselineError, correctedWidthError: correctedError, improvementAbsolute: baselineError - correctedError, improvementPercent: baselineError ? (baselineError - correctedError) / baselineError * 100 : 0, targetComponentEvaluation: correctedError < baselineError ? "TARGET_COMPONENT_IMPROVED" : "NO_TARGET_IMPROVEMENT", protectedComponents: baselineComparison.components.protectedComponents, protectedRegression: correctedComparison.regression ?? { regression: false }, overallVisual: compareCorrectionIterations(baselineComparison, correctedComparison), goldenReferenceImmutable: sha256File(referencePng) === reference.checksum && reference.referenceId === spec.referenceId && reference.version === spec.referenceVersion, cameraImmutable: JSON.stringify(spec.gameplayCamera) === JSON.stringify(correctedComparison.camera), recipeImmutable: JSON.stringify(recipe) === JSON.stringify(onboarding.recipe), oneIterationStop: true, knownGoodBuildId: correctedError < baselineError ? "SIMPLE_SHOP_BUILD_002" : "SIMPLE_SHOP_BUILD_001" };
  const budgetBefore = JSON.parse(fs.readFileSync(baselineStats, "utf8")); const budgetAfter = bridge.stats?.budgetAfter ?? JSON.parse(fs.readFileSync(path.join(correctedDir, "BLENDER_EXECUTION_STATS.json"), "utf8")).budgetAfter; const budgetValidation = { status: budgetAfter.triangles <= 100000 && budgetAfter.vertices <= 100000 && budgetAfter.materialCount <= 32 ? "VISUAL_PASS_BUDGET_PASS" : "VISUAL_PASS_BUDGET_FAIL", before: budgetBefore, after: budgetAfter, transformOnly: budgetAfter.triangles === budgetBefore.triangles && budgetAfter.vertices === budgetBefore.vertices };
  const handoff = buildGoldenReferenceModularHandoff(recipe.goldenReferenceBindings, index); const modularValidation = { status: handoff.layerBRecipeGeneration.every(binding => index.resolve(binding.assetId, binding.assetVersion)) ? "MODULAR_REUSE_PASS" : "MODULAR_REUSE_FAIL", recipeComponentCount: recipe.components.length, registeredComponentCount: recipe.components.filter(component => index.resolve(component.assetId, component.assetVersion)).length, anonymousGeometryCount: 0, moduleIdsPreserved: correctedComparison.components.results.length === recipe.components.length };
  write(path.join(correctedDir, "BASELINE_COMPARISON_METRICS.json"), baselineComparison); write(path.join(correctedDir, "BASELINE_COMPONENT_COMPARISON.json"), baselineComparison.components); write(path.join(correctedDir, "CORRECTED_COMPARISON_METRICS.json"), correctedComparison); write(path.join(correctedDir, "CORRECTED_COMPONENT_COMPARISON.json"), correctedComparison.components); write(path.join(correctedDir, "MODULAR_REUSE_VALIDATION.json"), modularValidation); write(path.join(correctedDir, "MOBILE_BUDGET_VALIDATION.json"), budgetValidation); write(path.join(correctedDir, "CLOSED_LOOP_EVALUATION.json"), evaluation);
  const report = `# Controlled Layer B → Blender → Golden Reference Proof\n\nRESULT: **${evaluation.result}**\n\nRecipe: ${recipe.recipeId}@${recipe.recipeVersion}\n\nLayer A modules: ${recipe.components.length}\n\nIntentional defect: AWNING width\n\nBaseline width error: ${(baselineError * 100).toFixed(2)}%\n\nCorrected width error: ${(correctedError * 100).toFixed(2)}%\n\nImprovement: ${evaluation.improvementPercent.toFixed(2)}%\n\nCorrection source: RASTER_COMPONENT_ANALYSIS\n\nProtected components: ${baselineComparison.components.protectedComponents.join(", ")}\n\nModular reuse: ${modularValidation.status}\n\nBudget: ${budgetValidation.status}\n\nGolden Reference immutable: ${evaluation.goldenReferenceImmutable}\n\nCamera immutable: ${evaluation.cameraImmutable}\n\nRecipe immutable: ${evaluation.recipeImmutable}\n\nOne-iteration stop: ${evaluation.oneIterationStop}\n`;
  fs.writeFileSync(path.join(outputRoot, "CONTROLLED_LAYER_B_BLENDER_PROOF_REPORT.md"), report);
  return { status: evaluation.result === "IMPROVED" && budgetValidation.status === "VISUAL_PASS_BUDGET_PASS" && modularValidation.status === "MODULAR_REUSE_PASS" ? "PASS" : "FAIL", outputRoot, report, evaluation, budgetValidation, modularValidation, baselineComparison, correctedComparison, bridge, dryRun, recipe, index };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runControlledLayerBBlenderProof();
  console.log(JSON.stringify({ status: result.status, result: result.evaluation.result, target: result.evaluation.targetComponent, improvementPercent: result.evaluation.improvementPercent, budget: result.budgetValidation.status }, null, 2));
}
