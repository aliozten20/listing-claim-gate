import type { Messages } from "./messages";

/** Legacy English prose from older API builds → message keys. */
const LEGACY_INSIGHTS: Record<string, keyof Messages> = {
  "Title is very short; aim for ~12+ characters for search and conversion.":
    "insight_title_too_short",
  "Title is very long; watch marketplace character limits.": "insight_title_too_long",
  "Description is thin; add material, fit/use, and care details.":
    "insight_description_too_short",
  "Restrictive return language can hurt trust and compliance.":
    "insight_restrictive_return_policy",
  "Listing passed basic quality checks.": "insight_passed_basic",
};

/**
 * Maps Gate insight codes (and legacy English strings) to the active locale.
 * Codes: title_too_short | risky_claims|a,b | passed_basic | …
 */
export function formatInsight(raw: string, t: Messages): string {
  const legacy = LEGACY_INSIGHTS[raw];
  if (legacy) return t[legacy];

  if (raw.startsWith("risky_claims|")) {
    const claims = raw.slice("risky_claims|".length);
    return t.insight_risky_claims.replace("{claims}", claims);
  }
  if (raw.startsWith("Unsubstantiated / high-risk claim signal:")) {
    const claims = raw.replace(/^Unsubstantiated \/ high-risk claim signal:\s*/i, "");
    return t.insight_risky_claims.replace("{claims}", claims);
  }

  const key = `insight_${raw}` as keyof Messages;
  if (key in t) return t[key] as string;
  return raw;
}

export function formatFlag(flag: string, t: Messages): string {
  const key = `flag_${flag}` as keyof Messages;
  if (key in t) return t[key] as string;
  return flag.replace(/_/g, " ");
}

export function formatRationale(rationale: string, t: Messages): string {
  if (rationale.startsWith("Listing Gate commerce score:")) {
    return t.scoreRationalePrefix + rationale.slice("Listing Gate commerce score:".length);
  }
  return rationale;
}
