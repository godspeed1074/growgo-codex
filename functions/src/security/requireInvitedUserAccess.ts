import { HttpsError, type CallableRequest } from "firebase-functions/v2/https";

export const GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED" as const;
export const GROWGO_DEVELOPMENT_ALLOWED_EMAILS_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_ALLOWED_EMAILS" as const;
export const GROWGO_DEVELOPMENT_ALLOWED_AUTH_PROVIDER_VARIABLE_NAME =
  "GROWGO_DEVELOPMENT_ALLOWED_AUTH_PROVIDER" as const;

export const DEVELOPMENT_INVITED_ALPHA_CLIENT_MESSAGE =
  "This invited alpha is not available for the current account." as const;

interface InvitedUserAccessEvaluationParams {
  env?: Readonly<Record<string, string | undefined>>;
  authToken?: {
    email?: unknown;
    email_verified?: unknown;
    firebase?: {
      sign_in_provider?: unknown;
    };
  } | null;
}

type InvitedUserAccessDenialReason =
  | "missing_email"
  | "email_not_verified"
  | "provider_not_allowed"
  | "allowlist_missing"
  | "email_not_allowlisted";

export function evaluateInvitedUserAccess(
  params: InvitedUserAccessEvaluationParams
) {
  const env = params?.env ?? process.env;
  const enforced =
    readTrimmedEnvValue(
      env,
      GROWGO_DEVELOPMENT_INVITED_ALPHA_ENFORCED_VARIABLE_NAME
    ) === "true";
  const requiredProvider =
    readTrimmedEnvValue(
      env,
      GROWGO_DEVELOPMENT_ALLOWED_AUTH_PROVIDER_VARIABLE_NAME
    ) ?? "google.com";
  const allowedEmails = parseAllowedEmails(
    readTrimmedEnvValue(env, GROWGO_DEVELOPMENT_ALLOWED_EMAILS_VARIABLE_NAME)
  );
  const email = normalizeEmail(params?.authToken?.email);
  const emailVerified = params?.authToken?.email_verified === true;
  const providerId =
    typeof params?.authToken?.firebase?.sign_in_provider === "string"
      ? params.authToken.firebase.sign_in_provider
      : null;

  if (!enforced) {
    return Object.freeze({
      enforced: false,
      allowed: true,
      denialReason: null,
      email,
      providerId,
      requiredProvider,
      allowedEmails
    });
  }

  if (email == null) {
    return freezeDenied("missing_email");
  }

  if (!emailVerified) {
    return freezeDenied("email_not_verified");
  }

  if (providerId !== requiredProvider) {
    return freezeDenied("provider_not_allowed");
  }

  if (allowedEmails.length === 0) {
    return freezeDenied("allowlist_missing");
  }

  if (!allowedEmails.includes(email)) {
    return freezeDenied("email_not_allowlisted");
  }

  return Object.freeze({
    enforced: true,
    allowed: true,
    denialReason: null,
    email,
    providerId,
    requiredProvider,
    allowedEmails
  });

  function freezeDenied(denialReason: InvitedUserAccessDenialReason) {
    return Object.freeze({
      enforced: true,
      allowed: false,
      denialReason,
      email,
      providerId,
      requiredProvider,
      allowedEmails
    });
  }
}

export function requireInvitedUserAccess(
  request: CallableRequest<unknown>,
  options: {
    env?: Readonly<Record<string, string | undefined>>;
  } = {}
) {
  const decision = evaluateInvitedUserAccess({
    env: options.env,
    authToken: request?.auth?.token
  });

  if (!decision.allowed) {
    throw new HttpsError(
      "permission-denied",
      DEVELOPMENT_INVITED_ALPHA_CLIENT_MESSAGE
    );
  }

  return decision;
}

function parseAllowedEmails(rawValue: string | null) {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return Object.freeze([]);
  }

  return Object.freeze(
    rawValue
      .split(",")
      .map((value) => normalizeEmail(value))
      .filter(Boolean)
  );
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function readTrimmedEnvValue(
  env: Readonly<Record<string, string | undefined>>,
  key: string
) {
  const value = env?.[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
