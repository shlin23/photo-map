export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
export const THUMBNAIL_MAX_WIDTH = 360;

export const ALLOWED_IMAGE_TYPES = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  heif: { mimeType: "image/heif", extension: "heic" },
} as const;

export type DetectedImageType = keyof typeof ALLOWED_IMAGE_TYPES;
