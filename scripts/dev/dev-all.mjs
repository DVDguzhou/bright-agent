import { spawn } from "node:child_process";
import process from "node:process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
  });
  return { name, child };
}

function stopProcess(proc) {
  if (!proc.child.pid || proc.child.killed) return;
  if (isWin) {
    const killer = spawn("taskkill", ["/pid", String(proc.child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: true,
    });
    killer.on("error", () => {
      proc.child.kill("SIGTERM");
    });
    return;
  }
  proc.child.kill("SIGTERM");
}

const procs = [
  start("web", npmCmd, ["run", "dev:web"]),
  start("api", npmCmd, ["run", "dev:api"]),
];

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const proc of procs) stopProcess(proc);
  setTimeout(() => process.exit(exitCode), 150);
}

for (const proc of procs) {
  proc.child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const exitCode = code ?? (signal ? 1 : 0);
    if (exitCode !== 0) {
      console.error(`[dev:all] ${proc.name} exited unexpectedly.`);
    }
    shutdown(exitCode);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
