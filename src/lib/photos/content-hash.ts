import { createHash } from "node:crypto";

export function md5Hex(value: string | Uint8Array) {
  return createHash("md5").update(value).digest("hex");
}

export function getUserStorageKey(userId: string) {
  return md5Hex(userId);
}

export function getPhotoContentHash(bytes: Uint8Array) {
  return md5Hex(bytes);
}
