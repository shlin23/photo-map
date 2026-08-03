import type { Session } from "next-auth";

export const protectedRoutes = ["/dashboard", "/upload", "/map"] as const;

export function getAuthenticatedUser(session: Session | null) {
  if (!session?.user?.id?.trim()) {
    return null;
  }

  return session.user;
}
