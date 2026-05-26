"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getDevServerUrl,
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
      env: { PI_WEB_ELECTRON_MODE: "production" },
      isPackaged: false,
    }),
    "production",
  );
});

test("builds the development server URL from env overrides", () => {
  assert.equal(
    getDevServerUrl({
      env: { PI_WEB_DEV_SERVER_URL: "http://localhost:4040" },
    }),
    "http://localhost:4040",
  );

  assert.equal(
    getDevServerUrl({
      env: { PI_WEB_DEV_SERVER_PORT: "3030" },
    }),
    "http://127.0.0.1:3030",
  );
});

test("resolves the standalone server path under the app root", () => {
  assert.equal(
    getServerPath("/tmp/pi-web"),
    "/tmp/pi-web/.next/standalone/server.js",
  );
});
