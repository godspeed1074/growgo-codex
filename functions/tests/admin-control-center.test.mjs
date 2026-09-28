import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("Mission Control roles are limited to Owner and Admin", async () => {
  const adminAccounts = await import(path.join(repoRoot, "functions/lib/domain/admin/adminAccounts.js"));

  assert.deepEqual(adminAccounts.adminRoles, ["owner", "admin"]);
  assert.equal(adminAccounts.isAdminRole("owner"), true);
  assert.equal(adminAccounts.isAdminRole("admin"), true);
  assert.equal(adminAccounts.isAdminRole("moderator"), false);
  assert.equal(adminAccounts.isAdminRole("player"), false);
  assert.equal(adminAccounts.isAdminRole("Owner"), false);
});

test("only an environment-configured Google account can bootstrap the first Owner", () => {
  const source = read("functions/src/api/adminControlCenter.ts");

  assert.match(source, /GROWGO_ADMIN_OWNER_EMAILS/);
  assert.match(source, /request\.auth\?\.token\?\.email/);
  assert.match(source, /configuredOwnerEmails\.includes\(email\)/);
  assert.match(source, /role: "owner"/);
});

test("the Owner email allowlist is exact, normalized, and empty when not configured", async () => {
  const controlCenter = await import(path.join(repoRoot, "functions/lib/api/adminControlCenter.js"));

  assert.deepEqual(controlCenter.readConfiguredOwnerEmails({}), []);
  assert.deepEqual(
    controlCenter.readConfiguredOwnerEmails({
      GROWGO_ADMIN_OWNER_EMAILS: "  Owner@One.Example , second@example.com "
    }),
    ["owner@one.example", "second@example.com"]
  );
});

test("the in-app staff form cannot grant Owner access", () => {
  const source = read("functions/src/api/adminControlCenter.ts");
  const html = read("index.html");

  assert.match(source, /payload\.role === "owner"/);
  assert.match(source, /Choose Admin access/);
  assert.doesNotMatch(html, /<option value="owner">/);
});

test("access-changing staff actions are written to the internal audit log", () => {
  const source = read("functions/src/api/adminControlCenter.ts");
  const auditLog = read("functions/src/domain/admin/adminAuditLog.ts");

  assert.match(source, /recordAdminAuditEvent/);
  assert.match(source, /admin_owner_bootstrapped/);
  assert.match(source, /admin_role_assigned/);
  assert.match(auditLog, /ADMIN_AUDIT_LOG_COLLECTION = "adminAuditLog"/);
});
