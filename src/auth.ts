import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { loginSchema } from "@/lib/auth-schemas";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail } from "@/server/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await findUserByEmail(parsed.data.email);

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.lastName = user.lastName;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
      }
      if (token.lastName) {
        session.user.lastName = token.lastName;
      }
      return session;
    },
  },
  trustHost: true,
});
