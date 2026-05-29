export const MIN_SIDEBAR_WIDTH = 260;
export const DEFAULT_SIDEBAR_WIDTH = MIN_SIDEBAR_WIDTH;
export const MAX_SIDEBAR_WIDTH = 520;
export const MIN_CENTER_WIDTH = 520;
export const MIN_RIGHT_PANEL_WIDTH = 300;

export function clampSidebarWidth(width: number, viewportWidth: number, rightPanelOpen: boolean): number {
  const reservedWidth = MIN_CENTER_WIDTH + (rightPanelOpen ? MIN_RIGHT_PANEL_WIDTH : 0);
  const availableMax = Math.max(MIN_SIDEBAR_WIDTH, viewportWidth - reservedWidth);
  const maxWidth = Math.min(MAX_SIDEBAR_WIDTH, availableMax);
  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), maxWidth);
}

export function readStoredSidebarWidth(value: string | null, viewportWidth: number, rightPanelOpen: boolean): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return clampSidebarWidth(parsed, viewportWidth, rightPanelOpen);
}

export function readStoredInitialSidebarWidth(value: string | null): number | null {
  if (!value) return null;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  const parsed = Number(decoded);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, MIN_SIDEBAR_WIDTH), MAX_SIDEBAR_WIDTH);
}

export function readSidebarWidthFromCookie(cookie: string, viewportWidth: number, rightPanelOpen: boolean): number | null {
  const entry = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("pi-sidebar-width="));
  if (!entry) return null;
  return readStoredSidebarWidth(decodeURIComponent(entry.slice("pi-sidebar-width=".length)), viewportWidth, rightPanelOpen);
}
