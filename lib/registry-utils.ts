import type { RegistryEntry } from "./types";
import { RISK_THRESHOLDS } from "./constants";

/**
 * Filter entries by search query (matches owner, name, description, packageName).
 * Client-safe — no Node.js APIs.
 */
export function searchEntries(
  entries: RegistryEntry[],
  query: string
): RegistryEntry[] {
  if (!query.trim()) return entries;
  const q = query.toLowerCase();
  return entries.filter(
    (e) =>
      e.owner.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      (e.description?.toLowerCase().includes(q) ?? false) ||
      (e.packageName?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * Get the risk level label for a given score.
 * Client-safe — no Node.js APIs.
 */
export function getRiskLevel(
  score: number
): "safe" | "low" | "medium" | "high" | "critical" {
  if (score === RISK_THRESHOLDS.safe) return "safe";
  if (score <= RISK_THRESHOLDS.low.max) return "low";
  if (score <= RISK_THRESHOLDS.medium.max) return "medium";
  if (score <= RISK_THRESHOLDS.high.max) return "high";
  return "critical";
}
