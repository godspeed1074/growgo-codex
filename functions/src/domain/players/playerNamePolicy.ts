import { HttpsError } from "firebase-functions/v2/https";

/**
 * These values are deliberately kept server-side. The client only receives a
 * generic unavailable-name message, so the filter cannot be used to discover
 * the precise matching rule.
 */
const RESERVED_TITLE_TOKENS = new Set(["king", "queen"]);

// This is a small baseline guard for the private alpha. Before public beta it
// must be supplemented with a license-reviewed, maintained moderation list and
// a private operations denylist supplied through the deployment environment.
const BASELINE_BLOCKED_TOKENS = new Set([
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "dick",
  "fag",
  "faggot",
  "fuck",
  "fucktard",
  "motherfucker",
  "nigger",
  "shit",
  "slut",
  "whore"
]);

const LEET_REPLACEMENTS: Readonly<Record<string, string>> = Object.freeze({
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i"
});

export interface PlayerNameSafetyDecision {
  allowed: boolean;
  normalizedDisplayName: string;
  normalizedJoinedName: string;
  reason: "allowed" | "reserved-title" | "blocked-term";
}

export function normalizePlayerNameForModeration(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[013457@$!]/g, (character) => LEET_REPLACEMENTS[character] ?? character)
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/(.)\1{2,}/g, "$1$1");
}

export function evaluatePlayerNameSafety(
  value: string,
  options: { additionalBlockedTerms?: readonly string[] } = {}
): PlayerNameSafetyDecision {
  const normalizedDisplayName = value.trim().replace(/\s+/g, " ");
  const normalizedForModeration = normalizePlayerNameForModeration(normalizedDisplayName);
  const tokens = normalizedForModeration.split(" ").filter(Boolean);
  const joined = tokens.join("");
  const blockedTerms = new Set([
    ...BASELINE_BLOCKED_TOKENS,
    ...(options.additionalBlockedTerms ?? [])
      .map((term) => normalizePlayerNameForModeration(term).replaceAll(" ", ""))
      .filter(Boolean)
  ]);

  if (tokens.some((token) => RESERVED_TITLE_TOKENS.has(token))) {
    return {
      allowed: false,
      normalizedDisplayName,
      normalizedJoinedName: joined,
      reason: "reserved-title"
    };
  }

  const containsBlockedTerm = [...blockedTerms].some(
    (term) => tokens.includes(term) || joined === term || joined.startsWith(`${term}tard`)
  );

  return {
    allowed: !containsBlockedTerm,
    normalizedDisplayName,
    normalizedJoinedName: joined,
    reason: containsBlockedTerm ? "blocked-term" : "allowed"
  };
}

export function assertPlayerNameIsSafe(
  value: string,
  options: { additionalBlockedTerms?: readonly string[] } = {}
): PlayerNameSafetyDecision {
  const decision = evaluatePlayerNameSafety(value, options);

  if (!decision.allowed) {
    throw new HttpsError(
      "invalid-argument",
      "That name isn't available. Please choose another."
    );
  }

  return decision;
}

export function parseAdditionalBlockedTerms(rawValue: string | undefined): readonly string[] {
  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return Object.freeze([]);
  }

  return Object.freeze(
    rawValue
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean)
  );
}
