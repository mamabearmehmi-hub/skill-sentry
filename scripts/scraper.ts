import { readFileSync } from "fs";
import { resolve } from "path";
import type { Registry } from "../lib/types";
import { GITHUB_TOPICS } from "../lib/constants";

const REGISTRY_PATH = resolve(__dirname, "../public/data/registry.json");
const PER_PAGE = 30;
const GITHUB_API = "https://api.github.com";

interface DiscoveredRepo {
  url: string;
  owner: string;
  name: string;
}

/**
 * Load the set of already-audited repos from registry.json.
 * Returns a Set of "owner/name" strings for fast lookup.
 */
function loadAuditedRepos(): Set<string> {
  try {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    const registry = JSON.parse(raw) as Registry;
    return new Set(registry.entries.map((e) => `${e.owner}/${e.name}`));
  } catch {
    return new Set();
  }
}

/**
 * Search GitHub for repos with a specific topic.
 * Returns raw search results or null on error.
 */
async function searchByTopic(
  topic: string,
  token: string | undefined
): Promise<DiscoveredRepo[]> {
  const url = `${GITHUB_API}/search/repositories?q=topic:${topic}&sort=updated&per_page=${PER_PAGE}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skill-sentry-scraper",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 403) {
        console.error(
          `[scraper] Rate limited on topic "${topic}" — skipping`
        );
      } else {
        console.error(
          `[scraper] GitHub API error ${response.status} for topic "${topic}"`
        );
      }
      return [];
    }

    const data = (await response.json()) as {
      items: Array<{
        full_name: string;
        html_url: string;
        owner: { login: string };
        name: string;
      }>;
    };

    return data.items.map((item) => ({
      url: item.html_url,
      owner: item.owner.login,
      name: item.name,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] Network error for topic "${topic}": ${message}`);
    return [];
  }
}

/**
 * Discover new MCP repos across all configured topics.
 *
 * Searches GitHub API for each topic, deduplicates against
 * the existing registry and across topics, outputs new repos
 * as newline-delimited JSON to stdout.
 *
 * Usage: GH_TOKEN=xxx npx tsx scripts/scraper.ts
 */
async function main() {
  const token = process.env.GH_TOKEN;

  if (!token) {
    console.error(
      "[scraper] Warning: GH_TOKEN not set. Using unauthenticated API (60 req/hr limit)."
    );
  }

  const audited = loadAuditedRepos();
  const seen = new Set<string>(); // cross-topic dedup
  const discovered: DiscoveredRepo[] = [];

  for (const topic of GITHUB_TOPICS) {
    const repos = await searchByTopic(topic, token);

    for (const repo of repos) {
      const key = `${repo.owner}/${repo.name}`;

      // Skip already audited
      if (audited.has(key)) continue;

      // Skip already seen in this session (cross-topic dedup)
      if (seen.has(key)) continue;

      seen.add(key);
      discovered.push(repo);
    }
  }

  // Output newline-delimited JSON to stdout
  for (const repo of discovered) {
    console.log(JSON.stringify(repo));
  }

  console.error(
    `[scraper] Discovered ${discovered.length} new repos (${audited.size} already audited)`
  );
}

main();
