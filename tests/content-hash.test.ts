import { describe, expect, it } from "vitest";

import { getPhotoContentHash, getUserStorageKey } from "../src/lib/photos/content-hash";

describe("MD5 storage keys", () => {
  it("creates deterministic 32-character lowercase hashes", () => {
    expect(getUserStorageKey("user-123")).toMatch(/^[0-9a-f]{32}$/);
    expect(getPhotoContentHash(new TextEncoder().encode("photo"))).toMatch(/^[0-9a-f]{32}$/);
    expect(getUserStorageKey("user-123")).toBe(getUserStorageKey("user-123"));
  });

  it("changes when photo bytes change", () => {
    expect(getPhotoContentHash(Uint8Array.of(1, 2, 3))).not.toBe(getPhotoContentHash(Uint8Array.of(1, 2, 4)));
  });
});
