import { APP_BASE_PATH } from "@/lib/app-path";

export function addAppBasePathToAuthRequest(url: string) {
  if (!APP_BASE_PATH) return url;

  const parsedUrl = new URL(url);
  if (parsedUrl.pathname === APP_BASE_PATH || parsedUrl.pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return url;
  }

  parsedUrl.pathname = `${APP_BASE_PATH}${parsedUrl.pathname}`;
  return parsedUrl.toString();
}
