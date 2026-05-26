#!/usr/bin/env node
"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const { execFile, spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const pkgDir = path.join(__dirname, "..");
const DEFAULT_PORT = "30141";

function getDevServerUrl(port = DEFAULT_PORT) {
  return `http://localhost:${port}`;
}

function parseLsofPids(output) {
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[1])
    .map((pid) => Number(pid))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

function uniqueProcessIds(pids) {
  return [...new Set(pids)].filter((pid) => pid !== process.pid);
}

async function findPortProcessIds(port) {
  if (process.platform === "win32") return [];

  try {
    const { stdout } = await execFileAsync("lsof", [
      "-nP",
      `-iTCP:${port}`,
      "-sTCP:LISTEN",
    ]);
    return uniqueProcessIds(parseLsofPids(stdout));
  } catch (error) {
    if (error && typeof error === "object" && error.code === 1) return [];
    throw error;
  }
}

async function waitForPortToClose(port, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const pids = await findPortProcessIds(port);
    if (pids.length === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for port ${port} to close.`);
}

async function stopExistingDevServer(port) {
  const pids = await findPortProcessIds(port);
  if (pids.length === 0) return;

  for (const pid of pids) {
    process.kill(pid, "SIGTERM");
  }
  await waitForPortToClose(port);
}

function waitForServer(url, timeoutMs = 60000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", (error) => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(error);
          return;
        }
        setTimeout(attempt, 250);
      });

      req.setTimeout(2000, () => {
        req.destroy(new Error("Timed out waiting for local server."));
      });
    }

    attempt();
  });
}

function spawnDevServer(port) {
  return spawn(process.execPath, [path.join(pkgDir, "scripts", "dev.js")], {
    cwd: pkgDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PI_WEB_DEV_SERVER_PORT: port,
      PORT: port,
    },
  });
}

function spawnElectron(url) {
  const electronCli = require.resolve("electron/cli.js", { paths: [pkgDir] });
  return spawn(process.execPath, [electronCli, "."], {
    cwd: pkgDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PI_WEB_ELECTRON_MODE: "development",
      PI_WEB_DEV_SERVER_URL: url,
    },
  });
}

async function main() {
  const port = process.env.PI_WEB_DEV_SERVER_PORT || process.env.PORT || DEFAULT_PORT;
  const url = getDevServerUrl(port);

  await stopExistingDevServer(port);

  const devServer = spawnDevServer(port);
  let electron = null;

  const cleanup = () => {
    if (electron && !electron.killed) electron.kill();
    if (!devServer.killed) devServer.kill();
  };

  process.once("SIGINT", () => {
    cleanup();
    process.exit(130);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });
  process.once("exit", cleanup);

  devServer.once("exit", (code, signal) => {
    if (electron && !electron.killed) electron.kill();
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });

  await waitForServer(url);

  electron = spawnElectron(url);
  electron.once("exit", (code, signal) => {
    if (!devServer.killed) devServer.kill();
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_PORT,
  getDevServerUrl,
  parseLsofPids,
  uniqueProcessIds,
};
