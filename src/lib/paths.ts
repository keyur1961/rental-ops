import path from "node:path";

const DEFAULT_SQLITE_URL = "file:./dev.db";

export type DataPathEnv = {
  DATABASE_URL?: string;
  DATA_DIR?: string;
  UPLOADS_DIR?: string;
  [key: string]: string | undefined;
};

function resolvedDir(dir: string, cwd: string): string {
  return path.isAbsolute(dir) ? dir : path.resolve(cwd, dir);
}

function fileUrl(absolutePath: string): string {
  return `file:${absolutePath.split("\\").join("/")}`;
}

/** Prisma datasource URL. Local default is `file:./dev.db` (prisma/dev.db). */
export function resolveDatabaseUrl(
  env: DataPathEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const explicit = env.DATABASE_URL?.trim();
  if (explicit) return explicit;

  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) {
    return fileUrl(path.join(resolvedDir(dataDir, cwd), "dev.db"));
  }

  return DEFAULT_SQLITE_URL;
}

/** Photo root. Local default is `uploads/` under the process cwd. */
export function resolveUploadRoot(
  env: DataPathEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const uploadsDir = env.UPLOADS_DIR?.trim();
  if (uploadsDir) return resolvedDir(uploadsDir, cwd);

  const dataDir = env.DATA_DIR?.trim();
  if (dataDir) return path.join(resolvedDir(dataDir, cwd), "uploads");

  return path.join(cwd, "uploads");
}

/** Absolute SQLite file path. Relative `file:` URLs are resolved from `prisma/`. */
export function sqliteFilePath(
  databaseUrl: string,
  cwd: string = process.cwd(),
): string {
  const raw = databaseUrl.replace(/^file:(?:\/\/)?/, "");
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(cwd, "prisma", raw);
}
