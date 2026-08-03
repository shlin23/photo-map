import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth-buttons";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export default async function ProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  const user = getAuthenticatedUser(session);

  if (!user) {
    redirect("/");
  }

  return (
    <>
      <aside className="session-bar" aria-label="登入狀態">
        <p>
          已登入：<strong>{user.email ?? "Google 使用者"}</strong>
        </p>
        <SignOutButton />
      </aside>
      {children}
    </>
  );
}
