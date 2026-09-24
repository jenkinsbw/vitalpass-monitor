import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    lastName: string;
  }

  interface Session {
    user: {
      id: string;
      lastName: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    lastName?: string;
  }
}
