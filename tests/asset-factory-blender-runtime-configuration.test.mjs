import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const runtimeModule = await import(
  path.resolve(
    import.meta.dirname,
    "..",
    "asset-factory",
    "blender-runtime-configuration.mjs"
  )
);

test("Blender runtime configuration validates the default executable and GLB export contract", () => {
  const result = runtimeModule.validateBlenderRuntimeConfiguration();

  assert.equal(result.ok, true);
  assert.equal(
    result.runtimeConfiguration.configuration.executable.executableName,
    "blender"
  );
  assert.equal(
    result.runtimeConfiguration.configuration.exportConfiguration.format,
    "glb"
  );
});

test("Blender runtime detection resolves a supported Blender version safely", () => {
  const result = runtimeModule.detectBlenderRuntime(undefined, {
    execFileSync(executable, args) {
      assert.equal(executable, "blender");
      assert.deepEqual(args, ["--version"]);
      return "Blender 4.2.1 LTS\nbuild date: 2026-01-01";
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.runtimeDetection.version, "4.2.1");
  assert.equal(result.runtimeDetection.compatibility.versionSupported, true);
});

test("Blender runtime detection reports unavailable executables safely", () => {
  const result = runtimeModule.detectBlenderRuntime(undefined, {
    execFileSync() {
      const error = new Error("not found");
      error.code = "ENOENT";
      throw error;
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "blender_executable_unavailable");
});

test("Blender runtime detection rejects unsupported Blender versions safely", () => {
  const result = runtimeModule.detectBlenderRuntime(undefined, {
    execFileSync() {
      return "Blender 3.6.9";
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "unsupported_blender_version");
});

test("Blender runtime configuration rejects unsupported export format safely", () => {
  const invalidConfiguration = structuredClone(
    runtimeModule.blenderRuntimeConfigurationDefinition
  );
  invalidConfiguration.exportConfiguration.format = "gltf";

  const result =
    runtimeModule.validateBlenderRuntimeConfiguration(invalidConfiguration);

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "unsupported_export_format");
});
