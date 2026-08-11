import type { UploadResponse } from "@/types/photo-api";

type UploadErrorResponse = { message?: string };

export async function readUploadResponse(response: Response): Promise<UploadResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    if (response.status === 413) {
      throw new Error("The selected photos are too large to upload together. Select fewer photos and try again.");
    }

    throw new Error(
      "The upload was rejected before it reached the application. Select fewer photos and try again.",
    );
  }

  let payload: UploadResponse | UploadErrorResponse;
  try {
    payload = (await response.json()) as UploadResponse | UploadErrorResponse;
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  if (!response.ok || !("results" in payload)) {
    throw new Error("message" in payload && payload.message ? payload.message : "Upload failed. Please try again.");
  }

  return payload;
}
