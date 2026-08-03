import { existsSync } from "node:fs";
import { mkdir, open } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!databaseUrl.startsWith("file:./")) {
  throw new Error("DATABASE_URL 必須是 workspace 內的相對 SQLite file URL。");
}

const workspaceRoot = process.cwd();
const databasePath = resolve(workspaceRoot, databaseUrl.slice("file:".length));
const relativeDatabasePath = relative(workspaceRoot, databasePath);

if (relativeDatabasePath.startsWith("..") || relativeDatabasePath === "") {
  throw new Error("DATABASE_URL 不可指向 workspace 外或 workspace root。");
}

await mkdir(dirname(databasePath), { recursive: true });
const databaseFile = await open(databasePath, "a");
await databaseFile.close();
