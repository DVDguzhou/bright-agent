import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply") || process.env.APPLY === "1";
const MAX_ROWS = Number(process.env.MAX_ROWS || 5000);
const CHECK_BASE_URL = (process.env.COVER_CHECK_BASE_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
const LOCAL_COVER_DIR =
  process.env.LIFE_AGENT_COVER_DIR ||
  path.resolve(process.cwd(), "backend", "uploads", "life-agent-covers");

type Candidate = {
  id: string;
  displayName: string;
  coverImageUrl: string | null;
  coverPresetKey: string | null;
};

type Missing = Candidate & {
  filename: string;
  reason: string;
};

function safeMaxRows(input: number): number {
  if (!Number.isFinite(input) || input <= 0) return 5000;
  return Math.min(Math.floor(input), 20000);
}

function extractFilename(url: string): string {
  const raw = url.split("/").pop() || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function fileExists(fullPath: string): Promise<boolean> {
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

async function checkRemote(url: string): Promise<{ ok: boolean; reason: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
    });
    return {
      ok: res.ok,
      reason: `http_${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? `fetch_error:${error.message}` : "fetch_error",
    };
  }
}

async function isCoverBroken(profile: Candidate): Promise<Missing | null> {
  const coverImageUrl = profile.coverImageUrl?.trim();
  if (!coverImageUrl || !coverImageUrl.startsWith("/api/upload/life-agent-cover/")) {
    return null;
  }

  const filename = extractFilename(coverImageUrl);
  if (!filename) {
    return { ...profile, filename: "", reason: "missing_filename" };
  }

  if (CHECK_BASE_URL) {
    const checked = await checkRemote(`${CHECK_BASE_URL}${coverImageUrl}`);
    if (!checked.ok) {
      return { ...profile, filename, reason: checked.reason };
    }
    return null;
  }

  const exists = await fileExists(path.join(LOCAL_COVER_DIR, filename));
  if (!exists) {
    return { ...profile, filename, reason: "missing_local_file" };
  }
  return null;
}

async function main() {
  const candidates = await prisma.$queryRawUnsafe<Candidate[]>(
    `
      SELECT
        id,
        display_name AS displayName,
        cover_image_url AS coverImageUrl,
        cover_preset_key AS coverPresetKey
      FROM life_agent_profiles
      WHERE cover_image_url LIKE '/api/upload/life-agent-cover/%'
      ORDER BY updated_at DESC
      LIMIT ?
    `,
    safeMaxRows(MAX_ROWS)
  );

  console.log(`Scanned ${candidates.length} life agents with uploaded cover URLs.`);
  console.log(
    CHECK_BASE_URL
      ? `Check mode: remote HTTP (${CHECK_BASE_URL})`
      : `Check mode: local filesystem (${LOCAL_COVER_DIR})`
  );

  const missing: Missing[] = [];
  for (const profile of candidates) {
    const broken = await isCoverBroken(profile);
    if (broken) missing.push(broken);
  }

  if (missing.length === 0) {
    console.log("No broken uploaded covers found.");
    return;
  }

  console.log(`Found ${missing.length} broken uploaded covers.`);
  for (const row of missing.slice(0, 30)) {
    console.log(
      `- ${row.displayName} (${row.id}) -> ${row.coverImageUrl} [${row.reason}]`
    );
  }
  if (missing.length > 30) {
    console.log(`... and ${missing.length - 30} more`);
  }

  if (!APPLY) {
    console.log("");
    console.log("Dry run only. Re-run with:");
    console.log("  npm run fix:missing-covers -- --apply");
    return;
  }

  let updated = 0;
  for (const row of missing) {
    await prisma.$executeRawUnsafe(
      `
        UPDATE life_agent_profiles
        SET cover_image_url = NULL
        WHERE id = ?
      `,
      row.id
    );
    updated += 1;
  }

  console.log(`Applied fallback reset for ${updated} life agents.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
