#!/usr/bin/env node
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { reexecOutsideCodexNode } = require("./node-runtime");

const pkgDir = path.join(__dirname, "..");
const nextBin = require.resolve("next/dist/bin/next", { paths: [pkgDir] });
const devServerPort = process.env.PI_AGENT_DEV_SERVER_PORT || process.env.PORT || "30141";
const defaultArgs = ["dev", "--webpack", "-p", devServerPort];

if (reexecOutsideCodexNode(__filename, process.argv.slice(2), "PI_AGENT_DEV_REEXEC")) {
  return;
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
