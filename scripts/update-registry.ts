import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { Registry, RegistryEntry } from "../lib/types";

const REGISTRY_PATH = resolve(__dirname, "../public/data/registry.json");

/**
 * Load the current registry from disk.
 */
function loadRegistry(): Registry {
  const raw = readFileSync(REGISTRY_PATH, "utf-8");
  return JSON.parse(raw) as Registry;
}

/**
 * Save the registry back to disk, pretty-printed.
 */
function saveRegistry(registry: Registry): void {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n", "utf-8");
}

/**
 * Upsert a RegistryEntry into the registry.
 * If an entry with the same owner+name exists, replace it.
 * If not, append it.
 */
function upsertEntry(registry: Registry, entry: RegistryEntry): Registry {
  const existingIndex = registry.entries.findIndex(
    (e) => e.owner === entry.owner && e.name === entry.name
  );

  if (existingIndex !== -1) {
    registry.entries[existingIndex] = entry;
  } else {
    registry.entries.push(entry);
  }

  registry.totalEntries = registry.entries.length;
  registry.lastUpdated = new Date().toISOString();

  return registry;
}

/**
 * CLI entry point for updating the registry with an audit result.
 *
 * Usage:
 *   npx tsx scripts/update-registry.ts /path/to/result.json
 *   npx tsx scripts/cli.ts <url> | npx tsx scripts/update-registry.ts
 */
async function main() {
  let input: string;

  const filePath = process.argv[2];
  if (filePath) {
    // Read from file argument
    input = readFileSync(resolve(filePath), "utf-8");
  } else {
    // Read from stdin (piped)
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    input = Buffer.concat(chunks).toString("utf-8");
  }

  if (!input.trim()) {
    console.error("Error: No input provided.");
    console.error("Usage: npx tsx scripts/update-registry.ts /path/to/result.json");
    process.exit(1);
  }

  let entry: RegistryEntry;
  try {
    entry = JSON.parse(input) as RegistryEntry;
  } catch {
    console.error("Error: Invalid JSON input.");
    process.exit(1);
  }

  const registry = loadRegistry();
  upsertEntry(registry, entry);
  saveRegistry(registry);

  console.log(
    `Updated registry: ${entry.owner}/${entry.name} — risk score ${entry.riskScore}`
  );
}

main();
