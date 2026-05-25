#!/usr/bin/env node
/**
 * Manual ASR smoke test against DashScope (same payload shape as backend).
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/test-asr.mjs
 *   OPENAI_API_KEY=sk-xxx node scripts/test-asr.mjs path/to/recording.m4a
 */
import fs from "node:fs";
import path from "node:path";

const apiKey = process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Set OPENAI_API_KEY or DASHSCOPE_API_KEY");
  process.exit(1);
}

const baseURL = (process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1").replace(/\/$/, "");
const sample =
  process.argv[2] ||
  path.join(process.cwd(), "voice_samples/laoda_reference/laoda_voice.mp3");

if (!fs.existsSync(sample)) {
  console.error("Sample not found:", sample);
  process.exit(1);
}

const bytes = fs.readFileSync(sample);
const ext = path.extname(sample).toLowerCase();
const mime =
  ext === ".mp3" || ext === ".mpeg"
    ? "audio/mpeg"
    : ext === ".wav"
      ? "audio/wav"
      : ext === ".m4a" || ext === ".mp4" || ext === ".aac"
        ? "audio/mp4"
        : ext === ".webm"
          ? "audio/webm"
          : "application/octet-stream";

const dataURI = `data:${mime};base64,${bytes.toString("base64")}`;

const payload = {
  model: "qwen3-asr-flash",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "input_audio",
          input_audio: { data: dataURI },
        },
      ],
    },
  ],
  stream: false,
  asr_options: { enable_itn: false, language: "zh" },
};

console.log("POST", `${baseURL}/chat/completions`);
console.log("file:", sample, `(${bytes.length} bytes, ${mime})`);

const res = await fetch(`${baseURL}/chat/completions`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log("status:", res.status);
if (!res.ok) {
  console.error(body);
  process.exit(1);
}

const json = JSON.parse(body);
const content = json?.choices?.[0]?.message?.content;
const text = typeof content === "string" ? content : JSON.stringify(content);
console.log("text:", text?.trim() || "(empty)");
if (!text?.trim()) {
  console.log("raw:", body.slice(0, 1200));
  process.exit(2);
}
