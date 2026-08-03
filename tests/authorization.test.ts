import { describe, expect, it } from "vitest";

import {
  getAuthenticatedUser,
  protectedRoutes,
} from "../src/lib/auth/authorization";

describe("受保護頁面的登入判斷", () => {
  it("拒絕匿名 session", () => {
    expect(getAuthenticatedUser(null)).toBeNull();
  });

  it("接受具有 database user ID 的 session", () => {
    const session = {
      user: { id: "user-123", email: "learner@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    };

    expect(getAuthenticatedUser(session)).toEqual(session.user);
  });

  it("拒絕缺少 user ID 的 session", () => {
    const session = {
      user: { id: "", email: "learner@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    };

    expect(getAuthenticatedUser(session)).toBeNull();
  });

  it("只列出三個需登入頁面", () => {
    expect(protectedRoutes).toEqual(["/dashboard", "/upload", "/map"]);
    expect(protectedRoutes).not.toContain("/");
    expect(protectedRoutes).not.toContain("/api/auth/callback/google");
  });
});
