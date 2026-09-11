import { mkdirSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  applyDatabaseUrlDefault,
  resolveUploadRoot,
  sqliteFilePath,
} from "./data-paths.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseUrl = applyDatabaseUrlDefault(process.env, root);
const uploadRoot = resolveUploadRoot(process.env, root);

mkdirSync(path.dirname(sqliteFilePath(databaseUrl, root)), { recursive: true });
mkdirSync(uploadRoot, { recursive: true });

const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT?.trim() || "3000";

const pushed = spawnSync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

if (pushed.status !== 0) {
  process.exit(pushed.status ?? 1);
}

const server = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "0.0.0.0", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
    cwd: root,
  },
);

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    server.kill(signal);
  });
}

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

server.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
