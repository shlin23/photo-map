import type { MapPhoto } from "@/types/photo-api";

export type MapViewport =
  | { kind: "empty" }
  | { kind: "single"; center: [longitude: number, latitude: number]; zoom: 14 }
  | { kind: "bounds"; bounds: [[number, number], [number, number]]; padding: 48; maxZoom: 16 };

export function getMapViewport(photos: MapPhoto[]): MapViewport {
  if (photos.length === 0) return { kind: "empty" };
  if (photos.length === 1) {
    const photo = photos[0];
    return { kind: "single", center: [photo.longitude, photo.latitude], zoom: 14 };
  }

  const longitudes = photos.map((photo) => photo.longitude);
  const latitudes = photos.map((photo) => photo.latitude);
  return {
    kind: "bounds",
    bounds: [
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ],
    padding: 48,
    maxZoom: 16,
  };
}

export function formatTakenAt(takenAt: string | null, locale?: string) {
  if (!takenAt) return "拍攝時間未知";
  const date = new Date(takenAt);
  if (Number.isNaN(date.getTime())) return "拍攝時間未知";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatCoordinate(value: number) {
  return value.toFixed(5);
}
