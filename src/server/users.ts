import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { createUserSchema, updateUserSchema } from "@/lib/users";
import type { z } from "zod";

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

const userPublicSelect = {
  id: true,
  email: true,
  name: true,
  lastName: true,
  createdAt: true,
} as const;

export class DuplicateEmailError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "DuplicateEmailError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found.");
    this.name = "UserNotFoundError";
  }
}

export class LastUserError extends Error {
  constructor() {
    super("Cannot delete the last user.");
    this.name = "LastUserError";
  }
}

export async function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function listUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userPublicSelect,
  });
}

export function getUser(id: string) {
  return db.user.findUnique({
    where: { id },
    select: userPublicSelect,
  });
}

export async function createUserRecord(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.user.create({
      data: {
        email: input.email,
        name: input.name,
        lastName: input.lastName,
        passwordHash,
      },
      select: userPublicSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateEmailError();
    }

    throw error;
  }
}

export async function updateUserRecord(input: UpdateUserInput) {
  const data: {
    email: string;
    name: string;
    lastName: string;
    passwordHash?: string;
  } = {
    email: input.email,
    name: input.name,
    lastName: input.lastName,
  };

  if (input.password) {
    data.passwordHash = await hashPassword(input.password);
  }

  try {
    return await db.user.update({
      where: { id: input.id },
      data,
      select: userPublicSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new UserNotFoundError();
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateEmailError();
    }

    throw error;
  }
}

export async function deleteUserRecord(id: string) {
  const count = await db.user.count();

  if (count <= 1) {
    throw new LastUserError();
  }

  try {
    return await db.user.delete({
      where: { id },
      select: userPublicSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new UserNotFoundError();
    }

    throw error;
  }
}
