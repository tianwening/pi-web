"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const { EventEmitter } = require("node:events");

test("starts the packaged Next server as an Electron utility process", () => {
  const openedLogs = [];
  const forked = [];
  const child = new EventEmitter();
  child.stdout = { pipe: (target) => openedLogs.push(["stdout", target]) };
  child.stderr = { pipe: (target) => openedLogs.push(["stderr", target]) };

  const { startServerProcess } = require("./server-process");
  const serverProcess = startServerProcess({
    app: { getPath: () => "/Users/example/Library/Logs/Pi Agent" },
    env: { PATH: "/existing" },
    fs: {
      mkdirSync: (dir, options) => openedLogs.push(["mkdir", dir, options]),
      createWriteStream: (filePath, options) => {
        openedLogs.push(["stream", filePath, options]);
        return { filePath };
      },
    },
    path: require("node:path"),
    processExecPath: "/Applications/Pi Agent.app/Contents/MacOS/Pi Agent",
    serverPath: "/Applications/Pi Agent.app/Contents/Resources/app/.next/standalone/server.js",
    serverEnv: { PORT: "51234" },
    utilityProcess: {
      fork: (modulePath, args, options) => {
        forked.push({ modulePath, args, options });
        return child;
      },
    },
    spawn: () => {
      throw new Error("spawn fallback should not be used when utilityProcess is available");
    },
  });

  assert.equal(serverProcess, child);
  assert.deepEqual(forked, [
    {
      modulePath: "/Applications/Pi Agent.app/Contents/Resources/app/.next/standalone/server.js",
      args: [],
      options: {
        cwd: "/Applications/Pi Agent.app/Contents/Resources/app/.next/standalone",
        env: { PORT: "51234" },
        stdio: "pipe",
      },
    },
  ]);
  assert.deepEqual(openedLogs, [
    [
      "mkdir",
      "/Users/example/Library/Logs/Pi Agent/server",
      { recursive: true },
    ],
    [
      "stream",
      "/Users/example/Library/Logs/Pi Agent/server/server.log",
      { flags: "a" },
    ],
    ["stdout", { filePath: "/Users/example/Library/Logs/Pi Agent/server/server.log" }],
    ["stderr", { filePath: "/Users/example/Library/Logs/Pi Agent/server/server.log" }],
  ]);
});
