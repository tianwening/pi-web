#!/usr/bin/env node
"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const path = require("node:path");
const { reexecOutsideCodexNode } = require("./node-runtime");

if (reexecOutsideCodexNode(__filename, process.argv.slice(2), "PI_AGENT_DESKTOP_PACK_REEXEC")) {
  return;
}

const root = path.join(__dirname, "..");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  const electronBuilderArgs = process.argv.slice(2);
  await run(process.execPath, [require.resolve("next/dist/bin/next", { paths: [root] }), "build", "--webpack"]);
  await run(process.execPath, [path.join(root, "scripts", "prepare-desktop.js")]);
  await run(process.execPath, [require.resolve("electron-builder/cli.js", { paths: [root] }), ...electronBuilderArgs]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
