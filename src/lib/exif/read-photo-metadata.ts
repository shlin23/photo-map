import exifr from "exifr";

import { normalizeCoordinate } from "../photos/validation";

export type PhotoMetadata = {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  takenAt: Date | null;
};

export async function readPhotoMetadata(buffer: Buffer): Promise<PhotoMetadata> {
  try {
    const [gps, details] = await Promise.all([
      exifr.gps(buffer),
      exifr.parse(buffer, ["GPSAltitude", "DateTimeOriginal"]),
    ]);
    const latitude = normalizeCoordinate(gps?.latitude, -90, 90);
    const longitude = normalizeCoordinate(gps?.longitude, -180, 180);
    const hasValidPair = latitude !== null && longitude !== null;
    const altitude =
      typeof details?.GPSAltitude === "number" && Number.isFinite(details.GPSAltitude)
        ? details.GPSAltitude
        : null;
    const takenAt =
      details?.DateTimeOriginal instanceof Date && !Number.isNaN(details.DateTimeOriginal.getTime())
        ? details.DateTimeOriginal
        : null;

    return {
      latitude: hasValidPair ? latitude : null,
      longitude: hasValidPair ? longitude : null,
      altitude: hasValidPair ? altitude : null,
      takenAt,
    };
  } catch {
    return { latitude: null, longitude: null, altitude: null, takenAt: null };
  }
}
