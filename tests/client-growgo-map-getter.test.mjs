import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const repoRoot = path.resolve(import.meta.dirname, "..");
const scriptSource = fs.readFileSync(path.join(repoRoot, "script.js"), "utf8");

const getterBlockMatch = scriptSource.match(
  /\/\* GROWGO MAP GETTER DIAGNOSTIC START \*\/([\s\S]*?)\/\* GROWGO MAP GETTER DIAGNOSTIC END \*\//
);

const bootstrapBlockMatch = scriptSource.match(
  /function bootstrapGrowGoDeveloperDiagnosticsForLocalDev\(options = \{\}\) \{[\s\S]*?\n\}\n\nbootstrapGrowGoDeveloperDiagnosticsForLocalDev\(\{\n  localDevBootstrap: true\n\}\);/
);

async function loadAtlasAdapter() {
  return import(path.join(repoRoot, "client", "developer-only-atlas-map-adapter.mjs"));
}

function loadGrowGoMapGetterHarness({
  mapValue = null,
  hostname = "localhost",
  includeWindow = true
} = {}) {
  assert.ok(getterBlockMatch, "growgo map getter block should exist in script.js");
  assert.ok(
    bootstrapBlockMatch,
    "growgo map getter bootstrap should exist in script.js"
  );

  const windowObject = includeWindow
    ? {
        location: {
          hostname,
          href: `http://${hostname}/`
        }
      }
    : undefined;

  const context = vm.createContext({
    module: { exports: {} },
    exports: {},
    console,
    Object,
    String,
    Boolean,
    globalThis: null,
    __mapValue: mapValue,
    window: windowObject
  });

  context.globalThis = context;

  vm.runInContext(
    `
let map = __mapValue;
function getCustom25DOneFrameBridge() {
  return null;
}
function traceAtlasOneFrameCall(functionName, callback) {
  return callback();
}
${getterBlockMatch[1]}
${bootstrapBlockMatch[0]}
module.exports = {
  getGrowGoMap,
  bootstrapGrowGoDeveloperDiagnosticsForLocalDev,
  getWindowNamespace() {
    return typeof window !== "undefined" ? window.GrowGoDeveloperDiagnostics ?? null : null;
  },
  setMapForTest(nextMap) {
    map = nextMap;
  }
};
`,
    context
  );

  return {
    helpers: context.module.exports,
    context
  };
}

test("getter exists and returns fail-closed null before map initialization", () => {
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: null
  });

  assert.equal(typeof helpers.getGrowGoMap, "function");
  assert.equal(helpers.getGrowGoMap(), null);
});

test("getter returns the owned map instance after initialization", () => {
  const ownedMap = Object.freeze({
    id: "leaflet-map-instance"
  });
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: ownedMap
  });

  assert.equal(helpers.getGrowGoMap(), ownedMap);
});

test("repeated calls return the same instance", () => {
  const ownedMap = {
    id: "leaflet-map-instance"
  };
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: ownedMap
  });

  const first = helpers.getGrowGoMap();
  const second = helpers.getGrowGoMap();

  assert.equal(first, ownedMap);
  assert.equal(second, ownedMap);
  assert.equal(first, second);
});

test("getter does not create a map and does not mutate the owned instance", () => {
  const ownedMap = Object.freeze({
    id: "leaflet-map-instance",
    onCallCount: 0
  });
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: ownedMap
  });

  const result = helpers.getGrowGoMap();
  assert.equal(result, ownedMap);
  assert.deepEqual(result, ownedMap);
});

test("getter bootstrap exposes a developer-only namespace on local dev hosts", () => {
  const ownedMap = {
    id: "leaflet-map-instance"
  };
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: ownedMap,
    hostname: "localhost"
  });

  const namespace = helpers.getWindowNamespace();
  assert.ok(namespace);
  assert.equal(namespace.available, true);
  assert.equal(namespace.localDev, true);
  assert.equal(typeof namespace.getGrowGoMap, "function");
  assert.equal(namespace.getGrowGoMap(), ownedMap);
});

test("getter bootstrap fails closed outside local dev hosts", () => {
  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: { id: "leaflet-map-instance" },
    hostname: "growgo.app"
  });

  const result = helpers.bootstrapGrowGoDeveloperDiagnosticsForLocalDev({
    localDevBootstrap: true
  });
  assert.equal(result.attached, false);
  assert.equal(result.reason, "local-dev-host-required");
});

test("getter source adds no listeners and triggers no atlas or renderer work", () => {
  const getterSurfaceSource = `${getterBlockMatch?.[1] ?? ""}\n${bootstrapBlockMatch?.[0] ?? ""}`;

  assert.doesNotMatch(getterSurfaceSource, /\.on\(/);
  assert.doesNotMatch(getterSurfaceSource, /addEventListener/);
  assert.doesNotMatch(getterSurfaceSource, /getAtlasMapDiagnostic/);
  assert.doesNotMatch(getterSurfaceSource, /custom25DVisualManualRendererState/);
  assert.doesNotMatch(getterSurfaceSource, /L\.map\(/);
});

test("getter leaves atlas safety flags unchanged", async () => {
  const atlasAdapterModule = await loadAtlasAdapter();
  const adapter = atlasAdapterModule.createDeveloperOnlyAtlasMapAdapter({
    cwd: repoRoot
  });
  const before = adapter.getSafetyFlags();

  const { helpers } = loadGrowGoMapGetterHarness({
    mapValue: { id: "leaflet-map-instance" }
  });
  helpers.getGrowGoMap();

  const after = adapter.getSafetyFlags();
  assert.deepEqual(after, before);
  assert.equal(after.runtimeExecutionEnabled, false);
  assert.equal(after.mapAttachmentAllowed, false);
  assert.equal(after.automaticRendererExecutionAllowed, false);
  assert.equal(after.lifecycleExecutionEnabled, false);
});
