/**
 * 为人生 Agent 分配不重复的「微信风格」头像（下载到本地 uploads，写入 cover_image_url）。
 *
 * 头像来源（按优先级尝试，直到拿到不重复图片）：
 *   1. v2.xxapi.cn 随机头像 API（国内常见 QQ/微信用户头像风格）
 *   2. DiceBear 卡通头像（seed = agentId，微信里也很常见）
 *   3. randomuser.me 人像（兜底）
 *
 * 用法：
 *   npx tsx scripts/life-agent/assign-wechat-avatars.ts          # 预览
 *   npx tsx scripts/life-agent/assign-wechat-avatars.ts --apply  # 写入 DB + 保存文件
 *   npx tsx scripts/life-agent/assign-wechat-avatars.ts --podcast-only --apply  # 仅四批播客（59 条）
 *   LIMIT=20 npx tsx scripts/life-agent/assign-wechat-avatars.ts --apply
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const APPLY = process.argv.includes("--apply") || process.env.APPLY === "1";
const PODCAST_ONLY =
  process.argv.includes("--podcast-only") || process.env.PODCAST_ONLY === "1";
const LIMIT = Number(process.env.LIMIT || 0);
const PODCAST_SOURCES = [
  "不止大学播客",
  "我下班了播客",
  "校招飞播客",
  "迷你退休播客",
] as const;
const FETCH_TIMEOUT_MS = Number(process.env.AVATAR_FETCH_TIMEOUT_MS || 25000);
const LOCAL_COVER_DIR =
  process.env.LIFE_AGENT_COVER_DIR ||
  path.resolve(process.cwd(), "backend", "uploads", "life-agent-covers");

const DICEBEAR_STYLES = [
  "lorelei",
  "micah",
  "adventurer",
  "avataaars",
  "fun-emoji",
  "notionists",
  "personas",
  "big-smile",
] as const;

type AgentRow = {
  id: string;
  displayName: string;
  coverImageUrl: string | null;
};

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function hashPick(seed: string, mod: number): number {
  const h = crypto.createHash("sha256").update(seed).digest();
  return Number(h.readBigUInt64BE(0) % BigInt(mod));
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

async function tryXxapiHeadUrl(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://v2.xxapi.cn/api/head?return=json");
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    return typeof json.data === "string" && json.data.startsWith("http") ? json.data : null;
  } catch {
    return null;
  }
}

function dicebearUrl(agentId: string, attempt: number): string {
  const style = DICEBEAR_STYLES[hashPick(`${agentId}:${attempt}`, DICEBEAR_STYLES.length)];
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodeURIComponent(`wx-${agentId}-${attempt}`)}&size=400`;
}

function randomUserUrl(agentId: string, attempt: number): string {
  const gender = hashPick(`${agentId}:${attempt}:g`, 2) === 0 ? "women" : "men";
  const idx = hashPick(`${agentId}:${attempt}:i`, 100);
  return `https://randomuser.me/api/portraits/${gender}/${idx}.jpg`;
}

function sourceCandidates(agentId: string): string[] {
  const out: string[] = [];
  // xxapi 每次请求 URL 不同，在 downloadUniqueAvatar 里单独拉
  for (let attempt = 0; attempt < 8; attempt += 1) {
    out.push(dicebearUrl(agentId, attempt));
    out.push(randomUserUrl(agentId, attempt));
  }
  return out;
}

async function downloadBytes(url: string): Promise<Buffer | null> {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { Accept: "image/*", "User-Agent": "BrightAgentAvatarBot/1.0" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 256 || buf.length > 2 * 1024 * 1024) return null;
    return buf;
  } catch {
    return null;
  }
}

async function downloadUniqueAvatar(
  agentId: string,
  usedHashes: Set<string>,
): Promise<{ bytes: Buffer; ext: string; source: string } | null> {
  // 优先：xxapi 随机微信/QQ 风格头像（最多试 6 次）
  for (let i = 0; i < 6; i += 1) {
    const headUrl = await tryXxapiHeadUrl();
    if (!headUrl) continue;
    const bytes = await downloadBytes(headUrl);
    if (!bytes) continue;
    const digest = sha256(bytes);
    if (usedHashes.has(digest)) continue;
    usedHashes.add(digest);
    return { bytes, ext: ".jpg", source: headUrl };
  }

  for (const url of sourceCandidates(agentId)) {
    const bytes = await downloadBytes(url);
    if (!bytes) continue;
    const digest = sha256(bytes);
    if (usedHashes.has(digest)) continue;
    usedHashes.add(digest);
    const ext = url.includes(".jpg") ? ".jpg" : ".png";
    return { bytes, ext, source: url };
  }

  return null;
}

function coverApiPath(filename: string): string {
  return `/api/upload/life-agent-cover/${filename}`;
}

async function main() {
  await fs.mkdir(LOCAL_COVER_DIR, { recursive: true });

  const rows = await prisma.lifeAgentProfile.findMany({
    select: { id: true, displayName: true, coverImageUrl: true },
    where: PODCAST_ONLY ? { source: { in: [...PODCAST_SOURCES] } } : undefined,
    orderBy: { createdAt: "asc" },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Agents to process: ${rows.length}`);
  console.log(`Podcast only: ${PODCAST_ONLY}`);
  console.log(`Mode: ${APPLY ? "APPLY (write files + DB)" : "DRY RUN"}`);
  console.log(`Cover dir: ${LOCAL_COVER_DIR}`);

  const usedHashes = new Set<string>();
  let ok = 0;
  let fail = 0;

  for (const row of rows) {
    const avatar = await downloadUniqueAvatar(row.id, usedHashes);
    if (!avatar) {
      fail += 1;
      console.log(`FAIL ${row.displayName} (${row.id}) — no unique avatar downloaded`);
      continue;
    }

    const filename = `wx-${row.id.replace(/-/g, "").slice(0, 24)}${avatar.ext}`;
    const apiPath = coverApiPath(filename);
    ok += 1;

    console.log(`OK   ${row.displayName} -> ${apiPath} [${avatar.source.slice(0, 72)}…]`);

    if (!APPLY) continue;

    await fs.writeFile(path.join(LOCAL_COVER_DIR, filename), avatar.bytes);
    await prisma.lifeAgentProfile.update({
      where: { id: row.id },
      data: {
        coverImageUrl: apiPath,
        coverPresetKey: null,
      },
    });
  }

  console.log("");
  console.log(`Done. success=${ok}, failed=${fail}, unique_images=${usedHashes.size}`);
  if (!APPLY) {
    console.log("Dry run only. Re-run with: npm run assign:wechat-avatars -- --apply");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
