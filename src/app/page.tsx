import Link from "next/link";

import { auth } from "@/auth";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export default async function HomePage() {
  const session = await auth();
  const user = getAuthenticatedUser(session);

  return (
    <section className="hero" aria-labelledby="home-title">
      <p className="eyebrow">Phase 0</p>
      <h1 id="home-title">把照片帶回拍攝地點</h1>
      <p className="lead">
        照片地圖將讓你登入後上傳照片，並依照片中的 GPS 資訊顯示自己的拍攝足跡。
      </p>
      {user ? (
        <div className="auth-panel">
          <p>
            已登入：<strong>{user.email ?? "Google 使用者"}</strong>
          </p>
          <div className="auth-actions">
            <Link className="primary-link" href="/dashboard">
              前往控制台
            </Link>
            <SignOutButton />
          </div>
        </div>
      ) : (
        <div className="auth-panel">
          <p>登入後才能開啟控制台、上傳與地圖。</p>
          <SignInButton />
        </div>
      )}
    </section>
  );
}
