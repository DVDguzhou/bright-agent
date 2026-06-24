#!/usr/bin/env node
/**
 * 隐藏除指定 Agent 外的所有人生 Agent（published=false，不删数据）。
 *
 * 用法（项目根目录）：
 *   node scripts/life-agent/hide-agents-except.mjs
 *   node scripts/life-agent/hide-agents-except.mjs --apply
 *   node scripts/life-agent/hide-agents-except.mjs --name "阿青学长3.0" --apply
 *   node scripts/life-agent/hide-agents-except.mjs --restore backend/hidden-agents-except-20260624.txt --apply
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../../backend");

const args = process.argv.slice(2);
const goArgs = ["run", "./cmd/hide-agents-except"];

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--apply") {
    goArgs.push("-apply");
  } else if (a === "--name" && args[i + 1]) {
    goArgs.push("-name", args[++i]);
  } else if (a === "--restore" && args[i + 1]) {
    goArgs.push("-restore", args[++i]);
  } else if (a === "--limit" && args[i + 1]) {
    goArgs.push("-limit", args[++i]);
  } else if (a === "--help" || a === "-h") {
    console.log(`用法:
  node scripts/life-agent/hide-agents-except.mjs [--name "阿青学长3.0"] [--apply]
  node scripts/life-agent/hide-agents-except.mjs --restore <清单文件> [--apply]

默认 dry-run；加 --apply 才会写库。`);
    process.exit(0);
  } else {
    console.error(`未知参数: ${a}`);
    process.exit(1);
  }
}

const result = spawnSync("go", goArgs, {
  cwd: backendDir,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
