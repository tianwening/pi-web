#!/usr/bin/env node
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const electronPath = require("electron");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const root = path.join(__dirname, "..");
const child = spawn(electronPath, ["."], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    PI_WEB_ELECTRON_MODE: "production",
  },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
