#!/usr/bin/env node
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const pkgDir = path.join(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next", { paths: [pkgDir] });
const defaultArgs = ["dev", "--webpack", "-p", "30141"];

function findAlternateNode() {
  const current = fs.realpathSync.native(process.execPath);
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);

  for (const entry of pathEntries) {
    const candidate = path.join(entry, process.platform === "win32" ? "node.exe" : "node");
    try {
      if (!fs.existsSync(candidate)) continue;
      const resolved = fs.realpathSync.native(candidate);
      if (resolved !== current) return candidate;
    } catch {
      // Ignore unreadable PATH entries.
    }
  }

  return null;
}

const isCodexBundledNode = process.execPath.includes(`${path.sep}Codex.app${path.sep}`);
if (isCodexBundledNode && process.env.PI_WEB_DEV_REEXEC !== "1") {
  const alternateNode = findAlternateNode();
  if (alternateNode) {
    const child = spawn(alternateNode, [__filename, ...process.argv.slice(2)], {
      cwd: pkgDir,
      stdio: "inherit",
      env: { ...process.env, PI_WEB_DEV_REEXEC: "1" },
    });
    child.on("exit", (code, signal) => {
      if (signal) process.kill(process.pid, signal);
      process.exit(code ?? 0);
    });
    return;
  }
}

const child = spawn(process.execPath, [nextBin, ...defaultArgs, ...process.argv.slice(2)], {
  cwd: pkgDir,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
