import { isAbsolute, relative, resolve } from "node:path";

const SAFE_USER_ID = /^[A-Za-z0-9_-]+$/;
const SAFE_STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|hei[cf])$/i;

export function assertSafeUserId(userId: string) {
  if (!SAFE_USER_ID.test(userId)) {
    throw new Error("無效的使用者識別碼。");
  }
  return userId;
}

export function assertSafeStoredName(storedName: string) {
  if (!SAFE_STORED_NAME.test(storedName)) {
    throw new Error("無效的照片儲存檔名。");
  }
  return storedName;
}

export function resolveStoragePath(relativePath: string) {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error("照片路徑必須是相對路徑。");
  }

  const storageRoot = resolve(/* turbopackIgnore: true */ process.env.UPLOAD_ROOT ?? "storage");
  const resolvedPath = resolve(storageRoot, relativePath);
  const pathWithinRoot = relative(storageRoot, resolvedPath);

  if (!pathWithinRoot || pathWithinRoot.startsWith("..") || isAbsolute(pathWithinRoot)) {
    throw new Error("照片路徑不可離開 storage root。");
  }

  return resolvedPath;
}
