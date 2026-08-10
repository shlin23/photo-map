import { prisma } from "@/lib/db/prisma";
import { withBasePath } from "@/lib/app-path";
import { normalizeCoordinate } from "@/lib/photos/validation";
import type { MapPhoto } from "@/types/photo-api";

type MapPhotoRecord = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  takenAt: Date | null;
  thumbnailPath: string | null;
};

export async function listMappablePhotos(userId: string): Promise<MapPhoto[]> {
  const records = await prisma.photo.findMany({
    where: {
      userId,
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: [{ takenAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      latitude: true,
      longitude: true,
      takenAt: true,
      thumbnailPath: true,
    },
  });

  return records.flatMap(toMapPhoto);
}

export function toMapPhoto(record: MapPhotoRecord): MapPhoto[] {
  const latitude = normalizeCoordinate(record.latitude, -90, 90);
  const longitude = normalizeCoordinate(record.longitude, -180, 180);
  if (latitude === null || longitude === null) return [];

  return [{
    id: record.id,
    latitude,
    longitude,
    takenAt: record.takenAt?.toISOString() ?? null,
    thumbnailUrl: record.thumbnailPath ? withBasePath(`/api/photos/${record.id}/thumbnail`) : null,
  }];
}
