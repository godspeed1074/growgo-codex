import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {stampRelease} from './stamp-release-version.mjs';
import {verifyBrowserModuleGraph} from './verify-browser-module-graph.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputDirectory = path.join(projectDirectory, "dist");

const rootFiles = [
  "index.html",
  "fishy-business-preview.html",
  "style.css",
  "script.js",
  "development-alpha-client-config.js",
  "manifest.webmanifest",
  "pin-base-blue.svg",
  "pin-base-blue.png",
  "pin-base-purple.png",
  "pin-water-blue.png",
];

function copyToOutput(sourcePath) {
  const relativePath = path.relative(projectDirectory, sourcePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to publish a file outside the project: ${sourcePath}`);
  }

  const destinationPath = path.join(outputDirectory, relativePath);
  mkdirSync(path.dirname(destinationPath), { recursive: true });
  copyFileSync(sourcePath, destinationPath);
}

function collectModuleSpecifiers(moduleSource) {
  const specifiers = new Set();
  const fromPattern = /\bfrom\s*["']([^"']+)["']/g;
  const sideEffectImportPattern = /\bimport\s*["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const pattern of [fromPattern, sideEffectImportPattern, dynamicImportPattern]) {
    for (const match of moduleSource.matchAll(pattern)) {
      specifiers.add(match[1]);
    }
  }

  return [...specifiers];
}

function resolveLocalModule(fromFile, rawSpecifier) {
  if (!rawSpecifier.startsWith(".") && !rawSpecifier.startsWith("/")) {
    return null;
  }

  const specifier = rawSpecifier.split(/[?#]/, 1)[0];
  const candidate = rawSpecifier.startsWith("/")
    ? path.join(projectDirectory, specifier)
    : path.resolve(path.dirname(fromFile), specifier);

  if (!existsSync(candidate) || !statSync(candidate).isFile()) {
    throw new Error(`Missing browser module ${rawSpecifier} imported by ${path.relative(projectDirectory, fromFile)}`);
  }

  return candidate;
}

function copyBrowserModuleGraph(entryRelativePath) {
  const pendingFiles = [path.join(projectDirectory, entryRelativePath)];
  const copiedFiles = new Set();

  while (pendingFiles.length > 0) {
    const modulePath = pendingFiles.pop();
    const moduleKey = path.normalize(modulePath);

    if (copiedFiles.has(moduleKey)) {
      continue;
    }

    copiedFiles.add(moduleKey);
    copyToOutput(modulePath);

    for (const specifier of collectModuleSpecifiers(readFileSync(modulePath, "utf8"))) {
      const localModule = resolveLocalModule(modulePath, specifier);

      if (localModule) {
        pendingFiles.push(localModule);
      }
    }
  }

  return copiedFiles.size;
}

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });

for (const fileName of rootFiles) {
  copyToOutput(path.join(projectDirectory, fileName));
}

for (const directoryName of ["assets"]) {
  cpSync(path.join(projectDirectory, directoryName), path.join(outputDirectory, directoryName), {
    recursive: true,
  });
}

const moduleCount = copyBrowserModuleGraph("client/development-alpha-app.mjs")
  + copyBrowserModuleGraph("client/friends-view.mjs")
  + copyBrowserModuleGraph("client/pin-load-ahead.mjs")
  + copyBrowserModuleGraph("client/player-mail-ui.mjs")
  + copyBrowserModuleGraph("client/personal-mailbox.mjs");
await stampRelease(projectDirectory,outputDirectory);
verifyBrowserModuleGraph(outputDirectory);
console.log(`Prepared ${moduleCount} browser modules in ${path.relative(projectDirectory, outputDirectory)}.`);
