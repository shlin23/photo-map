import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, posix } from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { readPhotoMetadata } from "@/lib/exif/read-photo-metadata";
import { prisma } from "@/lib/db/prisma";
import { THUMBNAIL_MAX_WIDTH } from "@/lib/photos/constants";
import {
  detectImageType,
  getValidatedType,
  UploadValidationError,
  validateFileSize,
} from "@/lib/photos/validation";
import {
  assertSafeStoredName,
  assertSafeUserId,
  resolveStoragePath,
} from "@/lib/storage/photo-paths";
import type { UploadFileResult } from "@/types/photo-api";

export async function processPhoto(file: File, userId: string): Promise<UploadFileResult> {
  const originalName = normalizeOriginalName(file.name);
  const createdPaths: string[] = [];
  const temporaryPaths: string[] = [];

  try {
    assertSafeUserId(userId);
    validateFileSize(file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectImageType(buffer);
    const validatedType = getValidatedType(detectedType);

    try {
      const metadata = await sharp(buffer, { failOn: "warning", unlimited: false }).metadata();
      if (!metadata.width || !metadata.height) throw new Error("missing dimensions");
    } catch {
      throw new UploadValidationError(
        detectedType === "heif" ? "heic_decode_failed" : "invalid_image",
        detectedType === "heif"
          ? "此執行環境無法安全解碼這張 HEIC／HEIF，請先轉成 JPEG。"
          : "檔案不是可安全解碼的 JPEG 影像。",
      );
    }

    const id = randomUUID();
    const storedName = assertSafeStoredName(`${id}.${validatedType.extension}`);
    const originalRelativePath = posix.join("uploads", userId, storedName);
    const thumbnailRelativePath = posix.join("thumbnails", userId, `${id}.jpg`);
    const originalPath = resolveStoragePath(originalRelativePath);
    const thumbnailPath = resolveStoragePath(thumbnailRelativePath);
    const originalTemp = `${originalPath}.${randomUUID()}.tmp`;
    const thumbnailTemp = `${thumbnailPath}.${randomUUID()}.tmp`;
    temporaryPaths.push(originalTemp, thumbnailTemp);

    await mkdir(dirname(originalPath), { recursive: true });
    await mkdir(dirname(thumbnailPath), { recursive: true });
    await writeFile(originalTemp, buffer, { flag: "wx" });

    const exif = await readPhotoMetadata(buffer);
    let thumbnailCreated = false;
    try {
      await sharp(buffer, { failOn: "warning", unlimited: false })
        .autoOrient()
        .resize({
          width: THUMBNAIL_MAX_WIDTH,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailTemp);
      thumbnailCreated = true;
    } catch {
      if (detectedType === "heif") {
        throw new UploadValidationError(
          "heic_decode_failed",
          "此執行環境無法安全產生 HEIC／HEIF 縮圖，請先轉成 JPEG。",
        );
      }
    }

    if (!thumbnailCreated) await cleanup([thumbnailTemp]);

    await rename(originalTemp, originalPath);
    createdPaths.push(originalPath);
    if (thumbnailCreated) {
      await rename(thumbnailTemp, thumbnailPath);
      createdPaths.push(thumbnailPath);
    }

    const photo = await prisma.photo.create({
      data: {
        id,
        userId,
        originalName,
        storedName,
        mimeType: validatedType.mimeType,
        sizeBytes: buffer.length,
        relativePath: originalRelativePath,
        thumbnailPath: thumbnailCreated ? thumbnailRelativePath : null,
        latitude: exif.latitude,
        longitude: exif.longitude,
        altitude: exif.altitude,
        takenAt: exif.takenAt,
      },
      select: { id: true },
    });

    if (!thumbnailCreated) {
      return { originalName, status: "partial", photoId: photo.id, message: "原圖已保存，但縮圖產生失敗。" };
    }
    if (exif.latitude === null || exif.longitude === null) {
      return { originalName, status: "no_gps", photoId: photo.id, message: "照片已保存，但沒有 GPS 資訊。" };
    }
    return { originalName, status: "success", photoId: photo.id, message: "照片與 GPS 資訊已保存。" };
  } catch (error) {
    await cleanup([...temporaryPaths, ...createdPaths]);
    if (error instanceof UploadValidationError) {
      return { originalName, status: "failed", code: error.code, message: error.message };
    }
    return { originalName, status: "failed", code: "processing_failed", message: "照片處理失敗，請稍後重試。" };
  }
}

function normalizeOriginalName(name: string) {
  const displayName = name.replaceAll("\\", "/").split("/").at(-1)?.trim();
  return (displayName || "未命名照片").slice(0, 255);
}

async function cleanup(paths: string[]) {
  await Promise.allSettled(paths.map((path) => unlink(path)));
}
