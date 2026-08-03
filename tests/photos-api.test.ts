import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const listMock = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/photos/map-photos", () => ({ listMappablePhotos: listMock }));
vi.mock("@/lib/photos/process-photo", () => ({ processPhoto: vi.fn() }));

import { GET } from "@/app/api/photos/route";

describe("GET /api/photos", () => {
  beforeEach(() => {
    authMock.mockReset();
    listMock.mockReset();
  });

  it("匿名使用者得到401且不查詢照片", async () => {
    authMock.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it("只用session中的database user ID查詢", async () => {
    authMock.mockResolvedValue({ user: { id: "owner-123", email: "owner@example.com" } });
    listMock.mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listMock).toHaveBeenCalledWith("owner-123");
    expect(await response.json()).toEqual({ photos: [] });
  });
});
