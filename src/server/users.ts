import "server-only";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export async function createUser(input: {
  email: string;
  name: string;
  lastName: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new DuplicateEmailError();
  }

  const passwordHash = await hashPassword(input.password);

  return db.user.create({
    data: {
      email: input.email,
      name: input.name,
      lastName: input.lastName,
      passwordHash,
    },
  });
}
