import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "android/app/build/outputs/apk/release/app-release.apk");
const destDir = path.join(root, "public/downloads");
const dest = path.join(destDir, "brightagent.apk");

if (!existsSync(src)) {
  console.error("Release APK not found. Run first:");
  console.error("  npm run mobile:android:release");
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

console.log("Copied to:");
console.log(dest);
console.log("");
console.log("Local URL:  http://localhost:3000/downloads/brightagent.apk");
console.log("Landing:    http://localhost:3000/download");
console.log("");
console.log("Production: https://brightagent.cn/download");
