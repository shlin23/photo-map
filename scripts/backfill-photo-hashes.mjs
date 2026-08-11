import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import Database from "better-sqlite3";

if (await fileExists(".env.local")) process.loadEnvFile(".env.local");

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
if (!databaseUrl.startsWith("file:./")) throw new Error("DATABASE_URL must point to a workspace-relative SQLite file.");

const databasePath = resolve(databaseUrl.slice("file:".length));
const storageRoot = resolve(process.env.UPLOAD_ROOT ?? "storage");
const database = new Database(databasePath);
const photos = database.prepare("SELECT id, userId, relativePath FROM Photo WHERE contentHash IS NULL ORDER BY createdAt, id").all();
const findDuplicate = database.prepare("SELECT id FROM Photo WHERE userId = ? AND contentHash = ? LIMIT 1");
const updateHash = database.prepare("UPDATE Photo SET contentHash = ? WHERE id = ? AND contentHash IS NULL");

let updated = 0;
let duplicates = 0;
let missing = 0;

for (const photo of photos) {
  const originalPath = resolveStorageFile(storageRoot, photo.relativePath);
  let bytes;
  try {
    bytes = await readFile(originalPath);
  } catch {
    missing += 1;
    continue;
  }

  const contentHash = createHash("md5").update(bytes).digest("hex");
  if (findDuplicate.get(photo.userId, contentHash)) {
    duplicates += 1;
    continue;
  }

  updateHash.run(contentHash, photo.id);
  updated += 1;
}

database.close();
console.log(JSON.stringify({ scanned: photos.length, updated, duplicatesLeftUnchanged: duplicates, missingFiles: missing }));

function resolveStorageFile(root, storedPath) {
  if (!storedPath || isAbsolute(storedPath)) throw new Error("Photo paths must be relative.");
  const resolvedPath = resolve(root, storedPath);
  const withinRoot = relative(root, resolvedPath);
  if (!withinRoot || withinRoot.startsWith("..") || isAbsolute(withinRoot)) {
    throw new Error("Photo paths must stay within the storage root.");
  }
  return resolvedPath;
}

async function fileExists(path) {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
