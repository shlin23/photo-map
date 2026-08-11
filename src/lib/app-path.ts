export const APP_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export function normalizeBasePath(value: string | undefined) {
  if (!value) return "";
  if (!/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(value)) {
    throw new Error("NEXT_PUBLIC_BASE_PATH must be an absolute path without a trailing slash, such as /pm.");
  }
  return value;
}

export function withBasePath(path: string) {
  if (!path.startsWith("/")) {
    throw new Error("App paths must start with /.");
  }

  if (!APP_BASE_PATH || path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
    return path;
  }

  return path === "/" ? APP_BASE_PATH : `${APP_BASE_PATH}${path}`;
}
