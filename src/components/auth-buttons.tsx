import { signIn, signOut } from "@/auth";
import { withBasePath } from "@/lib/app-path";

export function SignInButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: withBasePath("/dashboard") });
      }}
    >
      <button className="primary-link auth-button" type="submit">
        Sign in with Google
      </button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: withBasePath("/") });
      }}
    >
      <button className="secondary-link auth-button" type="submit">
        Sign out
      </button>
    </form>
  );
}
