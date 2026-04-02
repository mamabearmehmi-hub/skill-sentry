import { execSync } from "child_process";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Parse a GitHub URL into owner and repo name.
 * Accepts: https://github.com/owner/repo or https://github.com/owner/repo.git
 */
export function parseGitHubUrl(url: string): { owner: string; name: string } {
  const match = url.match(
    /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/
  );
  if (!match) {
    throw new Error(
      `Invalid GitHub URL: "${url}". Expected format: https://github.com/owner/repo`
    );
  }
  return { owner: match[1], name: match[2] };
}

/**
 * Shallow-clone a GitHub repo to a temp directory.
 * Returns the directory path and a cleanup function that removes it.
 * Cleanup is safe to call multiple times and never throws.
 */
export async function cloneRepo(
  url: string
): Promise<{ repoDir: string; cleanup: () => Promise<void> }> {
  // Validate URL before cloning
  parseGitHubUrl(url);

  const prefix = join(tmpdir(), "skill-sentry-");
  const repoDir = mkdtempSync(prefix);

  let cleaned = false;
  const cleanup = async (): Promise<void> => {
    if (cleaned) return;
    cleaned = true;
    try {
      rmSync(repoDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup — temp dir will be reclaimed by OS eventually
    }
  };

  try {
    execSync(`git clone --depth 1 "${url}" "${repoDir}"`, {
      timeout: 30_000,
      stdio: ["ignore", "ignore", "pipe"],
    });
  } catch (error) {
    // Clean up the temp dir on clone failure
    await cleanup();
    const message =
      error instanceof Error ? error.message : "Unknown clone error";
    throw new Error(`Failed to clone "${url}": ${message}`);
  }

  return { repoDir, cleanup };
}
