import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionEntrypoints = [
  "client/development-alpha-app.mjs",
  "client/friends-view.mjs",
  "client/pin-load-ahead.mjs",
  "client/player-mail-ui.mjs",
  "client/personal-mailbox.mjs"
];

function localImports(source) {
  const imports = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) imports.add(match[1]);
  }

  return [...imports].filter(specifier => specifier.startsWith("."));
}

function resolveLocalImport(importer, specifier) {
  const withoutQuery = specifier.split(/[?#]/, 1)[0];
  const resolved = path.resolve(path.dirname(importer), withoutQuery);
  return existsSync(resolved) ? resolved : null;
}

function productionBrowserModulePaths() {
  const pending = productionEntrypoints.map(entry => path.join(projectRoot, entry));
  const visited = new Set();

  while (pending.length > 0) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);

    const source = readFileSync(current, "utf8");
    for (const specifier of localImports(source)) {
      const resolved = resolveLocalImport(current, specifier);
      if (resolved) pending.push(resolved);
    }
  }

  return [...visited].map(file => path.relative(projectRoot, file).split(path.sep).join("/"));
}

test("production HTML and Vercel build omit the standalone Atlas report helper", () => {
  const html = readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const build = readFileSync(path.join(projectRoot, "scripts/prepare-vercel-deployment.mjs"), "utf8");

  assert.doesNotMatch(html, /custom25d-visual-passive-reports\.js/);
  assert.doesNotMatch(build, /"custom25d-visual-passive-reports\.js"/);
});

test("Vercel production browser-module graph does not import Atlas or asset-factory modules", () => {
  const modulePaths = productionBrowserModulePaths();
  const forbiddenModules = modulePaths.filter(file => /(^|\/)(?:[^/]*atlas[^/]*|asset-factory)(?:\/|$)/i.test(file));

  assert.deepEqual(forbiddenModules, []);
});
