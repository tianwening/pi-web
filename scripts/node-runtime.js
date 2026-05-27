"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function isCodexBundledNode(execPath = process.execPath) {
  return execPath.includes(`${path.sep}Codex.app${path.sep}`);
}

function getNodeCandidatePath(pathEntry, platform = process.platform) {
  return path.join(pathEntry, platform === "win32" ? "node.exe" : "node");
}

function findAlternateNode() {
  const current = fs.realpathSync.native(process.execPath);
  const pathEntries = (process.env.PATH || "").split(path.delimiter).filter(Boolean);

  for (const entry of pathEntries) {
    const candidate = getNodeCandidatePath(entry);
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

function reexecOutsideCodexNode(scriptPath, args, markerEnvName) {
  if (!isCodexBundledNode() || process.env[markerEnvName] === "1") return false;

  const alternateNode = findAlternateNode();
  if (!alternateNode) return false;

  const child = spawn(alternateNode, [scriptPath, ...args], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, [markerEnvName]: "1" },
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
  return true;
}

module.exports = {
  findAlternateNode,
  getNodeCandidatePath,
  isCodexBundledNode,
  reexecOutsideCodexNode,
};
