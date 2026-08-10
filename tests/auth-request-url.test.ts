import { describe, expect, it } from "vitest";

import { APP_BASE_PATH } from "../src/lib/app-path";
import { addAppBasePathToAuthRequest } from "../src/lib/auth/request-url";

describe("Auth.js request URL adapter", () => {
  it("在 subpath deployment 補回 Next.js 剝除的 app base path", () => {
    const input = "http://127.0.0.1:3000/api/auth/providers?source=test";
    const output = new URL(addAppBasePathToAuthRequest(input));

    expect(output.pathname).toBe(`${APP_BASE_PATH}/api/auth/providers`);
    expect(output.search).toBe("?source=test");
  });

  it("不重複加入 app base path", () => {
    const input = `https://example.test${APP_BASE_PATH}/api/auth/callback/google`;
    expect(addAppBasePathToAuthRequest(input)).toBe(input);
  });
});
