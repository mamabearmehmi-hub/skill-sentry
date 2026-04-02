import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { Registry, RegistryEntry } from "@/lib/types";

const REGISTRY_PATH = resolve(process.cwd(), "public/data/registry.json");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const name = searchParams.get("name");

  if (!owner || !name) {
    return NextResponse.json({ error: "Missing owner or name" }, { status: 400 });
  }

  try {
    const raw = readFileSync(REGISTRY_PATH, "utf-8");
    const registry = JSON.parse(raw) as Registry;
    const entry = registry.entries.find(
      (e: RegistryEntry) => e.owner === owner && e.name === name
    );

    if (entry) {
      return NextResponse.json({ found: true, entry });
    }
    return NextResponse.json({ found: false });
  } catch {
    return NextResponse.json({ found: false });
  }
}
