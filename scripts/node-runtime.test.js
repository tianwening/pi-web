"use strict";

/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getNodeCandidatePath,
  isCodexBundledNode,
} = require("./node-runtime");

test("detects Codex bundled Node paths", () => {
  assert.equal(
    isCodexBundledNode("/Applications/Codex.app/Contents/Resources/node"),
    true,
  );
  assert.equal(
    isCodexBundledNode("/Users/jerry/.local/share/fnm/node-versions/v24.14.1/installation/bin/node"),
    false,
  );
});

test("builds platform-specific Node candidate paths", () => {
  assert.equal(getNodeCandidatePath("/opt/homebrew/bin", "darwin"), "/opt/homebrew/bin/node");
  assert.equal(getNodeCandidatePath("C:\\tools", "win32"), "C:\\tools/node.exe");
});
