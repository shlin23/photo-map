import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconDirectory = path.join(projectRoot, "public", "icons");
const source = path.join(iconDirectory, "rail-pm.svg");

await mkdir(iconDirectory, { recursive: true });
await Promise.all([
  sharp(source).resize(192, 192).png().toFile(path.join(iconDirectory, "rail-pm-192.png")),
  sharp(source).resize(512, 512).png().toFile(path.join(iconDirectory, "rail-pm-512.png")),
  sharp(source).resize(180, 180).png().toFile(path.join(iconDirectory, "rail-pm-apple.png")),
]);

console.log("Generated RAIL PM PWA icons.");
