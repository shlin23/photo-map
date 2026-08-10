import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/db/prisma";
import { APP_BASE_PATH } from "@/lib/app-path";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  basePath: `${APP_BASE_PATH}/api/auth`,
  providers: [Google],
  session: {
    strategy: "database",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
