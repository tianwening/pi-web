"use strict";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app, BrowserWindow, shell } = require("electron");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { spawn } = require("child_process");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require("http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const net = require("net");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildServerEnv, getDevServerUrl, getRuntimeMode, getServerPath } = require("./runtime");

let mainWindow = null;
let serverProcess = null;

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");
}

function getPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(String(address.port));
        } else {
          reject(new Error("Unable to allocate a local port."));
        }
      });
    });
  });
}

function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", (error) => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(error);
          return;
        }
        setTimeout(attempt, 250);
      });

      req.setTimeout(2000, () => {
        req.destroy(new Error("Timed out waiting for local server."));
      });
    }

    attempt();
  });
}

function startNextServer(port) {
  const serverPath = getServerPath(getAppRoot());
  const env = buildServerEnv(process.env, {
    ELECTRON_RUN_AS_NODE: "1",
    HOSTNAME: "127.0.0.1",
    PORT: port,
    NODE_ENV: "production",
  });

  const logDir = path.join(app.getPath("logs"), "server");
  fs.mkdirSync(logDir, { recursive: true });
  const logPath = path.join(logDir, "server.log");
  const logFd = fs.openSync(logPath, "a");

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env,
    stdio: ["ignore", logFd, logFd],
  });

  serverProcess.on("exit", () => {
    serverProcess = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
}

async function getAppUrl() {
  const runtimeMode = getRuntimeMode({ isPackaged: app.isPackaged });

  if (runtimeMode === "development") {
    const url = getDevServerUrl();
    try {
      await waitForServer(url, 5000);
    } catch (error) {
      throw new Error(
        `Unable to reach the Next.js dev server at ${url}. Start it with \`npm run dev\` before running Electron.`,
        { cause: error },
      );
    }
    return url;
  }

  const port = await getPort();
  const url = `http://127.0.0.1:${port}`;

  startNextServer(port);
  await waitForServer(url);
  return url;
}

async function createWindow() {
  const url = await getAppUrl();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Pi Agent",
    backgroundColor: "#0b0f14",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  await mainWindow.loadURL(url);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => {
      console.error(error);
      app.quit();
    });
  }
});
