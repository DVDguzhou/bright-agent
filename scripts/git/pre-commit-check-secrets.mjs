#!/usr/bin/env node
/**
 * Block commits that include local secrets or release artifacts.
 */
import { execSync } from "node:child_process";
import path from "node:path";

const BLOCKED_PATTERNS = [
  /^android\/keystore\.properties$/,
  /^android\/.*\.keystore$/,
  /^android\/.*\.jks$/,
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
  /^public\/downloads\/.*\.apk$/,
  /^.*\.pem$/,
];

function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
      encoding: "utf8",
    });
    return output
      .split(/\r?\n/)
      .map((line) => line.trim().replace(/\\/g, "/"))
      .filter(Boolean);
  } catch {
    return [];
  }
}

const staged = getStagedFiles();
const blocked = staged.filter((file) =>
  BLOCKED_PATTERNS.some((pattern) => pattern.test(file)),
);

if (blocked.length === 0) {
  process.exit(0);
}

console.error("");
console.error("Commit blocked: staged files must not be committed.");
console.error("");
for (const file of blocked) {
  console.error(`  - ${file}`);
}
console.error("");
console.error("These files are listed in .gitignore for local secrets or release artifacts.");
console.error("Unstage them with: git restore --staged <file>");
console.error("");
process.exit(1);
