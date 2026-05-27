import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const hooksDir = path.join(root, ".git", "hooks");
const hookPath = path.join(hooksDir, "pre-commit");
const marker = "# brightagent-secret-guard";

const hookBody = `#!/bin/sh
${marker}
node scripts/git/pre-commit-check-secrets.mjs
`;

if (!existsSync(path.join(root, ".git"))) {
  console.log("Not a git repository; skipped hook install.");
  process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

if (existsSync(hookPath)) {
  const existing = readFileSync(hookPath, "utf8");
  if (existing.includes(marker)) {
    console.log("Git pre-commit hook already installed.");
    process.exit(0);
  }

  writeFileSync(
    hookPath,
    `${existing.trimEnd()}\n\n${hookBody}`,
    "utf8",
  );
} else {
  writeFileSync(hookPath, hookBody, "utf8");
}

try {
  chmodSync(hookPath, 0o755);
} catch {
  // Windows may ignore chmod; Git Bash still runs the hook.
}

console.log("Installed git pre-commit hook:", path.relative(root, hookPath));
