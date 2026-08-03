import { describe, expect, it } from "vitest";

import { formatCoordinate, formatTakenAt, getMapViewport } from "@/lib/map/map-view";
import type { MapPhoto } from "@/types/photo-api";

const photo = (id: string, latitude: number, longitude: number): MapPhoto => ({
  id,
  latitude,
  longitude,
  takenAt: null,
  thumbnailUrl: null,
});

describe("地圖viewport與popup格式", () => {
  it("區分空資料、單點與多點", () => {
    expect(getMapViewport([])).toEqual({ kind: "empty" });
    expect(getMapViewport([photo("one", 25, 121)])).toEqual({
      kind: "single",
      center: [121, 25],
      zoom: 14,
    });
    expect(getMapViewport([photo("a", 25, 121), photo("b", 24, 122)])).toEqual({
      kind: "bounds",
      bounds: [[121, 24], [122, 25]],
      padding: 48,
      maxZoom: 16,
    });
  });

  it("處理未知時間並將座標顯示至小數點後五位", () => {
    expect(formatTakenAt(null)).toBe("拍攝時間未知");
    expect(formatTakenAt("not-a-date")).toBe("拍攝時間未知");
    expect(formatTakenAt("2026-08-03T12:00:00.000Z", "zh-TW")).not.toBe("拍攝時間未知");
    expect(formatCoordinate(25.0331234)).toBe("25.03312");
  });
});
