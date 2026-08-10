import { describe, expect, it } from "vitest";

import { APP_BASE_PATH, normalizeBasePath, withBasePath } from "../src/lib/app-path";

describe("公開部署 base path", () => {
  it("驗證 optional base path 格式", () => {
    expect(normalizeBasePath(undefined)).toBe("");
    expect(normalizeBasePath("/pm")).toBe("/pm");
    expect(() => normalizeBasePath("pm")).toThrow();
    expect(() => normalizeBasePath("/pm/")).toThrow();
  });

  it("替手寫 API 與 redirect path 加上 /pm，且不重複加入", () => {
    expect(withBasePath("/")).toBe(APP_BASE_PATH || "/");
    expect(withBasePath("/api/photos")).toBe(`${APP_BASE_PATH}/api/photos`);
    expect(withBasePath(`${APP_BASE_PATH}/api/photos`)).toBe(`${APP_BASE_PATH}/api/photos`);
  });

  it("拒絕不是 absolute-path reference 的輸入", () => {
    expect(() => withBasePath("api/photos")).toThrow();
  });
});
