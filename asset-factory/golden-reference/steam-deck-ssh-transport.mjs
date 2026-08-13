import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { canonicalJson, WorkerContractError } from "./external-blender-worker-contract.mjs";

export const STEAM_DECK_PROFILE_ID = "STEAM_DECK_BLENDER_FLATPAK";
export const STEAM_DECK_BLENDER_INVOCATION = Object.freeze(["flatpak", "run", "org.blender.Blender"]);
const fail = (code, message, details = {}) => { throw new WorkerContractError(code, message, details); };
const sha256 = value => createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value)).digest("hex");

export function parseSteamDeckWorkerProfile(input = {}) {
  for (const field of ["host", "user", "remoteWorkerRoot"]) if (!input[field]) fail("STEAM_DECK_PROFILE_INVALID", `${field} is required`);
  return Object.freeze({ profileId: input.profileId ?? STEAM_DECK_PROFILE_ID, transportType: "SSH_SFTP", host: String(input.host), user: String(input.user), port: Number(input.port ?? 22), remoteWorkerRoot: String(input.remoteWorkerRoot), runtimeId: input.runtimeId ?? "STEAM-DECK-BLENDER-FLATPAK", blenderInvocation: [...STEAM_DECK_BLENDER_INVOCATION], identityFile: input.identityFile ?? null });
}

function target(profile) { return `${profile.user}@${profile.host}`; }
function run(command, args, options = {}, runner = spawnSync) { const result = runner(command, args, { encoding: "utf8", timeout: options.timeout ?? 120000, maxBuffer: 20 * 1024 * 1024 }); if (result.error || result.status !== 0) fail("STEAM_DECK_TRANSPORT_FAIL", result.error?.message ?? `${command} exited ${result.status}`, { stderr: result.stderr ?? "" }); return result; }
function sshArgs(profile, remoteCommand) { return [...(profile.identityFile ? ["-i", profile.identityFile] : []), "-p", String(profile.port), target(profile), remoteCommand]; }
function scpArgs(profile, source, destination) { return [...(profile.identityFile ? ["-i", profile.identityFile] : []), "-P", String(profile.port), "-r", source, `${target(profile)}:${destination}`]; }

export function createSteamDeckAudit({ profile, transportJobId, workerJobId, packageChecksum, status, reason = null, at = new Date().toISOString() }) { return { auditVersion: "GG-STEAM-DECK-WORKER-AUDIT-1.0.0", at, remoteHost: profile.host, remoteUser: profile.user, runtimeProfile: profile.profileId, runtimeInvocation: profile.blenderInvocation, transportType: profile.transportType, transportJobId, workerJobId, packageChecksum, status, reason }; }

export function dispatchToSteamDeck({ packageRoot, transportPackage, profile: profileInput, remoteResultRoot = null, runner = spawnSync, now = new Date().toISOString(), executeRemote = true }) {
  const profile = parseSteamDeckWorkerProfile(profileInput); if (!fs.existsSync(packageRoot)) fail("TRANSPORT_PACKAGE_INVALID", "Local worker package is missing");
  const remoteRoot = remoteResultRoot ?? `${profile.remoteWorkerRoot}/${transportPackage.envelope.transportJobId}`; const remotePackage = `${remoteRoot}/input`; const remoteOutput = `${remoteRoot}/output`;
  run("ssh", sshArgs(profile, `mkdir -p ${shellQuote(remotePackage)} ${shellQuote(remoteOutput)}`), {}, runner); run("scp", scpArgs(profile, packageRoot, remotePackage), {}, runner);
  const dispatchReceipt = { transportVersion: "GG-BLENDER-WORKER-TRANSPORT-1.0.0", transportJobId: transportPackage.envelope.transportJobId, workerJobId: transportPackage.envelope.workerJobId, packageChecksum: transportPackage.packageChecksum, transportType: "SSH_SFTP", destinationId: `${profile.user}@${profile.host}`, runtimeProfile: profile.profileId, dispatchedAt: now, artifactCount: transportPackage.manifest.artifactCount, status: "DISPATCHED" };
  if (executeRemote) { const command = `node worker-entry.mjs --package ${shellQuote(remotePackage)} --output ${shellQuote(remoteOutput)} --blender ${shellQuote(profile.blenderInvocation.join(" "))}`; run("ssh", sshArgs(profile, command), {}, runner); }
  const audit = createSteamDeckAudit({ profile, transportJobId: transportPackage.envelope.transportJobId, workerJobId: transportPackage.envelope.workerJobId, packageChecksum: transportPackage.packageChecksum, status: executeRemote ? "REMOTE_EXECUTED" : "DISPATCHED", at: now });
  return { profile, dispatchReceipt, audit, remotePackage, remoteOutput, transportJobId: transportPackage.envelope.transportJobId };
}

export function collectSteamDeckResult({ dispatch, localResultRoot, runner = spawnSync, now = new Date().toISOString() }) {
  const profile = dispatch.profile; fs.mkdirSync(localResultRoot, { recursive: true }); run("scp", [...(profile.identityFile ? ["-i", profile.identityFile] : []), "-P", String(profile.port), "-r", `${target(profile)}:${dispatch.remoteOutput}/.`, localResultRoot], {}, runner);
  const manifest = path.join(localResultRoot, "ARTIFACT_MANIFEST.json"); if (!fs.existsSync(manifest)) fail("WORKER_RESULT_MISSING", "Steam Deck result manifest was not returned"); const returned = JSON.parse(fs.readFileSync(manifest, "utf8")); const checksums = returned.artifacts.map(item => ({ logicalId: item.logicalId, filename: item.filename, checksum: item.checksum, byteSize: item.byteSize })); const audit = { ...dispatch.audit, status: "RESULT_COLLECTED", collectedAt: now, returnedArtifactChecksums: checksums, returnedManifestChecksum: sha256(returned.artifacts) }; fs.writeFileSync(path.join(localResultRoot, "STEAM_DECK_RESULT_AUDIT.json"), `${canonicalJson(audit)}\n`); return { localResultRoot, manifest: returned, audit };
}

function shellQuote(value) { return `'${String(value).replaceAll("'", "'\\''")}'`; }
