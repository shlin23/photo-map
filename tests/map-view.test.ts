import { describe, expect, it } from "vitest";

import { createPhotoFeatureCollection, formatCoordinate, formatTakenAt, getMapViewport } from "@/lib/map/map-view";
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

  it("建立只包含photo ID與座標的GeoJSON point", () => {
    expect(createPhotoFeatureCollection([photo("one", 23.95, 120.93)])).toEqual({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Point", coordinates: [120.93, 23.95] },
        properties: { photoId: "one" },
      }],
    });
  });

  it("處理未知時間並將座標顯示至小數點後五位", () => {
    expect(formatTakenAt(null)).toBe("Date taken unavailable");
    expect(formatTakenAt("not-a-date")).toBe("Date taken unavailable");
    expect(formatTakenAt("2026-08-03T12:00:00.000Z", "en-US")).not.toBe("Date taken unavailable");
    expect(formatCoordinate(25.0331234)).toBe("25.03312");
  });
});
