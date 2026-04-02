import "server-only";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Registry } from "./types";
import { RISK_THRESHOLDS } from "./constants";

const REGISTRY_PATH = resolve(process.cwd(), "public/data/registry.json");

/**
 * Load the registry from disk. Server-only — used at build time by the dashboard.
 */
export function getRegistry(): Registry {
  const raw = readFileSync(REGISTRY_PATH, "utf-8");
  return JSON.parse(raw) as Registry;
}

/**
 * Compute aggregate stats from registry entries.
 */
export function getStats(registry: Registry) {
  const entries = registry.entries;
  const totalScanned = entries.length;
  const verifiedSafe = entries.filter((e) => e.verifiedSafe).length;
  const averageRisk =
    totalScanned > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.riskScore, 0) / totalScanned)
      : 0;
  const criticalCount = entries.filter(
    (e) => e.riskScore >= RISK_THRESHOLDS.critical.min
  ).length;

  return { totalScanned, verifiedSafe, averageRisk, criticalCount };
}
