import { describe, expect, it } from "vitest";

import { getUploadSelectionState } from "../src/lib/photos/upload-selection";

describe("upload progressive disclosure", () => {
  it("hides the upload button until photos are selected", () => {
    expect(getUploadSelectionState(0, false)).toEqual({
      showUploadButton: false,
      disableUploadButton: true,
    });
  });

  it("enables upload for 1–10 selected photos", () => {
    expect(getUploadSelectionState(1, false).disableUploadButton).toBe(false);
    expect(getUploadSelectionState(10, false).disableUploadButton).toBe(false);
  });

  it("disables upload above the limit and while uploading", () => {
    expect(getUploadSelectionState(11, false).disableUploadButton).toBe(true);
    expect(getUploadSelectionState(1, true).disableUploadButton).toBe(true);
  });
});
