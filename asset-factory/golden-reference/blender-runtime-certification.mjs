import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

export const RUNTIME_SELECTION_VERSION = "GG-BLENDER-RUNTIME-SELECTION-1.0.0";
export const RUNTIME_CERTIFICATE_VERSION = "GG-BLENDER-RUNTIME-CERTIFICATE-1.0.0";
export const RUNTIME_ERRORS = Object.freeze({
  architecture: "BLENDER_ARCHITECTURE_INCOMPATIBLE",
  notCertified: "BLENDER_RUNTIME_NOT_CERTIFIED",
  executableMissing: "BLENDER_EXECUTABLE_NOT_FOUND",
  launch: "HEADLESS_LAUNCH_FAIL",
  python: "BLENDER_PYTHON_EXECUTION_FAIL",
  fixture: "BLENDER_FIXTURE_OPEN_FAIL",
  render: "BLENDER_RGBA_RENDER_FAIL"
});

const command = (program, args) => spawnSync(program, args, { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
const jsonWrite = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

export function detectRuntimeHost() {
  const uname = command("uname", ["-m"]);
  const processArchitecture = process.arch === "arm64" ? "arm64" : process.arch === "x64" ? "x86_64" : process.arch;
  const kernelArchitecture = (uname.stdout || "").trim() || "unknown";
  const hostArchitecture = kernelArchitecture === "arm64" || processArchitecture === "arm64" ? "arm64" : kernelArchitecture;
  const rosetta = hostArchitecture === "arm64" && processArchitecture === "x86_64";
  return { platform: process.platform, hostArchitecture, kernelArchitecture, processArchitecture, rosettaTranslationActive: rosetta, osRelease: os.release(), cpuCount: os.cpus().length };
}

export function inspectBlenderExecutable(executable) {
  if (!executable || !fs.existsSync(executable)) return { executable, exists: false, architecture: null, version: null };
  const file = command("file", [executable]);
  const version = command(executable, ["--version"]);
  const text = `${file.stdout || ""} ${file.stderr || ""}`;
  const architecture = /arm64|Apple Silicon/i.test(text) ? "arm64" : /x86_64|x86-64|Intel/i.test(text) ? "x86_64" : "unknown";
  const versionLine = (version.stdout || "").split(/\r?\n/).find(line => line.includes("Blender"))?.trim() ?? null;
  return { executable, exists: true, architecture, version: versionLine, versionExitCode: version.status, fileDescription: text.trim() };
}

export function discoverBlenderExecutables(extra = []) {
  const candidates = [...extra, "/Applications/Blender 4.2.app/Contents/MacOS/Blender", "/Applications/Blender.app/Contents/MacOS/Blender", "blender"];
  const seen = new Set();
  return candidates.filter(candidate => { const key = candidate; if (seen.has(key)) return false; seen.add(key); return true; }).map(candidate => {
    if (candidate === "blender") { const resolved = command("which", ["blender"]); return inspectBlenderExecutable((resolved.stdout || "").trim() || candidate); }
    return inspectBlenderExecutable(candidate);
  }).filter(item => item.exists);
}

export function selectBlenderRuntime({ explicitExecutable = process.env.GROWGO_BLENDER_EXECUTABLE, candidates = [] } = {}) {
  const host = detectRuntimeHost();
  const discovered = discoverBlenderExecutables([explicitExecutable, ...candidates].filter(Boolean));
  const compatible = discovered.filter(runtime => runtime.architecture === host.hostArchitecture && runtime.versionExitCode === 0);
  const selected = explicitExecutable ? discovered.find(runtime => runtime.executable === explicitExecutable) ?? null : compatible[0] ?? discovered.find(runtime => runtime.versionExitCode === 0) ?? null;
  if (!selected) return { ok: false, errorCode: RUNTIME_ERRORS.executableMissing, host, discovered, selected: null };
  if (selected.architecture !== host.hostArchitecture) return { ok: false, errorCode: RUNTIME_ERRORS.architecture, host, discovered, selected };
  return { ok: true, errorCode: null, host, discovered, selected };
}

function archCommand(runtime, args) {
  const host = detectRuntimeHost();
  if (host.hostArchitecture === "arm64" && runtime.architecture === "x86_64") return { program: "arch", args: ["-x86_64", runtime.executable, ...args] };
  return { program: runtime.executable, args };
}

function runRuntime(runtime, args) {
  const invocation = archCommand(runtime, args);
  return command(invocation.program, invocation.args);
}

export function certifyBlenderRuntime({ explicitExecutable, certificatePath, fixturePath = null, outputDir = path.dirname(certificatePath ?? path.resolve("BLENDER_RUNTIME_CERTIFICATE.json")) } = {}) {
  const selected = selectBlenderRuntime({ explicitExecutable });
  const startedAt = new Date().toISOString();
  const certificate = { certificateVersion: RUNTIME_CERTIFICATE_VERSION, runtimeSelectionVersion: RUNTIME_SELECTION_VERSION, certificationStatus: "BLOCKED", errorCode: selected.errorCode, certified: false, host: selected.host, discoveredRuntimes: selected.discovered, selectedRuntime: selected.selected, tests: { headlessLaunch: "NOT_RUN", pythonExecution: "NOT_RUN", fixtureOpen: "NOT_RUN", rgbaRender: "NOT_RUN" }, render: null, certificationTimestamp: startedAt };
  if (!selected.ok) { if (certificatePath) jsonWrite(certificatePath, certificate); return certificate; }
  const launch = runRuntime(selected.selected, ["--background", "--version"]); certificate.tests.headlessLaunch = launch.status === 0 ? "HEADLESS_LAUNCH_PASS" : RUNTIME_ERRORS.launch;
  const python = runRuntime(selected.selected, ["--background", "--python-expr", "print('GROWGO_RUNTIME_PYTHON_PASS')"]); certificate.tests.pythonExecution = python.status === 0 && (python.stdout || "").includes("GROWGO_RUNTIME_PYTHON_PASS") ? "PYTHON_EXECUTION_PASS" : RUNTIME_ERRORS.python;
  if (fixturePath) {
    const fixture = runRuntime(selected.selected, ["--background", fixturePath, "--python-expr", "print('GROWGO_FIXTURE_OPEN_PASS')"]);
    certificate.tests.fixtureOpen = fixture.status === 0 && (fixture.stdout || "").includes("GROWGO_FIXTURE_OPEN_PASS") ? "FIXTURE_OPEN_PASS" : RUNTIME_ERRORS.fixture;
  } else certificate.tests.fixtureOpen = "FIXTURE_NOT_PROVIDED";
  const renderScript = path.join(outputDir, "blender-runtime-render-test.py"); const renderPath = path.join(outputDir, "BLENDER_RUNTIME_RENDER_TEST.png"); fs.mkdirSync(outputDir, { recursive: true }); fs.writeFileSync(renderScript, `import bpy\nbpy.ops.mesh.primitive_cube_add(size=2)\no=bpy.context.object\no.name='GG_RUNTIME_CERT_FIXTURE'\nbpy.ops.object.camera_add(location=(0,-6,0))\nc=bpy.context.object\nc.rotation_euler=(1.5708,0,0)\nbpy.context.scene.camera=c\ns=bpy.context.scene\ns.render.resolution_x=32\ns.render.resolution_y=32\ns.render.resolution_percentage=100\ns.render.image_settings.file_format='PNG'\ns.render.image_settings.color_mode='RGBA'\ns.render.filepath=${JSON.stringify(renderPath)}\nbpy.ops.render.render(write_still=True)\n`);
  const render = runRuntime(selected.selected, ["--background", "--python", renderScript]); const renderBytes = fs.existsSync(renderPath) ? fs.readFileSync(renderPath) : null; const validPng = renderBytes?.readUInt32BE(0) === 0x89504e47; certificate.tests.rgbaRender = render.status === 0 && validPng ? "RGBA_RENDER_PASS" : RUNTIME_ERRORS.render; if (validPng) certificate.render = { path: renderPath, checksum: createHash("sha256").update(renderBytes).digest("hex"), bytes: renderBytes.length, dimensions: { width: renderBytes.readUInt32BE(16), height: renderBytes.readUInt32BE(20) }, format: "PNG_RGBA" };
  const allPass = certificate.tests.headlessLaunch === "HEADLESS_LAUNCH_PASS" && certificate.tests.pythonExecution === "PYTHON_EXECUTION_PASS" && certificate.tests.fixtureOpen === "FIXTURE_OPEN_PASS" && certificate.tests.rgbaRender === "RGBA_RENDER_PASS";
  certificate.certificationStatus = allPass ? "CERTIFIED" : "BLOCKED"; certificate.certified = allPass; certificate.errorCode = allPass ? null : certificate.tests.headlessLaunch !== "HEADLESS_LAUNCH_PASS" ? RUNTIME_ERRORS.launch : certificate.tests.pythonExecution !== "PYTHON_EXECUTION_PASS" ? RUNTIME_ERRORS.python : certificate.tests.rgbaRender !== "RGBA_RENDER_PASS" ? RUNTIME_ERRORS.render : RUNTIME_ERRORS.fixture;
  if (certificatePath) jsonWrite(certificatePath, certificate); return certificate;
}

export function requireCertifiedBlenderRuntime({ executable, certificatePath } = {}) {
  if (!certificatePath || !fs.existsSync(certificatePath)) return { ok: false, errorCode: RUNTIME_ERRORS.notCertified, reason: "BLENDER_RUNTIME_CERTIFICATE.json is missing" };
  const certificate = JSON.parse(fs.readFileSync(certificatePath, "utf8"));
  if (!certificate.certified || certificate.certificationStatus !== "CERTIFIED") return { ok: false, errorCode: certificate.errorCode ?? RUNTIME_ERRORS.notCertified, certificate };
  if (executable && certificate.selectedRuntime?.executable !== executable) return { ok: false, errorCode: RUNTIME_ERRORS.notCertified, reason: "Requested executable does not match certified runtime", certificate };
  return { ok: true, certificate };
}
