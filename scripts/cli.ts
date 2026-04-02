import { auditRepo } from "./auditor";

/**
 * CLI entry point for the Skill Sentry auditor.
 *
 * Usage: npx tsx scripts/cli.ts <github-url>
 *
 * Outputs a RegistryEntry as pretty-printed JSON to stdout.
 * Exit code 0 on success, 1 on error.
 *
 * This is what GitHub Actions invokes in Phase 3:
 *   npx tsx scripts/cli.ts https://github.com/owner/repo
 */
async function main() {
  const url = process.argv[2];

  if (!url) {
    console.error("Usage: npx tsx scripts/cli.ts <github-url>");
    console.error("Example: npx tsx scripts/cli.ts https://github.com/owner/repo");
    process.exit(1);
  }

  try {
    const result = await auditRepo(url);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
