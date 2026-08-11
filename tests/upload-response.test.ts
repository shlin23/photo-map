import { describe, expect, it } from "vitest";

import { readUploadResponse } from "../src/lib/photos/upload-response";

describe("upload response parsing", () => {
  it("returns a valid JSON upload result", async () => {
    const response = Response.json({ results: [] });

    await expect(readUploadResponse(response)).resolves.toEqual({ results: [] });
  });

  it("replaces a localized proxy response with an English size message", async () => {
    const response = new Response("要求實體太大，無法顯示網頁。", {
      status: 413,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    await expect(readUploadResponse(response)).rejects.toThrow(
      "The selected photos are too large to upload together. Select fewer photos and try again.",
    );
  });

  it("handles malformed JSON without exposing parser errors", async () => {
    const response = new Response("not JSON", {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    await expect(readUploadResponse(response)).rejects.toThrow(
      "The server returned an invalid response. Please try again.",
    );
  });
});
