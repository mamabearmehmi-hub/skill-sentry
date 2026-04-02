import { NextResponse } from "next/server";
import { auditRepo } from "@/scripts/auditor";

const GITHUB_URL_REGEX = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

export const maxDuration = 30; // Vercel function timeout (seconds)

export async function POST(request: Request) {
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

  try {
    // Run the scan directly — no waiting for GitHub Actions
    const result = await auditRepo(url);
    return NextResponse.json({ status: "complete", entry: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scan repository";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
