import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const indexSource = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
const developmentAlphaAppSource = fs.readFileSync(
  path.join(repoRoot, "client", "development-alpha-app.mjs"),
  "utf8"
);
const adapterSource = fs.readFileSync(
  path.join(repoRoot, "client", "developer-only-growgo-custom25d-live-one-frame-adapter.mjs"),
  "utf8"
);

test("phase 211.50am cache bust wires the development alpha module entry through a versioned URL", () => {
  assert.match(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs\?v=atlas21213k"><\/script>/
  );
  assert.doesNotMatch(
    indexSource,
    /<script type="module" src="client\/development-alpha-app\.mjs\?v=atlas21150x"><\/script>/
  );
});

test("phase 211.50am cache bust wires the live one-frame adapter import through a versioned URL", () => {
  assert.match(
    developmentAlphaAppSource,
    /from "\.\/developer-only-growgo-custom25d-live-one-frame-adapter\.mjs\?v=atlas21150am"/
  );
  assert.doesNotMatch(
    developmentAlphaAppSource,
    /from "\.\/developer-only-growgo-custom25d-live-one-frame-adapter\.mjs\?v=atlas21150x"/
  );
});

test("phase 211.50am cache bust wires the lifecycle translation dependency through a versioned URL", () => {
  assert.match(
    adapterSource,
    /from "\.\/growgo-custom25d-one-frame-surface-lifecycle-translation\.mjs\?v=atlas21150al"/
  );
  assert.doesNotMatch(
    adapterSource,
    /from "\.\/growgo-custom25d-one-frame-surface-lifecycle-translation\.mjs"(?!\?v=atlas21150al)/
  );
});
