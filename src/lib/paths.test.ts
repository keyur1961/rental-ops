import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import {
  resolveDatabaseUrl,
  resolveUploadRoot,
  sqliteFilePath,
} from "./paths";

const cwd = "/app";

describe("data paths", () => {
  it("defaults to local prisma sqlite and cwd uploads", () => {
    assert.equal(resolveDatabaseUrl({}, cwd), "file:./dev.db");
    assert.equal(resolveUploadRoot({}, cwd), path.join(cwd, "uploads"));
    assert.equal(sqliteFilePath("file:./dev.db", cwd), path.join(cwd, "prisma", "dev.db"));
  });

  it("puts db and uploads on DATA_DIR when DATABASE_URL is unset", () => {
    const env = { DATA_DIR: "/data" };
    assert.equal(resolveDatabaseUrl(env, cwd), "file:/data/dev.db");
    assert.equal(resolveUploadRoot(env, cwd), path.join("/data", "uploads"));
    assert.equal(sqliteFilePath("file:/data/dev.db", cwd), "/data/dev.db");
  });

  it("keeps an explicit DATABASE_URL and still uses DATA_DIR for uploads", () => {
    const env = { DATA_DIR: "/data", DATABASE_URL: "file:/data/custom.db" };
    assert.equal(resolveDatabaseUrl(env, cwd), "file:/data/custom.db");
    assert.equal(resolveUploadRoot(env, cwd), path.join("/data", "uploads"));
  });

  it("lets UPLOADS_DIR override the photo root", () => {
    assert.equal(
      resolveUploadRoot({ DATA_DIR: "/data", UPLOADS_DIR: "/mnt/photos" }, cwd),
      "/mnt/photos",
    );
  });
});
