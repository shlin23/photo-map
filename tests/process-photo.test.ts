import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { File } from "node:buffer";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { photo: { create: database.create } },
}));

import { processPhoto } from "../src/lib/photos/process-photo";

describe("單張照片處理", () => {
  let uploadRoot: string;

  beforeEach(async () => {
    uploadRoot = await mkdtemp(join(tmpdir(), "photo-map-upload-"));
    process.env.UPLOAD_ROOT = uploadRoot;
    database.create.mockReset();
    database.create.mockImplementation(async ({ data }: { data: { id: string } }) => ({ id: data.id }));
  });

  afterEach(async () => {
    delete process.env.UPLOAD_ROOT;
    await rm(uploadRoot, { recursive: true, force: true });
  });

  it("保存synthetic JPEG並產生不含EXIF的thumbnail", async () => {
    const jpeg = await sharp({
      create: { width: 720, height: 480, channels: 3, background: { r: 20, g: 80, b: 140 } },
    })
      .jpeg()
      .toBuffer();
    const file = new File([jpeg], "../../teaching-photo.jpg", { type: "text/plain" }) as unknown as globalThis.File;

    const result = await processPhoto(file, "test-user_123");

    expect(result.status).toBe("no_gps");
    expect(result.originalName).toBe("teaching-photo.jpg");
    expect(database.create).toHaveBeenCalledOnce();
    const thumbnails = await readdir(join(uploadRoot, "thumbnails", "test-user_123"));
    expect(thumbnails).toHaveLength(1);
    const metadata = await sharp(await readFile(join(uploadRoot, "thumbnails", "test-user_123", thumbnails[0]))).metadata();
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(360);
    expect(metadata.height).toBe(240);
    expect(metadata.exif).toBeUndefined();
  });

  it("database失敗時清除本次檔案", async () => {
    database.create.mockRejectedValueOnce(new Error("synthetic database failure"));
    const jpeg = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "white" },
    })
      .jpeg()
      .toBuffer();

    const file = new File([jpeg], "cleanup.jpg", { type: "image/jpeg" }) as unknown as globalThis.File;
    const result = await processPhoto(file, "test-user_123");

    expect(result.status).toBe("failed");
    expect(await readdir(join(uploadRoot, "uploads", "test-user_123"))).toHaveLength(0);
    expect(await readdir(join(uploadRoot, "thumbnails", "test-user_123"))).toHaveLength(0);
  });
});
