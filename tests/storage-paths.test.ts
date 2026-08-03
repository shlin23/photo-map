import { describe, expect, it } from "vitest";

import { assertSafeStoredName, assertSafeUserId, resolveStoragePath } from "../src/lib/storage/photo-paths";

describe("照片 storage路徑", () => {
  it("接受 server產生的識別碼", () => {
    expect(assertSafeUserId("cm-user_123")).toBe("cm-user_123");
    expect(assertSafeStoredName("123e4567-e89b-12d3-a456-426614174000.jpg")).toContain(".jpg");
  });

  it("拒絕 path traversal", () => {
    expect(() => assertSafeUserId("../../other-user")).toThrow();
    expect(() => assertSafeStoredName("../../secret.jpg")).toThrow();
    expect(() => resolveStoragePath("../outside.jpg")).toThrow();
  });
});
