import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { readPhotoMetadata } from "../src/lib/exif/read-photo-metadata";

async function createTestJpeg() {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 30, g: 120, b: 80 } },
  })
    .jpeg()
    .toBuffer();
}

describe("EXIF與thumbnail安全", () => {
  it("沒有GPS的有效JPEG回傳null座標", async () => {
    const metadata = await readPhotoMetadata(await createTestJpeg());
    expect(metadata.latitude).toBeNull();
    expect(metadata.longitude).toBeNull();
  });

  it("Sharp預設JPEG輸出不保留EXIF", async () => {
    const source = await sharp(await createTestJpeg())
      .withExif({ IFD0: { Copyright: "test-only" } })
      .toBuffer();
    expect((await sharp(source).metadata()).exif).toBeDefined();

    const thumbnail = await sharp(source).resize({ width: 4, height: 4, fit: "inside" }).jpeg().toBuffer();
    expect((await sharp(thumbnail).metadata()).exif).toBeUndefined();
  });
});
