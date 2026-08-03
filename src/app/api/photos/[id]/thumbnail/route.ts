import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAuthenticatedUser } from "@/lib/auth/authorization";
import { prisma } from "@/lib/db/prisma";
import { resolveStoragePath } from "@/lib/storage/photo-paths";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = getAuthenticatedUser(await auth());
  if (!user) return NextResponse.json({ message: "請先登入。" }, { status: 401 });

  const { id } = await context.params;
  const photo = await prisma.photo.findFirst({
    where: { id, userId: user.id },
    select: { thumbnailPath: true },
  });
  if (!photo?.thumbnailPath) return notFound();

  try {
    const data = await readFile(resolveStoragePath(photo.thumbnailPath));
    return new Response(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return notFound();
  }
}

function notFound() {
  return NextResponse.json({ message: "找不到縮圖。" }, { status: 404 });
}
