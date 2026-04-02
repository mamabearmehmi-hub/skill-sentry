/**
 * Verified Publishers — known legitimate organizations.
 *
 * These orgs are expected to use child_process, env vars, etc.
 * because their tools genuinely need those capabilities.
 *
 * Findings are still shown, but the verdict is adjusted:
 * instead of "DO NOT INSTALL" it says "Verified publisher —
 * findings are expected for this type of tool."
 *
 * This list should grow as the community verifies more publishers.
 */

export const VERIFIED_PUBLISHERS: Record<
  string,
  { name: string; reason: string }
> = {
  anthropics: {
    name: "Anthropic",
    reason: "Official Claude/MCP maintainer",
  },
  modelcontextprotocol: {
    name: "Model Context Protocol",
    reason: "Official MCP specification and SDKs",
  },
  stripe: {
    name: "Stripe",
    reason: "Payment infrastructure — needs API keys by design",
  },
  github: {
    name: "GitHub",
    reason: "Official GitHub MCP server",
  },
  "supabase-community": {
    name: "Supabase Community",
    reason: "Database tools — needs auth tokens by design",
  },
  upstash: {
    name: "Upstash",
    reason: "Database/cache infrastructure",
  },
  "browserbase": {
    name: "Browserbase",
    reason: "Browser automation — needs child_process by design",
  },
  "executeautomation": {
    name: "Execute Automation",
    reason: "Playwright MCP — needs child_process for browser launch",
  },
  apify: {
    name: "Apify",
    reason: "Web scraping platform — needs API tokens by design",
  },
  "exa-labs": {
    name: "Exa",
    reason: "Search API — needs API keys by design",
  },
  "tavily-ai": {
    name: "Tavily",
    reason: "Search API — needs API keys by design",
  },
  stacklok: {
    name: "Stacklok",
    reason: "Security tooling provider",
  },
};

/**
 * Known legitimate org names for typosquat detection.
 * Lowercase for comparison.
 */
const KNOWN_ORGS = Object.keys(VERIFIED_PUBLISHERS);

/**
 * Check if a repo owner is a verified publisher.
 */
export function isVerifiedPublisher(owner: string): boolean {
  return owner.toLowerCase() in VERIFIED_PUBLISHERS;
}

/**
 * Get verified publisher info.
 */
export function getPublisherInfo(
  owner: string
): { name: string; reason: string } | null {
  return VERIFIED_PUBLISHERS[owner.toLowerCase()] ?? null;
}

/**
 * Detect potential typosquatting — when a repo owner looks
 * suspiciously similar to a known legitimate org.
 *
 * Uses Levenshtein distance: if the owner is within 2 edits
 * of a known org but ISN'T that org, it's suspicious.
 *
 * Examples:
 *   "stripe" → verified (exact match)
 *   "stripee" → TYPOSQUAT WARNING (1 edit from "stripe")
 *   "str1pe" → TYPOSQUAT WARNING (1 edit from "stripe")
 *   "supabase-community" → verified (exact match)
 *   "supabase-communlty" → TYPOSQUAT WARNING
 *   "randomdev123" → no warning (not similar to any known org)
 */
export function detectTyposquat(
  owner: string
): { isSuspicious: boolean; similarTo: string | null; distance: number } {
  const lowerOwner = owner.toLowerCase();

  // Exact match = verified, not suspicious
  if (lowerOwner in VERIFIED_PUBLISHERS) {
    return { isSuspicious: false, similarTo: null, distance: 0 };
  }

  // Check Levenshtein distance against all known orgs
  let closestOrg: string | null = null;
  let closestDistance = Infinity;

  for (const org of KNOWN_ORGS) {
    const dist = levenshtein(lowerOwner, org);
    if (dist < closestDistance) {
      closestDistance = dist;
      closestOrg = org;
    }
  }

  // Also check if the owner CONTAINS a known org name (e.g., "stripe-official")
  for (const org of KNOWN_ORGS) {
    if (
      lowerOwner !== org &&
      (lowerOwner.includes(org) || org.includes(lowerOwner))
    ) {
      return {
        isSuspicious: true,
        similarTo: org,
        distance: 0,
      };
    }
  }

  // Levenshtein distance of 1-2 = suspicious
  const isSuspicious = closestDistance > 0 && closestDistance <= 2;

  return {
    isSuspicious,
    similarTo: isSuspicious ? closestOrg : null,
    distance: closestDistance,
  };
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
