import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ findMany: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { photo: { findMany: database.findMany } },
}));

import { listMappablePhotos, toMapPhoto } from "@/lib/photos/map-photos";
import { withBasePath } from "@/lib/app-path";

describe("地圖照片查詢", () => {
  beforeEach(() => database.findMany.mockReset());

  it("以目前使用者與完整GPS作為database條件", async () => {
    database.findMany.mockResolvedValue([]);
    await listMappablePhotos("owner-123");

    expect(database.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        userId: "owner-123",
        latitude: { not: null },
        longitude: { not: null },
      },
    }));
  });

  it("只輸出安全DTO，不包含內部路徑與原始檔名", async () => {
    database.findMany.mockResolvedValue([{
      id: "photo-1",
      latitude: 25.033,
      longitude: 121.5654,
      takenAt: new Date("2026-08-03T12:00:00.000Z"),
      thumbnailPath: "thumbnails/owner-123/photo-1.jpg",
      relativePath: "uploads/owner-123/private.jpg",
      originalName: "private.jpg",
      storedName: "secret.jpg",
      userId: "owner-123",
    }]);

    const photos = await listMappablePhotos("owner-123");
    expect(photos).toEqual([{
      id: "photo-1",
      latitude: 25.033,
      longitude: 121.5654,
      takenAt: "2026-08-03T12:00:00.000Z",
      thumbnailUrl: withBasePath("/api/photos/photo-1/thumbnail"),
    }]);
    expect(JSON.stringify(photos)).not.toMatch(/relativePath|storedName|originalName|userId/);
  });

  it("防禦性排除半組、null與越界座標", () => {
    const base = { id: "photo-1", takenAt: null, thumbnailPath: null };
    expect(toMapPhoto({ ...base, latitude: null, longitude: 121 })).toEqual([]);
    expect(toMapPhoto({ ...base, latitude: 25, longitude: null })).toEqual([]);
    expect(toMapPhoto({ ...base, latitude: 91, longitude: 121 })).toEqual([]);
    expect(toMapPhoto({ ...base, latitude: 25, longitude: 181 })).toEqual([]);
  });
});
