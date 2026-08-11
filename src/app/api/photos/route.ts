import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import { listMappablePhotos } from "@/lib/photos/map-photos";
import { processPhoto } from "@/lib/photos/process-photo";
import { validateBatchCount } from "@/lib/photos/validation";
import type { MapPhotosResponse, UploadResponse } from "@/types/photo-api";

export async function GET() {
  const user = getAuthenticatedUser(await auth());
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  const photos = await listMappablePhotos(user.id);
  return NextResponse.json<MapPhotosResponse>({ photos });
}

export async function POST(request: Request) {
  const user = getAuthenticatedUser(await auth());
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "The upload could not be read. Select your photos again." }, { status: 400 });
  }

  const photoFields = formData.getAll("photos");
  if (photoFields.some((value) => !(value instanceof File))) {
    return NextResponse.json({ message: "Every uploaded item must be a photo file." }, { status: 400 });
  }
  const files = photoFields as File[];
  try {
    validateBatchCount(files.length);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Select between 1 and 10 photos." },
      { status: 400 },
    );
  }

  const results: UploadResponse["results"] = [];
  for (const file of files) results.push(await processPhoto(file, user.id));
  return NextResponse.json<UploadResponse>({ results });
}
