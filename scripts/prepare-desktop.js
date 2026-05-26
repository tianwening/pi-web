#!/usr/bin/env node
"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const root = path.join(__dirname, "..");
const standaloneDir = path.join(root, ".next", "standalone");

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

if (!fs.existsSync(path.join(standaloneDir, "server.js"))) {
  console.error("Missing .next/standalone/server.js. Run `npm run build` first.");
  process.exit(1);
}

copyDirectory(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));
copyDirectory(path.join(root, "public"), path.join(standaloneDir, "public"));
