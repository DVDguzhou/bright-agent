/**
 * Batch trigger agent replies for posts (production RDS + local .env LLM keys).
 * Usage:
 *   npx tsx scripts/trigger-post-replies.ts
 *   npx tsx scripts/trigger-post-replies.ts --limit=5
 */
import { spawnSync } from "child_process";
import path from "path";

const backendDir = path.resolve(__dirname, "../backend");
const goArgs = process.argv.slice(2).map((arg) => arg.replace(/^--/, "-"));

const result = spawnSync("go", ["run", "./cmd/trigger-post-replies", ...goArgs], {
  cwd: backendDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
