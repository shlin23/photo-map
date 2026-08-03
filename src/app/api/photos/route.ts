import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import { listMappablePhotos } from "@/lib/photos/map-photos";
import { processPhoto } from "@/lib/photos/process-photo";
import { validateBatchCount } from "@/lib/photos/validation";
import type { MapPhotosResponse, UploadResponse } from "@/types/photo-api";

export async function GET() {
  const user = getAuthenticatedUser(await auth());
  if (!user) return NextResponse.json({ message: "請先登入。" }, { status: 401 });

  const photos = await listMappablePhotos(user.id);
  return NextResponse.json<MapPhotosResponse>({ photos });
}

export async function POST(request: Request) {
  const user = getAuthenticatedUser(await auth());
  if (!user) return NextResponse.json({ message: "請先登入。" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "上傳格式無法解析，請重新選擇照片。" }, { status: 400 });
  }

  const photoFields = formData.getAll("photos");
  if (photoFields.some((value) => !(value instanceof File))) {
    return NextResponse.json({ message: "上傳欄位必須全部是照片檔案。" }, { status: 400 });
  }
  const files = photoFields as File[];
  try {
    validateBatchCount(files.length);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "照片數量不正確。" },
      { status: 400 },
    );
  }

  const results: UploadResponse["results"] = [];
  for (const file of files) results.push(await processPhoto(file, user.id));
  return NextResponse.json<UploadResponse>({ results });
}
