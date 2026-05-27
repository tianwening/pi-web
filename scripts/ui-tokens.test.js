/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

function expectToken(name, value) {
  assert.match(css, new RegExp(`${name}:\\s*${value};`));
}

test("global theme tokens follow the Apple-inspired visual system", () => {
  expectToken("--bg", "#f5f5f7");
  expectToken("--text", "#1d1d1f");
  expectToken("--text-muted", "#6e6e73");
  expectToken("--accent", "#0066cc");
  expectToken("--accent-hover", "#0071e3");
  expectToken("--frosted-bg", "rgba\\(255,255,255,0.78\\)");
});

test("dark theme keeps Apple-style blue links and neutral surfaces", () => {
  expectToken("--accent", "#2997ff");
  expectToken("--bg-panel", "#1d1d1f");
});
