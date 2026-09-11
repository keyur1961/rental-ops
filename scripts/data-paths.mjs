import path from "node:path";

/** Keep in sync with src/lib/paths.ts */

export function resolveDatabaseUrl(env = process.env, cwd = process.cwd()) {
  const explicit = env.DATABASE_URL?.trim();
  if (explicit) return explicit;

  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) {
    const absolute = path.isAbsolute(dataDir) ? dataDir : path.resolve(cwd, dataDir);
    return `file:${path.join(absolute, "dev.db").split("\\").join("/")}`;
  }

  return "file:./dev.db";
}

export function resolveUploadRoot(env = process.env, cwd = process.cwd()) {
  const uploadsDir = env.UPLOADS_DIR?.trim();
  if (uploadsDir) {
    return path.isAbsolute(uploadsDir) ? uploadsDir : path.resolve(cwd, uploadsDir);
  }

  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) {
    const absolute = path.isAbsolute(dataDir) ? dataDir : path.resolve(cwd, dataDir);
    return path.join(absolute, "uploads");
  }

  return path.join(cwd, "uploads");
}

export function sqliteFilePath(databaseUrl, cwd = process.cwd()) {
  const raw = databaseUrl.replace(/^file:(?:\/\/)?/, "");
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(cwd, "prisma", raw);
}

export function applyDatabaseUrlDefault(env = process.env, cwd = process.cwd()) {
  env.DATABASE_URL = resolveDatabaseUrl(env, cwd);
  return env.DATABASE_URL;
}
