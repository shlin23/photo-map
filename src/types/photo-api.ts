export type UploadFileResult =
  | {
      originalName: string;
      status: "success" | "no_gps" | "partial" | "duplicate";
      photoId: string;
      message: string;
    }
  | {
      originalName: string;
      status: "failed";
      code: "too_large" | "unsupported_type" | "invalid_image" | "heic_decode_failed" | "processing_failed";
      message: string;
    };

export type UploadResponse = { results: UploadFileResult[] };

export type MapPhoto = {
  id: string;
  latitude: number;
  longitude: number;
  takenAt: string | null;
  thumbnailUrl: string | null;
};

export type MapPhotosResponse = { photos: MapPhoto[] };
