import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, "..", "..", "backend");

function runGoApi() {
  const child = spawn("go", ["run", "."], {
    cwd: backendDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const forwardSignal = (signal) => {
    if (child.killed) return;
    child.kill(signal);
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

runGoApi();
