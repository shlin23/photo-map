import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, posix } from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

import { readPhotoMetadata } from "@/lib/exif/read-photo-metadata";
import { prisma } from "@/lib/db/prisma";
import { THUMBNAIL_MAX_WIDTH } from "@/lib/photos/constants";
import { getPhotoContentHash, getUserStorageKey } from "@/lib/photos/content-hash";
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
  let contentHash: string | null = null;

  try {
    assertSafeUserId(userId);
    validateFileSize(file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    contentHash = getPhotoContentHash(buffer);
    const detectedType = detectImageType(buffer);
    const validatedType = getValidatedType(detectedType);

    const duplicate = await prisma.photo.findFirst({
      where: { userId, contentHash },
      select: { id: true },
    });
    if (duplicate) return duplicateResult(originalName, duplicate.id);

    try {
      const metadata = await sharp(buffer, { failOn: "warning", unlimited: false }).metadata();
      if (!metadata.width || !metadata.height) throw new Error("missing dimensions");
    } catch {
      throw new UploadValidationError(
        detectedType === "heif" ? "heic_decode_failed" : "invalid_image",
        detectedType === "heif"
          ? "This HEIC or HEIF photo cannot be processed safely. Convert it to JPEG and try again."
          : "This file is not a valid JPEG photo.",
      );
    }

    const id = randomUUID();
    const userStorageKey = getUserStorageKey(userId);
    const storedName = assertSafeStoredName(`${contentHash}.${validatedType.extension}`);
    const originalRelativePath = posix.join("uploads", userStorageKey, storedName);
    const thumbnailRelativePath = posix.join("thumbnails", userStorageKey, `${contentHash}.jpg`);
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
          "A thumbnail could not be created for this HEIC or HEIF photo. Convert it to JPEG and try again.",
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
        contentHash,
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
      return { originalName, status: "partial", photoId: photo.id, message: "The original photo was saved, but its thumbnail could not be created." };
    }
    if (exif.latitude === null || exif.longitude === null) {
      return { originalName, status: "no_gps", photoId: photo.id, message: "Photo saved without GPS data." };
    }
    return { originalName, status: "success", photoId: photo.id, message: "Photo and GPS data saved." };
  } catch (error) {
    if (contentHash && isUniqueConstraintError(error)) {
      const duplicate = await prisma.photo.findFirst({
        where: { userId, contentHash },
        select: { id: true },
      });
      if (duplicate) {
        await cleanup(temporaryPaths);
        return duplicateResult(originalName, duplicate.id);
      }
    }
    await cleanup([...temporaryPaths, ...createdPaths]);
    if (error instanceof UploadValidationError) {
      return { originalName, status: "failed", code: error.code, message: error.message };
    }
    logProcessingError(error);
    return { originalName, status: "failed", code: "processing_failed", message: "The photo could not be processed. Try again." };
  }
}

function duplicateResult(originalName: string, photoId: string): UploadFileResult {
  return { originalName, status: "duplicate", photoId, message: "This photo has already been uploaded." };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function logProcessingError(error: unknown) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "unknown";
  console.error("[photo-upload] Processing failed.", { errorName, errorCode });
}

function normalizeOriginalName(name: string) {
  const displayName = name.replaceAll("\\", "/").split("/").at(-1)?.trim();
  return (displayName || "Untitled photo").slice(0, 255);
}

async function cleanup(paths: string[]) {
  await Promise.allSettled(paths.map((path) => unlink(path)));
}
