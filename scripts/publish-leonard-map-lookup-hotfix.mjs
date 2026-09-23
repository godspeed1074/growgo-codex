import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const repo = path.resolve(import.meta.dirname, "..");
const output = path.resolve(repo, "../output/releases/leonard-location-scope-repair-2026-09-22");
const name = "projects/growgo-development/locations/australia-southeast1/functions/leonardQuest";
const apiRoot = "https://cloudfunctions.googleapis.com/v2/";
const runtimeFiles = [
  "lib/domain/quests/leonardAutomaticLocations.js",
  "lib/domain/quests/leonardAutomaticLocations.js.map",
  "lib/domain/quests/leonardDiscovery.js",
  "lib/domain/quests/leonardDiscovery.js.map"
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const at = (file) => path.join(output, file);
const save = (file, value) => writeFileSync(at(file), JSON.stringify(value, null, 2), { mode: 0o600 });
const load = (file) => JSON.parse(readFileSync(at(file), "utf8"));
const account = JSON.parse(readFileSync("/Users/michaelpeterson/.config/configstore/firebase-tools.json", "utf8"));
assert.equal(account.user.email, "godspeed1074@gmail.com");
assert.ok(account.tokens.expires_at > Date.now() + 60_000, "Firebase login needs refreshing.");

async function api(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${account.tokens.access_token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(45_000)
  });
  const result = await response.json();
  assert.ok(response.ok, `${response.status}: ${result.error?.message ?? "Cloud request failed"}`);
  return result;
}
async function source(functionDefinition) {
  const location = functionDefinition.buildConfig.source.storageSource;
  const response = await fetch(
    `https://storage.googleapis.com/storage/v1/b/${location.bucket}/o/${encodeURIComponent(location.object)}?alt=media&generation=${location.generation}`,
    { headers: { Authorization: `Bearer ${account.tokens.access_token}` }, signal: AbortSignal.timeout(45_000) }
  );
  assert.equal(response.status, 200, "Could not download the live Leonard source.");
  return Buffer.from(await response.arrayBuffer());
}
function settings(value) { const { revision, ...rest } = value; return rest; }

async function prepare() {
  assert.ok(!existsSync(output), "Release directory already exists.");
  mkdirSync(output, { recursive: true });
  const before = await api(`${apiRoot}${name}`);
  assert.equal(before.state, "ACTIVE");
  const beforeSource = await source(before);
  save("before.json", before);
  writeFileSync(at("before.zip"), beforeSource, { mode: 0o600 });
  const stage = at("candidate");
  mkdirSync(stage);
  execFileSync("unzip", ["-q", at("before.zip"), "-d", stage]);
  for (const runtimeFile of runtimeFiles) {
    const local = path.join(repo, "functions", runtimeFile);
    const current = path.join(stage, runtimeFile);
    assert.ok(existsSync(local), `Missing built file: ${runtimeFile}`);
    assert.ok(existsSync(current), `Live source missing: ${runtimeFile}`);
    writeFileSync(current, readFileSync(local));
  }
  const changed = runtimeFiles.filter((runtimeFile) =>
    hash(execFileSync("unzip", ["-p", at("before.zip"), runtimeFile])) !== hash(readFileSync(path.join(stage, runtimeFile)))
  );
  assert.deepEqual(changed.sort(), runtimeFiles.sort(), "Candidate includes an unexpected source change.");
  execFileSync("zip", ["-q", "-r", at("after.zip"), "."], { cwd: stage });
  const manifest = {
    scope: "leonardQuest only", playerDataChanged: false, websiteChanged: false,
    beforeUpdateTime: before.updateTime, beforeSha256: hash(beforeSource),
    afterSha256: hash(readFileSync(at("after.zip"))), changedRuntimeFiles: changed
  };
  save("manifest.json", manifest);
  console.log(JSON.stringify(manifest));
}
async function publish(rollback = false) {
  const before = load("before.json"), manifest = load("manifest.json"), current = await api(`${apiRoot}${name}`);
  if (rollback) assert.equal(hash(await source(current)), manifest.afterSha256, "Current source is not this release.");
  else assert.equal(current.updateTime, manifest.beforeUpdateTime, "Live function changed; prepare a new release.");
  assert.deepEqual(settings(current.serviceConfig), settings(before.serviceConfig), "Function settings changed; stop.");
  const archive = readFileSync(at(rollback ? "before.zip" : "after.zip"));
  assert.equal(hash(archive), rollback ? manifest.beforeSha256 : manifest.afterSha256);
  const upload = await api(`${apiRoot}projects/growgo-development/locations/australia-southeast1/functions:generateUploadUrl`, "POST", {});
  const uploaded = await fetch(upload.uploadUrl, { method: "PUT", headers: { "Content-Type": "application/zip" }, body: archive, signal: AbortSignal.timeout(45_000) });
  assert.ok(uploaded.ok, `Source upload failed: ${uploaded.status}`);
  const operation = await api(`${apiRoot}${name}?updateMask=buildConfig.source`, "PATCH", {
    name: current.name, buildConfig: { source: { storageSource: upload.storageSource } }
  });
  save(rollback ? "rollback-operation.json" : "operation.json", operation);
  console.log(JSON.stringify({ scope: "leonardQuest only", rollback, operation: operation.name }));
}
async function status() {
  const operation = await api(`${apiRoot}${load("operation.json").name}`);
  console.log(JSON.stringify({ done: Boolean(operation.done), error: operation.error?.message, stages: operation.metadata?.stages?.map(({ name, state }) => ({ name, state })) }));
  if (operation.error) process.exitCode = 1;
}
async function verify() {
  const before = load("before.json"), manifest = load("manifest.json"), current = await api(`${apiRoot}${name}`);
  assert.equal(current.state, "ACTIVE");
  assert.deepEqual(settings(current.serviceConfig), settings(before.serviceConfig), "Function settings changed during release.");
  assert.equal(hash(await source(current)), manifest.afterSha256);
  const probe = await fetch(current.serviceConfig.uri, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: {} }), signal: AbortSignal.timeout(30_000) });
  assert.equal(probe.status, 401, "Authentication gate changed unexpectedly.");
  const result = { verified: true, revision: current.serviceConfig.revision, settingsUnchanged: true, authenticationGate: "passed", at: new Date().toISOString() };
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
