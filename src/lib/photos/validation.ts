import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  type DetectedImageType,
} from "./constants";

const HEIF_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"]);

export class UploadValidationError extends Error {
  constructor(
    public readonly code:
      | "too_large"
      | "unsupported_type"
      | "invalid_image"
      | "heic_decode_failed"
      | "processing_failed",
    message: string,
  ) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function validateBatchCount(count: number) {
  if (count < 1) throw new Error("請至少選擇一張照片。");
  if (count > MAX_FILES_PER_UPLOAD) throw new Error(`每次最多上傳 ${MAX_FILES_PER_UPLOAD} 張照片。`);
}

export function validateFileSize(size: number) {
  if (size < 1) throw new UploadValidationError("invalid_image", "檔案是空的，請重新選擇照片。");
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new UploadValidationError("too_large", "檔案超過 15 MiB，請縮小後重新上傳。");
  }
}

export function detectImageType(buffer: Uint8Array): DetectedImageType {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  if (buffer.length >= 12 && ascii(buffer.subarray(4, 8)) === "ftyp") {
    const brand = ascii(buffer.subarray(8, 12));
    if (HEIF_BRANDS.has(brand)) return "heif";
  }

  throw new UploadValidationError("unsupported_type", "只接受 JPEG、HEIC 或 HEIF 照片。");
}

export function getValidatedType(type: DetectedImageType) {
  return ALLOWED_IMAGE_TYPES[type];
}

export function normalizeCoordinate(value: unknown, minimum: number, maximum: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function ascii(bytes: Uint8Array) {
  return String.fromCharCode(...bytes);
}
