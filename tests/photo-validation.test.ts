import { describe, expect, it } from "vitest";

import { detectImageType, normalizeCoordinate, validateBatchCount, validateFileSize } from "../src/lib/photos/validation";

describe("照片上傳驗證", () => {
  it("辨識 JPEG magic bytes", () => {
    expect(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpeg");
  });

  it("拒絕非影像與空檔", () => {
    expect(() => detectImageType(new TextEncoder().encode("not an image"))).toThrow();
    expect(() => validateFileSize(0)).toThrow();
  });

  it("限制每批數量與單檔大小", () => {
    expect(() => validateBatchCount(0)).toThrow();
    expect(() => validateBatchCount(11)).toThrow();
    expect(() => validateFileSize(15 * 1024 * 1024 + 1)).toThrow();
  });

  it("只接受有效座標", () => {
    expect(normalizeCoordinate(25.04, -90, 90)).toBe(25.04);
    expect(normalizeCoordinate(91, -90, 90)).toBeNull();
    expect(normalizeCoordinate(Number.NaN, -180, 180)).toBeNull();
  });
});
