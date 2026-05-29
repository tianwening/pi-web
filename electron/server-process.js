"use strict";

function createServerLogStream({ app, fs, path }) {
  const logDir = path.join(app.getPath("logs"), "server");
  fs.mkdirSync(logDir, { recursive: true });
  return fs.createWriteStream(path.join(logDir, "server.log"), { flags: "a" });
}

function startServerProcess({
  app,
  env,
  fs,
  path,
  processExecPath,
  serverPath,
  serverEnv,
  spawn,
  utilityProcess,
}) {
  const cwd = path.dirname(serverPath);
  const logStream = createServerLogStream({ app, fs, path });

  if (utilityProcess && typeof utilityProcess.fork === "function") {
    const child = utilityProcess.fork(serverPath, [], {
      cwd,
      env: serverEnv,
      stdio: "pipe",
    });

    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
    return child;
  }

  return spawn(processExecPath, [serverPath], {
    cwd,
    env: {
      ...env,
      ...serverEnv,
      ELECTRON_RUN_AS_NODE: "1",
    },
    stdio: ["ignore", logStream, logStream],
  });
}

module.exports = {
  startServerProcess,
};
