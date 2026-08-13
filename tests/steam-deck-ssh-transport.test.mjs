import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseSteamDeckWorkerProfile, dispatchToSteamDeck, collectSteamDeckResult, STEAM_DECK_BLENDER_INVOCATION } from "../asset-factory/golden-reference/steam-deck-ssh-transport.mjs";
import { WorkerContractError } from "../asset-factory/golden-reference/external-blender-worker-contract.mjs";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "growgo-steam-deck-"));
const profile = { host: "steamdeck.local", user: "deck", remoteWorkerRoot: "/home/deck/growgo-worker", identityFile: "/tmp/fixture-key" };
const pkg = { envelope: { transportJobId: "T-001", workerJobId: "W-001" }, packageChecksum: "abc", manifest: { artifactCount: 1 }, root: root };
function expectCode(fn, code) { assert.throws(fn, e => e instanceof WorkerContractError && e.code === code); }
function fakeRunner(command, args) { assert.ok(["ssh", "scp"].includes(command)); return { status: 0, stdout: "", stderr: "" }; }

test("Steam Deck profile uses SSH/SFTP and Flatpak Blender invocation", () => { const p = parseSteamDeckWorkerProfile(profile); assert.equal(p.transportType, "SSH_SFTP"); assert.deepEqual(p.blenderInvocation, STEAM_DECK_BLENDER_INVOCATION); assert.equal(p.runtimeId, "STEAM-DECK-BLENDER-FLATPAK"); });
test("profile requires explicit host, user and remote root", () => expectCode(() => parseSteamDeckWorkerProfile({}), "STEAM_DECK_PROFILE_INVALID"));
test("dispatch builds deterministic remote package destination and receipt", () => { const d = dispatchToSteamDeck({ packageRoot: root, transportPackage: pkg, profile, runner: fakeRunner, executeRemote: false, now: "2026-01-01T00:00:00Z" }); assert.equal(d.dispatchReceipt.transportType, "SSH_SFTP"); assert.equal(d.dispatchReceipt.destinationId, "deck@steamdeck.local"); assert.equal(d.remotePackage, "/home/deck/growgo-worker/T-001/input"); assert.equal(d.audit.remoteHost, "steamdeck.local"); });
test("remote worker invocation is fixed to worker entry and does not accept package shell authority", () => { const calls = []; const runner = (command, args) => { calls.push([command, args]); return { status: 0, stdout: "", stderr: "" }; }; dispatchToSteamDeck({ packageRoot: root, transportPackage: pkg, profile, runner, executeRemote: true }); const remote = calls.find(call => call[0] === "ssh" && call[1].join(" ").includes("worker-entry.mjs")); assert.ok(remote); assert.match(remote[1].join(" "), /--blender 'flatpak run org\.blender\.Blender'/); });
test("result collection validates manifest presence and records returned checksums", () => { const resultRoot = path.join(root, "result"); fs.mkdirSync(resultRoot); const manifest = { artifacts: [{ logicalId: "BLENDER_RENDER", filename: "BLENDER_RENDER.png", checksum: "sha", byteSize: 3 }] }; fs.writeFileSync(path.join(resultRoot, "ARTIFACT_MANIFEST.json"), JSON.stringify(manifest)); const d = { profile: parseSteamDeckWorkerProfile(profile), remoteOutput: "/home/deck/growgo-worker/T-001/output", audit: { remoteHost: "steamdeck.local" } }; const c = collectSteamDeckResult({ dispatch: d, localResultRoot: resultRoot, runner: fakeRunner }); assert.equal(c.audit.status, "RESULT_COLLECTED"); assert.equal(c.audit.returnedArtifactChecksums[0].logicalId, "BLENDER_RENDER"); });
test("missing local package is rejected before SSH", () => expectCode(() => dispatchToSteamDeck({ packageRoot: path.join(root, "missing"), transportPackage: pkg, profile, runner: fakeRunner }), "TRANSPORT_PACKAGE_INVALID"));
test("transport remains additive and does not claim local acceptance", () => { const d = dispatchToSteamDeck({ packageRoot: root, transportPackage: pkg, profile, runner: fakeRunner, executeRemote: false }); assert.notEqual(d.dispatchReceipt.status, "ACCEPTED"); });
