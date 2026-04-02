import { execSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { extract } from "tar";

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
 * Check if git is available in the environment.
 */
function hasGit(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download and extract a GitHub repo tarball via the API.
 * Uses the `tar` npm package — works everywhere including Vercel.
 */
async function downloadAndExtract(
  owner: string,
  name: string,
  repoDir: string
): Promise<void> {
  const tarballUrl = `https://api.github.com/repos/${owner}/${name}/tarball`;
  const headers: Record<string, string> = {
    "User-Agent": "skill-sentry",
    Accept: "application/vnd.github.v3+json",
  };

  const token = process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(tarballUrl, { headers, redirect: "follow" });

  if (!res.ok) {
    throw new Error(
      `GitHub API returned ${res.status} for ${owner}/${name}: ${res.statusText}`
    );
  }

  if (!res.body) {
    throw new Error("No response body from GitHub API");
  }

  // Download the entire tarball to a buffer
  const arrayBuffer = await res.arrayBuffer();
  const tarPath = join(repoDir, "_archive.tar.gz");
  writeFileSync(tarPath, Buffer.from(arrayBuffer));

  // Extract using the tar npm package (pure JS, works on Vercel)
  await extract({
    file: tarPath,
    cwd: repoDir,
    strip: 1, // Remove the top-level directory (owner-repo-sha/)
  });

  // Clean up the tarball
  try {
    rmSync(tarPath);
  } catch {
    // ignore
  }
}

/**
 * Clone or download a GitHub repo to a temp directory.
 *
 * Strategy:
 * 1. If git is available (local dev, CI): shallow clone (fastest)
 * 2. If git is not available (Vercel): download tarball via GitHub API
 *
 * Returns the directory path and a cleanup function.
 * Cleanup is safe to call multiple times and never throws.
 */
export async function cloneRepo(
  url: string
): Promise<{ repoDir: string; cleanup: () => Promise<void> }> {
  const { owner, name } = parseGitHubUrl(url);

  const prefix = join(tmpdir(), "skill-sentry-");
  const repoDir = mkdtempSync(prefix);

  let cleaned = false;
  const cleanup = async (): Promise<void> => {
    if (cleaned) return;
    cleaned = true;
    try {
      rmSync(repoDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup
    }
  };

  try {
    if (hasGit()) {
      execSync(`git clone --depth 1 "${url}" "${repoDir}"`, {
        timeout: 30_000,
        stdio: ["ignore", "ignore", "pipe"],
      });
    } else {
      await downloadAndExtract(owner, name, repoDir);
    }
  } catch (error) {
    await cleanup();
    const message =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to fetch "${owner}/${name}": ${message}`);
  }

  return { repoDir, cleanup };
}
