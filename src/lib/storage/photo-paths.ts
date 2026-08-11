import { isAbsolute, relative, resolve } from "node:path";

const SAFE_USER_ID = /^[A-Za-z0-9_-]+$/;
const UUID_STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|hei[cf])$/i;
const MD5_STORED_NAME = /^[0-9a-f]{32}\.(?:jpe?g|hei[cf])$/;

export function assertSafeUserId(userId: string) {
  if (!SAFE_USER_ID.test(userId)) {
    throw new Error("Invalid user ID.");
  }
  return userId;
}

export function assertSafeStoredName(storedName: string) {
  if (!UUID_STORED_NAME.test(storedName) && !MD5_STORED_NAME.test(storedName)) {
    throw new Error("Invalid stored photo name.");
  }
  return storedName;
}

export function resolveStoragePath(relativePath: string) {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error("Photo paths must be relative.");
  }

  const storageRoot = resolve(/* turbopackIgnore: true */ process.env.UPLOAD_ROOT ?? "storage");
  const resolvedPath = resolve(storageRoot, relativePath);
  const pathWithinRoot = relative(storageRoot, resolvedPath);

  if (!pathWithinRoot || pathWithinRoot.startsWith("..") || isAbsolute(pathWithinRoot)) {
    throw new Error("Photo paths must stay within the storage root.");
  }

  return resolvedPath;
}
