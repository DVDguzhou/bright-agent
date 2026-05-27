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

function getJavaMajorVersion(javaHome) {
  const javaBin = path.join(javaHome, "bin", isWin ? "java.exe" : "java");
  if (!existsSync(javaBin)) return 0;
  const result = spawnSync(javaBin, ["-version"], { encoding: "utf8" });
  const text = `${result.stderr || ""}${result.stdout || ""}`;
  const match = text.match(/version "(\d+)/);
  if (!match) return 0;
  const major = Number(match[1]);
  return major === 1 ? 8 : major;
}

function applyJavaHome(javaHome) {
  process.env.JAVA_HOME = javaHome;
  const bin = path.join(javaHome, "bin");
  const sep = isWin ? ";" : ":";
  process.env.PATH = `${bin}${sep}${process.env.PATH}`;
  console.log(`JAVA_HOME=${process.env.JAVA_HOME}`);
}

function configureJavaHome() {
  const candidates = [];

  if (isWin) {
    candidates.push("C:\\Program Files\\Android\\Android Studio\\jbr");
  } else {
    candidates.push(
      "/usr/lib/jvm/java-21-openjdk-amd64",
      "/usr/lib/jvm/java-17-openjdk-amd64",
      "/usr/lib/jvm/java-17-openjdk",
    );
  }

  if (process.env.JAVA_HOME && existsSync(process.env.JAVA_HOME)) {
    candidates.unshift(process.env.JAVA_HOME);
  }

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const major = getJavaMajorVersion(candidate);
    if (major >= 17) {
      applyJavaHome(candidate);
      return;
    }
  }

  if (process.env.JAVA_HOME) {
    console.log(`JAVA_HOME=${process.env.JAVA_HOME}`);
    console.warn("Warning: Java 17+ is required for Android Gradle Plugin.");
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
if (isWin) {
  run("cmd", ["/c", gradle, gradleTask, "--no-daemon"], { cwd: androidDir, shell: false });
} else {
  run(gradle, [gradleTask, "--no-daemon"], { cwd: androidDir, shell: false });
}

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
