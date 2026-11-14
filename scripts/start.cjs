const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const backend = path.join(root, "backend");
const frontend = path.join(root, "frontend");
const backendEntry = path.join(backend, "node_modules", "ts-node", "dist", "bin.js");
const frontendEntry = path.join(frontend, "node_modules", "expo", "bin", "cli");

for (const [name, entry] of [["backend", backendEntry], ["frontend", frontendEntry]]) {
  if (!fs.existsSync(entry)) {
    console.error(`Missing ${name} dependencies. Run npm ci in the ${name} folder.`);
    process.exit(1);
  }
}

if (process.argv.includes("--check")) {
  console.log("Backend and frontend dependencies are available.");
  process.exit(0);
}

const children = new Set();
let stopping = false;

// Завершаем только процессы, созданные этим запуском, включая дочерние процессы Expo.
function stopAll(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (!child.pid) continue;
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  }
}

function start(name, cwd, args, interactive) {
  const child = spawn(process.execPath, args, {
    cwd,
    // Expo получает клавиатуру для QR-меню; бэкенд только выводит сообщения.
    stdio: [interactive ? "inherit" : "ignore", "inherit", "inherit"],
    windowsHide: true,
  });
  children.add(child);
  child.once("error", function (error) {
    console.error(`Cannot start ${name}: ${error.message}`);
    children.delete(child);
    stopAll(1);
  });
  child.once("exit", function (code, signal) {
    children.delete(child);
    if (stopping) return;
    console.log(`${name} stopped. Stopping Meetly.`);
    if (signal === "SIGINT" || signal === "SIGTERM") stopAll(0);
    else stopAll(code ?? 1);
  });
}

process.on("SIGINT", function () { stopAll(0); });
process.on("SIGTERM", function () { stopAll(0); });

console.log("Starting backend and Expo in this terminal. Press Ctrl+C to stop both.");
start("Backend", backend, [backendEntry, "src/main.ts"], false);
start("Frontend", frontend, [frontendEntry, "start"], true);
