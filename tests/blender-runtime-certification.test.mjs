import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { certifyBlenderRuntime, detectRuntimeHost, discoverBlenderExecutables, requireCertifiedBlenderRuntime, selectBlenderRuntime } from "../asset-factory/golden-reference/blender-runtime-certification.mjs";

test("runtime host detection reports architecture and Rosetta state", () => {
  const host = detectRuntimeHost(); assert.ok(host.hostArchitecture); assert.ok(typeof host.rosettaTranslationActive === "boolean");
});
test("Blender discovery reports executable architectures", () => {
  const runtimes = discoverBlenderExecutables(); assert.ok(Array.isArray(runtimes)); for (const runtime of runtimes) assert.ok(["arm64", "x86_64", "unknown"].includes(runtime.architecture));
});
test("runtime selection is deterministic and rejects incompatible architecture", () => {
  const result = selectBlenderRuntime(); assert.ok(result.selected || result.errorCode); if (result.selected && result.selected.architecture !== result.host.hostArchitecture) assert.equal(result.errorCode, "BLENDER_ARCHITECTURE_INCOMPATIBLE");
});
test("runtime certificate is machine-readable and never claims blocked runtime certification", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-runtime-cert-")); const certificatePath = path.join(dir, "BLENDER_RUNTIME_CERTIFICATE.json"); const certificate = certifyBlenderRuntime({ certificatePath, outputDir: dir }); assert.equal(fs.existsSync(certificatePath), true); assert.equal(JSON.parse(fs.readFileSync(certificatePath, "utf8")).certificateVersion, "GG-BLENDER-RUNTIME-CERTIFICATE-1.0.0"); if (certificate.certificationStatus === "BLOCKED") assert.equal(certificate.certified, false);
});
test("uncertified runtime is rejected by the bridge gate", () => {
  const result = requireCertifiedBlenderRuntime({ certificatePath: "/tmp/does-not-exist-growgo-runtime-certificate.json" }); assert.equal(result.ok, false); assert.equal(result.errorCode, "BLENDER_RUNTIME_NOT_CERTIFIED");
});
