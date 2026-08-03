import { describe, expect, it } from "vitest";

import { navigationItems } from "../src/lib/navigation";

describe("主要 route 定義", () => {
  it("包含 Phase 0 的四個頁面且沒有重複路徑", () => {
    const paths = navigationItems.map((item) => item.href);

    expect(paths).toEqual(["/", "/dashboard", "/upload", "/map"]);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("每個 route 都有繁體中文導覽標籤", () => {
    expect(navigationItems.every((item) => item.label.trim().length > 0)).toBe(true);
  });
});
