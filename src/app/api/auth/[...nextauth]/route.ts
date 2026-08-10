import { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { addAppBasePathToAuthRequest } from "@/lib/auth/request-url";

export function GET(request: NextRequest) {
  return handlers.GET(withAppBasePath(request));
}

export function POST(request: NextRequest) {
  return handlers.POST(withAppBasePath(request));
}

function withAppBasePath(request: NextRequest) {
  const url = addAppBasePathToAuthRequest(request.url);
  return url === request.url ? request : new NextRequest(url, request);
}
