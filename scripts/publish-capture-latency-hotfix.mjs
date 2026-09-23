import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const releaseDirectory = path.resolve(
  repo,
  "../output/releases/capture-latency-hotfix-2026-09-21"
);
const functionName =
  "projects/growgo-development/locations/australia-southeast1/functions/capturePin";
const cloudFunctionsApi = "https://cloudfunctions.googleapis.com/v2/";
const runtimeFiles = [
  "lib/api/capturePin.js",
  "lib/api/capturePin.js.map",
  "lib/domain/pins/authoritativePinAcquisition.js",
  "lib/domain/pins/authoritativePinAcquisition.js.map"
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const file = (name) => path.join(releaseDirectory, name);
const save = (name, value) =>
  writeFileSync(file(name), JSON.stringify(value, null, 2), { mode: 0o600 });
const load = (name) => JSON.parse(readFileSync(file(name), "utf8"));

const firebaseAuth = JSON.parse(
  readFileSync(
    "/Users/michaelpeterson/.config/configstore/firebase-tools.json",
    "utf8"
  )
);
assert.equal(firebaseAuth.user.email, "godspeed1074@gmail.com");
assert.ok(
  firebaseAuth.tokens.expires_at > Date.now() + 60_000,
  "Firebase login needs refreshing before this release."
);

async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${firebaseAuth.tokens.access_token}`,
      "Content-Type": "application/json"
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(45_000)
  });
  const result = await response.json();
  assert.ok(
    response.ok,
    `${response.status}: ${result.error?.message ?? "Cloud request failed"}`
  );
  return result;
}

async function downloadSource(functionDefinition) {
  const source = functionDefinition.buildConfig.source.storageSource;
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${source.bucket}/o/${encodeURIComponent(source.object)}?alt=media&generation=${source.generation}`,
    {
      headers: { Authorization: `Bearer ${firebaseAuth.tokens.access_token}` },
      signal: AbortSignal.timeout(45_000)
    }
  );
  assert.equal(response.status, 200, "Could not download the live capture source.");
  return Buffer.from(await response.arrayBuffer());
}

function settingsWithoutRevision(settings) {
  const { revision, ...withoutRevision } = settings;
  return withoutRevision;
}

async function prepare() {
  assert.ok(!existsSync(releaseDirectory), "Release directory already exists.");
  mkdirSync(releaseDirectory, { recursive: true });

  const before = await api(`${cloudFunctionsApi}${functionName}`);
  assert.equal(before.state, "ACTIVE");
  const source = await downloadSource(before);
  save("before.json", before);
  writeFileSync(file("capturePin-before.zip"), source, { mode: 0o600 });

  const candidateDirectory = file("candidate");
  mkdirSync(candidateDirectory);
  execFileSync("unzip", ["-q", file("capturePin-before.zip"), "-d", candidateDirectory]);

  for (const runtimeFile of runtimeFiles) {
    const localFile = path.join(repo, "functions", runtimeFile);
    const stagedFile = path.join(candidateDirectory, runtimeFile);
    assert.ok(existsSync(localFile), `Missing built file: ${runtimeFile}`);
    assert.ok(existsSync(stagedFile), `Live source missing expected file: ${runtimeFile}`);
    writeFileSync(stagedFile, readFileSync(localFile));
  }

  const changed = [];
  for (const runtimeFile of runtimeFiles) {
    const beforeBytes = execFileSync("unzip", ["-p", file("capturePin-before.zip"), runtimeFile]);
    const candidateBytes = readFileSync(path.join(candidateDirectory, runtimeFile));
    if (sha256(beforeBytes) !== sha256(candidateBytes)) changed.push(runtimeFile);
  }
  assert.deepEqual(
    changed.sort(),
    runtimeFiles.sort(),
    "The candidate must change only the two capture-runtime modules and maps."
  );

  execFileSync("zip", ["-q", "-r", file("capturePin-after.zip"), "."], {
    cwd: candidateDirectory
  });
  const manifest = {
    scope: "capturePin only",
    playerDataChanged: false,
    websiteChanged: false,
    beforeUpdateTime: before.updateTime,
    beforeSha256: sha256(source),
    afterSha256: sha256(readFileSync(file("capturePin-after.zip"))),
    changedRuntimeFiles: changed
  };
  save("manifest.json", manifest);
  console.log(JSON.stringify(manifest));
}

async function publish(rollback = false) {
  const before = load("before.json");
  const manifest = load("manifest.json");
  const current = await api(`${cloudFunctionsApi}${functionName}`);
  if (rollback) {
    assert.equal(
      sha256(await downloadSource(current)),
      manifest.afterSha256,
      "Current capture source is not this hotfix; do not overwrite it."
    );
  } else {
    assert.equal(
      current.updateTime,
      manifest.beforeUpdateTime,
      "capturePin changed after this release was prepared; re-prepare first."
    );
  }
  assert.deepEqual(
    settingsWithoutRevision(current.serviceConfig),
    settingsWithoutRevision(before.serviceConfig),
    "Function settings changed; stop rather than overwrite them."
  );

  const archiveName = rollback ? "capturePin-before.zip" : "capturePin-after.zip";
  const expectedHash = rollback ? manifest.beforeSha256 : manifest.afterSha256;
  const archive = readFileSync(file(archiveName));
  assert.equal(sha256(archive), expectedHash);
  const upload = await api(
    `${cloudFunctionsApi}projects/growgo-development/locations/australia-southeast1/functions:generateUploadUrl`,
    "POST",
    {}
  );
  const uploaded = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/zip" },
    body: archive,
    signal: AbortSignal.timeout(45_000)
  });
  assert.ok(uploaded.ok, `Source upload failed: ${uploaded.status}`);
  const operation = await api(
    `${cloudFunctionsApi}${functionName}?updateMask=buildConfig.source`,
    "PATCH",
    {
      name: current.name,
      buildConfig: { source: { storageSource: upload.storageSource } }
    }
  );
  save(rollback ? "rollback-operation.json" : "operation.json", operation);
  console.log(JSON.stringify({ scope: "capturePin only", rollback, operation: operation.name }));
}

async function status() {
  const operation = load("operation.json");
  const current = await api(`${cloudFunctionsApi}${operation.name}`);
  console.log(
    JSON.stringify({
      done: Boolean(current.done),
      error: current.error?.message,
      stages: current.metadata?.stages?.map(({ name, state }) => ({ name, state }))
    })
  );
  if (current.error) process.exitCode = 1;
}

async function verify() {
  const before = load("before.json");
  const manifest = load("manifest.json");
  const current = await api(`${cloudFunctionsApi}${functionName}`);
  assert.equal(current.state, "ACTIVE");
  assert.deepEqual(
    settingsWithoutRevision(current.serviceConfig),
    settingsWithoutRevision(before.serviceConfig),
    "A setting changed during the source-only release."
  );
  assert.equal(sha256(await downloadSource(current)), manifest.afterSha256);
  const probe = await fetch(current.serviceConfig.uri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: {} }),
    signal: AbortSignal.timeout(30_000)
  });
  assert.equal(probe.status, 401, "Authentication gate changed unexpectedly.");
  const result = {
    verified: true,
    revision: current.serviceConfig.revision,
    settingsUnchanged: true,
    authenticationGate: "passed",
    at: new Date().toISOString()
  };
  save("verified.json", result);
  console.log(JSON.stringify(result));
}

const mode = process.argv[2];
if (mode === "prepare") await prepare();
else if (mode === "publish") await publish();
else if (mode === "rollback") await publish(true);
else if (mode === "status") await status();
else if (mode === "verify") await verify();
else throw new Error("Use prepare, publish, status, verify, or rollback.");
