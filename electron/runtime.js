"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");

const DEFAULT_DEV_SERVER_PORT = "30141";

function getRuntimeMode({ env = process.env, isPackaged }) {
  if (env.PI_WEB_ELECTRON_MODE === "production") return "production";
  if (env.PI_WEB_ELECTRON_MODE === "development") return "development";
  return isPackaged ? "production" : "development";
}

function getDevServerUrl({ env = process.env } = {}) {
  if (env.PI_WEB_DEV_SERVER_URL) return env.PI_WEB_DEV_SERVER_URL;
  const port = env.PI_WEB_DEV_SERVER_PORT || env.PORT || DEFAULT_DEV_SERVER_PORT;
  return `http://127.0.0.1:${port}`;
}

function getServerPath(appRoot) {
  return path.join(appRoot, ".next", "standalone", "server.js");
}

module.exports = {
  DEFAULT_DEV_SERVER_PORT,
  getDevServerUrl,
  getRuntimeMode,
  getServerPath,
};
