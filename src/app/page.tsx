import Link from "next/link";

import { auth } from "@/auth";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";
import { getAuthenticatedUser } from "@/lib/auth/authorization";

export default async function HomePage() {
  const session = await auth();
  const user = getAuthenticatedUser(session);

  return (
    <section className="hero" aria-labelledby="home-title">
      <h1 id="home-title">Map Your Photos</h1>
      <p className="lead">
        Upload geotagged photos and view where they were taken.
      </p>
      {user ? (
        <div className="auth-panel">
          <p>
            Signed in as <strong>{user.email ?? "Google user"}</strong>
          </p>
          <div className="auth-actions">
            <Link className="primary-link" href="/dashboard">
              Go to Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      ) : (
        <div className="auth-panel">
          <p>Sign in to upload photos and view your map.</p>
          <SignInButton />
        </div>
      )}
    </section>
  );
}
