import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { isHeicBuffer, preprocessOcrImage, rotateJpeg } from "./preprocess";

describe("isHeicBuffer", () => {
  it("detects ftyp/heic brands and ignores JPEG", () => {
    const heic = Buffer.concat([Buffer.alloc(4), Buffer.from("ftypheic")]);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    assert.equal(isHeicBuffer(heic), true);
    assert.equal(isHeicBuffer(jpeg), false);
  });
});

describe("preprocessOcrImage", () => {
  it("downscales a large JPEG and emits a JPEG", async () => {
    const landscape = await sharp({
      create: { width: 2400, height: 1200, channels: 3, background: { r: 240, g: 240, b: 240 } },
    })
      .jpeg()
      .toBuffer();

    const processed = await preprocessOcrImage(landscape);
    const meta = await sharp(processed).metadata();

    assert.equal(meta.format, "jpeg");
    assert.ok((meta.width ?? 0) <= 2000);
    assert.ok((meta.height ?? 0) <= 2000);
    assert.ok((meta.width ?? 0) >= 1000);
  });

  it("rotates a JPEG 90 degrees", async () => {
    const landscape = await sharp({
      create: { width: 80, height: 40, channels: 3, background: { r: 20, g: 20, b: 20 } },
    })
      .jpeg()
      .toBuffer();
    const rotated = await rotateJpeg(landscape, 90);
    const meta = await sharp(rotated).metadata();
    assert.equal(meta.width, 40);
    assert.equal(meta.height, 80);
  });
});
