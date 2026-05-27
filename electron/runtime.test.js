"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildServerEnv,
  getDevServerUrl,
  joinUniquePaths,
  getRuntimeMode,
  getServerPath,
} = require("./runtime");

test("uses the Next dev server when Electron is not packaged", () => {
  assert.equal(getRuntimeMode({ isPackaged: false }), "development");
});

test("uses the bundled standalone server when Electron is packaged", () => {
  assert.equal(getRuntimeMode({ isPackaged: true }), "production");
});

test("allows forcing standalone mode in an unpackaged Electron process", () => {
  assert.equal(
    getRuntimeMode({
      env: { PI_AGENT_ELECTRON_MODE: "production" },
      isPackaged: false,
    }),
    "production",
  );
});

test("builds the development server URL from env overrides", () => {
  assert.equal(
    getDevServerUrl({
      env: { PI_AGENT_DEV_SERVER_URL: "http://localhost:4040" },
    }),
    "http://localhost:4040",
  );

  assert.equal(
    getDevServerUrl({
      env: { PI_AGENT_DEV_SERVER_PORT: "3030" },
    }),
    "http://localhost:3030",
  );
});

test("resolves the standalone server path under the app root", () => {
  assert.equal(
    getServerPath("/tmp/pi-agent"),
    "/tmp/pi-agent/.next/standalone/server.js",
  );
});

test("deduplicates PATH entries while preserving order", () => {
  assert.equal(
    joinUniquePaths("/a:/b", "/b:/c"),
    "/a:/b:/c",
  );
});

test("adds common user and system paths to packaged server env", () => {
  const env = buildServerEnv(
    { HOME: "/Users/example", PATH: "/existing" },
    { NODE_ENV: "production" },
  );

  assert.equal(env.NODE_ENV, "production");
  assert.match(env.PATH, /\/Users\/example\/\.npm-global\/bin/);
  assert.match(env.PATH, /\/opt\/homebrew\/bin/);
  assert.match(env.PATH, /\/existing/);
});
