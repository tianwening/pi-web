"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execFileSync } = require("child_process");

const DEFAULT_DEV_SERVER_PORT = "30141";
const FALLBACK_PATHS = [
  "/opt/homebrew/bin",
  "/opt/homebrew/sbin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
];

function getRuntimeMode({ env = process.env, isPackaged }) {
  if (env.PI_AGENT_ELECTRON_MODE === "production") return "production";
  if (env.PI_AGENT_ELECTRON_MODE === "development") return "development";
  return isPackaged ? "production" : "development";
}

function getDevServerUrl({ env = process.env } = {}) {
  if (env.PI_AGENT_DEV_SERVER_URL) return env.PI_AGENT_DEV_SERVER_URL;
  const port = env.PI_AGENT_DEV_SERVER_PORT || env.PORT || DEFAULT_DEV_SERVER_PORT;
  return `http://localhost:${port}`;
}

function getServerPath(appRoot) {
  return path.join(appRoot, ".next", "standalone", "server.js");
}

function splitPath(value) {
  return (value || "").split(path.delimiter).filter(Boolean);
}

function joinUniquePaths(...values) {
  const seen = new Set();
  const paths = [];
  for (const value of values) {
    for (const entry of splitPath(value)) {
      if (seen.has(entry)) continue;
      seen.add(entry);
      paths.push(entry);
    }
  }
  return paths.join(path.delimiter);
}

function getLoginShellPath({ env = process.env, platform = process.platform } = {}) {
  if (platform === "win32") return "";

  const shell = env.SHELL || "/bin/zsh";
  try {
    return execFileSync(shell, ["-ilc", "print -r -- $PATH"], {
      encoding: "utf8",
      timeout: 3000,
      env,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function buildServerEnv(baseEnv, overrides = {}) {
  const home = baseEnv.HOME;
  const userPaths = home
    ? [
        path.join(home, ".npm-global", "bin"),
        path.join(home, ".local", "bin"),
        path.join(home, ".local", "share", "fnm"),
      ].join(path.delimiter)
    : "";

  return {
    ...baseEnv,
    ...overrides,
    PATH: joinUniquePaths(
      getLoginShellPath({ env: baseEnv }),
      userPaths,
      FALLBACK_PATHS.join(path.delimiter),
      baseEnv.PATH,
    ),
  };
}

module.exports = {
  DEFAULT_DEV_SERVER_PORT,
  buildServerEnv,
  getDevServerUrl,
  getLoginShellPath,
  getRuntimeMode,
  getServerPath,
  joinUniquePaths,
};
