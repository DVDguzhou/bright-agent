/**
 * Enroll or replace a Life Agent voice clone from a local media file.
 *
 * Default target is the Zhang Xuefeng Agent account:
 *   AGENT_OWNER_EMAIL=agent_zxf_decision@163.com
 *   AGENT_DISPLAY_NAME=张雪峰
 *
 * Usage:
 *   TEST_BASE_URL="https://brightagent.cn" \
 *   AGENT_OWNER_PASSWORD="..." \
 *   AGENT_MEDIA_FILE="/path/to/source.mp4" \
 *   node scripts/life-agent/enroll-agent-voice.mjs
 *
 * Optional env:
 *   AGENT_OWNER_EMAIL     Owner account email
 *   AGENT_OWNER_PASSWORD  Owner account password (required)
 *   AGENT_DISPLAY_NAME    Agent display name, default 张雪峰
 *   AGENT_MEDIA_FILE      Source audio/video file path (required)
 *   AGENT_AUDIO_SECONDS   Clip length in seconds, default 30
 */
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

const BASE = (process.env.TEST_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const OWNER_EMAIL = process.env.AGENT_OWNER_EMAIL || "agent_zxf_decision@163.com";
const OWNER_PASSWORD = process.env.AGENT_OWNER_PASSWORD || process.env.ZHANGXUEFENG_AGENT_PASSWORD || "";
const DISPLAY_NAME = process.env.AGENT_DISPLAY_NAME || "张雪峰";
const MEDIA_FILE = process.env.AGENT_MEDIA_FILE || "";
const AUDIO_SECONDS = Math.max(10, Number.parseInt(process.env.AGENT_AUDIO_SECONDS || "30", 10) || 30);

function parseCookie(setCookie) {
  if (!setCookie) return "";
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!first || typeof first !== "string") return "";
  return first.split(";")[0].trim();
}

async function req(method, reqPath, body, cookie = "") {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body && method !== "GET") headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${reqPath}`, {
    method,
    headers,
    body: body && method !== "GET" ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie") || res.headers.getSetCookie?.();
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text().catch(() => "");
  }
  return {
    ok: res.ok,
    status: res.status,
    data,
    cookie: setCookie ? parseCookie(setCookie) : cookie,
  };
}

function ensureFfmpeg() {
  const check = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return check.status === 0;
}

function isMp3File(inputFile) {
  const ext = path.extname(inputFile).toLowerCase();
  return ext === ".mp3";
}

function transcodeToMp3(inputFile) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agent-voice-"));
  const outFile = path.join(tmpDir, "sample.mp3");
  const args = [
    "-y",
    "-i",
    inputFile,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "24000",
    "-b:a",
    "64k",
    "-t",
    String(AUDIO_SECONDS),
    outFile,
  ];
  const run = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (run.status !== 0 || !fs.existsSync(outFile)) {
    console.error("ffmpeg transcode failed.");
    if (run.stderr) console.error(run.stderr.trim());
    process.exit(1);
  }
  return outFile;
}

function buildAudioPayload(mp3File) {
  const buf = fs.readFileSync(mp3File);
  return {
    bytes: buf.length,
    payload: `data:audio/mpeg;base64,${buf.toString("base64")}`,
  };
}

async function main() {
  console.log("=== Life Agent Voice Enroll ===");
  console.log("Base URL:", BASE);
  console.log("Owner:", OWNER_EMAIL);
  console.log("Agent:", DISPLAY_NAME);

  if (!OWNER_PASSWORD) {
    console.error("Missing AGENT_OWNER_PASSWORD (or ZHANGXUEFENG_AGENT_PASSWORD).");
    process.exit(1);
  }
  if (!MEDIA_FILE) {
    console.error("Missing AGENT_MEDIA_FILE.");
    process.exit(1);
  }
  if (!fs.existsSync(MEDIA_FILE)) {
    console.error("Media file not found:", MEDIA_FILE);
    process.exit(1);
  }

  const hasFfmpeg = ensureFfmpeg();
  const wantsTrim = AUDIO_SECONDS > 0;
  let mp3File = MEDIA_FILE;

  if (isMp3File(MEDIA_FILE)) {
    if (wantsTrim && hasFfmpeg) {
      mp3File = transcodeToMp3(MEDIA_FILE);
    } else if (wantsTrim && !hasFfmpeg) {
      console.error("ffmpeg not found, so an existing MP3 cannot be trimmed on this machine.");
      console.error("Please upload a pre-trimmed MP3, or install ffmpeg first.");
      process.exit(1);
    }
  } else {
    if (!hasFfmpeg) {
      console.error("ffmpeg not found. Please install ffmpeg, or upload a pre-trimmed MP3 instead.");
      process.exit(1);
    }
    mp3File = transcodeToMp3(MEDIA_FILE);
  }
  const { bytes, payload } = buildAudioPayload(mp3File);
  console.log("Prepared sample:", mp3File, `(${(bytes / 1024).toFixed(1)} KB, ${AUDIO_SECONDS}s max)`);

  const loginRes = await req("POST", "/api/auth/login", {
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, loginRes.data);
    process.exit(1);
  }

  const mineRes = await req("GET", "/api/life-agents/mine", null, loginRes.cookie);
  if (!mineRes.ok) {
    console.error("Load my agents failed:", mineRes.status, mineRes.data);
    process.exit(1);
  }

  const agents = Array.isArray(mineRes.data) ? mineRes.data : [];
  const target = agents.find((item) => item && item.displayName === DISPLAY_NAME);
  if (!target?.id) {
    console.error(
      `Agent "${DISPLAY_NAME}" not found under ${OWNER_EMAIL}. Available:`,
      agents.map((item) => item?.displayName).filter(Boolean).join(", ") || "(none)",
    );
    process.exit(1);
  }

  const patchRes = await req(
    "PATCH",
    `/api/life-agents/${target.id}`,
    { voiceSampleBase64: payload },
    loginRes.cookie,
  );
  if (!patchRes.ok) {
    console.error("Voice enroll failed:", patchRes.status, patchRes.data);
    process.exit(1);
  }

  const voiceCloneId = patchRes.data?.voiceCloneId || "";
  console.log("Voice enroll request finished for profile:", target.id);
  if (voiceCloneId) {
    console.log("voiceCloneId:", voiceCloneId);
  } else {
    console.log("No voiceCloneId returned. Check backend TTS / DashScope enroll config.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
