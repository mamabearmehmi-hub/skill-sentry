import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export async function POST(request: Request) {
  const token = process.env.GH_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "Server misconfigured: missing GH_TOKEN" },
      { status: 500 }
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { url } = body;
  if (!url || !GITHUB_URL_REGEX.test(url)) {
    return NextResponse.json(
      { error: "Invalid GitHub URL. Expected: https://github.com/owner/repo" },
      { status: 400 }
    );
  }

  const octokit = new Octokit({ auth: token });

  try {
    await octokit.rest.repos.createDispatchEvent({
      owner: process.env.GITHUB_OWNER || "mamabearmehmi-hub",
      repo: process.env.GITHUB_REPO || "skill-sentry",
      event_type: "scan-repo",
      client_payload: { repo_url: url },
    });

    return NextResponse.json({ status: "triggered" }, { status: 202 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to trigger scan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
