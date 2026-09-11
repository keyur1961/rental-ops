import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyDatabaseUrlDefault } from "./data-paths.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
applyDatabaseUrlDefault(process.env, root);

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Usage: node scripts/with-database-url.mjs <command> [...args]");
  process.exit(1);
}

const prismaCli = path.join(root, "node_modules", "prisma", "build", "index.js");
const argv = command === "prisma" ? [process.execPath, prismaCli, ...args] : [command, ...args];

const child = spawn(argv[0], argv.slice(1), {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
