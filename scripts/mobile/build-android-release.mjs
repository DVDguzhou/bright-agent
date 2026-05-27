import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const format = process.argv.includes("--aab") ? "aab" : "apk";
const mobileAppUrl = process.env.MOBILE_APP_URL?.trim() || "https://brightagent.cn";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const androidDir = path.join(root, "android");
const keystoreProps = path.join(androidDir, "keystore.properties");
const keystoreFile = path.join(androidDir, "brightagent-release.keystore");
const isWin = process.platform === "win32";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(keystoreProps)) {
  fail(
    [
      "",
      "Missing android/keystore.properties",
      "",
      "Run once on your build machine:",
      "  keytool -genkeypair -v -keystore android/brightagent-release.keystore -alias brightagent -keyalg RSA -keysize 2048 -validity 10000",
      "  cp android/keystore.properties.example android/keystore.properties",
      "",
    ].join("\n"),
  );
}

if (!existsSync(keystoreFile)) {
  fail("Missing android/brightagent-release.keystore");
}

function configureJavaHome() {
  if (process.env.JAVA_HOME) {
    console.log(`JAVA_HOME=${process.env.JAVA_HOME}`);
    return;
  }

  if (isWin) {
    const androidStudioJbr = "C:\\Program Files\\Android\\Android Studio\\jbr";
    if (existsSync(androidStudioJbr)) {
      process.env.JAVA_HOME = androidStudioJbr;
      process.env.PATH = `${path.join(androidStudioJbr, "bin")};${process.env.PATH}`;
      console.log(`JAVA_HOME=${process.env.JAVA_HOME}`);
    }
    return;
  }

  const linuxCandidates = [
    "/usr/lib/jvm/java-21-openjdk-amd64",
    "/usr/lib/jvm/java-17-openjdk-amd64",
    "/usr/lib/jvm/java-17-openjdk",
  ];
  for (const candidate of linuxCandidates) {
    if (existsSync(candidate)) {
      process.env.JAVA_HOME = candidate;
      process.env.PATH = `${path.join(candidate, "bin")}:${process.env.PATH}`;
      console.log(`JAVA_HOME=${process.env.JAVA_HOME}`);
      return;
    }
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: isWin,
    env: process.env,
    ...options,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

configureJavaHome();

console.log(`MOBILE_APP_URL=${mobileAppUrl}`);
process.env.MOBILE_APP_URL = mobileAppUrl;

console.log("Syncing Capacitor...");
run("npm", ["run", "mobile:sync"], { cwd: root });

const gradle = isWin
  ? path.join(androidDir, "gradlew.bat")
  : path.join(androidDir, "gradlew");
const gradleTask = format === "aab" ? "bundleRelease" : "assembleRelease";

console.log(`Building release ${format.toUpperCase()}...`);
run(gradle, [gradleTask, "--no-daemon"], { cwd: androidDir, shell: false });

const output =
  format === "aab"
    ? path.join(androidDir, "app/build/outputs/bundle/release/app-release.aab")
    : path.join(androidDir, "app/build/outputs/apk/release/app-release.apk");

if (!existsSync(output)) {
  fail("Build failed: output file not found.");
}

console.log("");
console.log("Build succeeded:");
console.log(output);
console.log("");
console.log("Next:");
console.log("  npm run mobile:android:stage-apk");
