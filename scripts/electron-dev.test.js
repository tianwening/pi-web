"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DEFAULT_PORT,
  getDevServerUrl,
  parseLsofPids,
  uniqueProcessIds,
} = require("./electron-dev");

test("parses listening process ids from lsof output", () => {
  const output = [
    "COMMAND   PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME",
    "node    65007 jerry   13u  IPv6  0x00      0t0  TCP *:30141 (LISTEN)",
    "node    65008 jerry   13u  IPv4  0x00      0t0  TCP 127.0.0.1:30141 (LISTEN)",
  ].join("\n");

  assert.deepEqual(parseLsofPids(output), [65007, 65008]);
});

test("deduplicates pids and excludes the current process", () => {
  assert.deepEqual(uniqueProcessIds([123, process.pid, 123, 456]), [123, 456]);
});

test("builds the default electron dev server URL", () => {
  assert.equal(DEFAULT_PORT, "30141");
  assert.equal(getDevServerUrl(DEFAULT_PORT), "http://localhost:30141");
});
