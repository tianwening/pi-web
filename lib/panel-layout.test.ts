import assert from "node:assert/strict";
import test from "node:test";
const modulePath = "./panel-layout.ts";
const {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_CENTER_WIDTH,
  MIN_RIGHT_PANEL_WIDTH,
  MIN_SIDEBAR_WIDTH,
  clampSidebarWidth,
  readSidebarWidthFromCookie,
  readStoredInitialSidebarWidth,
  readStoredSidebarWidth,
} = await import(modulePath);

test("sidebar defaults to the minimum width", () => {
  assert.equal(DEFAULT_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH);
});

test("sidebar width is clamped between the configured min and max", () => {
  assert.equal(clampSidebarWidth(120, 1400, false), MIN_SIDEBAR_WIDTH);
  assert.equal(clampSidebarWidth(700, 1400, false), MAX_SIDEBAR_WIDTH);
  assert.equal(clampSidebarWidth(360, 1400, false), 360);
});

test("sidebar width leaves room for the center and open right panel", () => {
  const viewportWidth = 1120;
  const maxUsableWidth = viewportWidth - MIN_CENTER_WIDTH - MIN_RIGHT_PANEL_WIDTH;

  assert.equal(clampSidebarWidth(520, viewportWidth, true), maxUsableWidth);
});

test("stored sidebar width is parsed and clamped", () => {
  assert.equal(readStoredSidebarWidth("360", 1400, false), 360);
  assert.equal(readStoredSidebarWidth("900", 1400, false), MAX_SIDEBAR_WIDTH);
  assert.equal(readStoredSidebarWidth("bad", 1400, false), null);
});

test("initial sidebar width can be restored before viewport data is available", () => {
  assert.equal(readStoredInitialSidebarWidth("360"), 360);
  assert.equal(readStoredInitialSidebarWidth("900"), MAX_SIDEBAR_WIDTH);
  assert.equal(readStoredInitialSidebarWidth("120"), MIN_SIDEBAR_WIDTH);
  assert.equal(readStoredInitialSidebarWidth("bad"), null);
  assert.equal(readStoredInitialSidebarWidth("380%20"), 380);
});

test("sidebar width can be restored from a cookie fallback", () => {
  assert.equal(readSidebarWidthFromCookie("other=1; pi-sidebar-width=380", 1400, false), 380);
  assert.equal(readSidebarWidthFromCookie("pi-sidebar-width=900", 1400, false), MAX_SIDEBAR_WIDTH);
  assert.equal(readSidebarWidthFromCookie("other=1", 1400, false), null);
});
