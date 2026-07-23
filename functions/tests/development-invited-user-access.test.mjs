import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function loadInviteModule() {
  return import(
    path.join(
      repoRoot,
      "functions/lib/security/requireInvitedUserAccess.js"
    )
  );
}

test("invite enforcement stays permissive when the explicit alpha gate is off", async () => {
  const inviteModule = await loadInviteModule();
  const decision = inviteModule.evaluateInvitedUserAccess({
    env: {
      GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "false"
    },
    authToken: {}
  });

  assert.equal(decision.enforced, false);
  assert.equal(decision.allowed, true);
  assert.equal(decision.denialReason, null);
});

test("invite enforcement denies missing email when the explicit alpha gate is on", async () => {
  const inviteModule = await loadInviteModule();
  const decision = inviteModule.evaluateInvitedUserAccess({
    env: {
      GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "true",
      GROWGO_DEVELOPMENT_ALLOWED_EMAILS: "player@example.com"
    },
    authToken: {
      email_verified: true,
      firebase: {
        sign_in_provider: "google.com"
      }
    }
  });

  assert.equal(decision.enforced, true);
  assert.equal(decision.allowed, false);
  assert.equal(decision.denialReason, "missing_email");
});

test("invite enforcement denies provider mismatch even for an allowlisted email", async () => {
  const inviteModule = await loadInviteModule();
  const decision = inviteModule.evaluateInvitedUserAccess({
    env: {
      GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "true",
      GROWGO_DEVELOPMENT_ALLOWED_EMAILS: "player@example.com"
    },
    authToken: {
      email: "player@example.com",
      email_verified: true,
      firebase: {
        sign_in_provider: "password"
      }
    }
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.denialReason, "provider_not_allowed");
});

test("invite enforcement allows a verified allowlisted Google account", async () => {
  const inviteModule = await loadInviteModule();
  const decision = inviteModule.evaluateInvitedUserAccess({
    env: {
      GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED: "true",
      GROWGO_DEVELOPMENT_ALLOWED_EMAILS:
        "player@example.com, second@example.com"
    },
    authToken: {
      email: "Player@example.com",
      email_verified: true,
      firebase: {
        sign_in_provider: "google.com"
      }
    }
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.email, "player@example.com");
});
