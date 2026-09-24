"use server";

import { Prisma } from "@/generated/prisma/client";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/auth-schemas";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  CRUX_FORM_FACTORS,
  CruxError,
  formatFormFactor,
  queryOriginRecord,
} from "@/lib/crux";
import { createSiteSchema, OriginError } from "@/lib/sites";
import { createUserSchema, updateUserSchema } from "@/lib/users";
import { createSiteRecord, DuplicateSiteError } from "@/server/sites";
import {
  createUserRecord,
  deleteUserRecord,
  DuplicateEmailError,
  LastUserError,
  updateUserRecord,
  UserNotFoundError,
} from "@/server/users";

export type ActionState = {
  error: string;
} | null;

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

export async function login(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return null;
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function createSite(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = createSiteSchema.safeParse({
    name: formData.get("name"),
    origin: formData.get("origin"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  let siteId: string;

  try {
    const site = await createSiteRecord(parsed.data);
    siteId = site.id;
  } catch (error) {
    if (error instanceof DuplicateSiteError || error instanceof OriginError) {
      return { error: error.message };
    }

    console.error("Failed to create site", error);
    return { error: "Could not create the site." };
  }

  revalidatePath("/");
  redirect(`/sites/${siteId}`);
}

export async function collectSnapshot(formData: FormData): Promise<void> {
  await requireUser();

  const siteId = formData.get("siteId");

  if (typeof siteId !== "string" || siteId.length === 0) {
    throw new Error("Missing site.");
  }

  const site = await db.site.findUnique({ where: { id: siteId } });

  if (!site) {
    throw new Error("Site not found.");
  }

  if (!env.CRUX_API_KEY) {
    throw new Error("Set CRUX_API_KEY in .env and restart the server.");
  }

  const collectedAt = new Date();
  const errors: string[] = [];
  let created = 0;

  for (const formFactor of CRUX_FORM_FACTORS) {
    try {
      const metrics = await queryOriginRecord({
        origin: site.origin,
        formFactor,
        apiKey: env.CRUX_API_KEY,
      });

      await db.cruxSnapshot.create({
        data: {
          siteId: site.id,
          formFactor,
          collectedAt,
          lcp: metrics.lcp,
          inp: metrics.inp,
          cls: metrics.cls,
          collectionPeriod: metrics.collectionPeriod,
          raw: metrics.raw as Prisma.InputJsonValue,
        },
      });
      created += 1;
    } catch (error) {
      if (error instanceof CruxError) {
        errors.push(`${formatFormFactor(formFactor)}: ${error.message}`);
        continue;
      }

      console.error("Failed to collect CrUX snapshot", error);
      throw new Error("Could not save a snapshot.");
    }
  }

  if (created === 0) {
    throw new Error(errors[0] ?? "Could not save a snapshot.");
  }

  revalidatePath("/");
  revalidatePath(`/sites/${site.id}`);
}

export async function deleteSnapshot(formData: FormData): Promise<void> {
  await requireUser();

  const id = formData.get("id");
  const siteId = formData.get("siteId");

  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Missing snapshot.");
  }

  if (typeof siteId !== "string" || siteId.length === 0) {
    throw new Error("Missing site.");
  }

  const snapshot = await db.cruxSnapshot.findFirst({
    where: { id, siteId },
    select: { id: true, siteId: true },
  });

  if (!snapshot) {
    throw new Error("Snapshot not found.");
  }

  await db.cruxSnapshot.delete({ where: { id: snapshot.id } });

  revalidatePath("/");
  revalidatePath(`/sites/${snapshot.siteId}`);
}

export async function createUser(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    lastName: formData.get("lastName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  try {
    await createUserRecord(parsed.data);
  } catch (error) {
    if (error instanceof DuplicateEmailError) {
      return { error: error.message };
    }

    console.error("Failed to create user", error);
    return { error: "Could not create the user." };
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const password = formData.get("password");

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    email: formData.get("email"),
    name: formData.get("name"),
    lastName: formData.get("lastName"),
    password:
      typeof password === "string" && password.length > 0
        ? password
        : undefined,
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  try {
    await updateUserRecord(parsed.data);
  } catch (error) {
    if (
      error instanceof DuplicateEmailError ||
      error instanceof UserNotFoundError
    ) {
      return { error: error.message };
    }

    console.error("Failed to update user", error);
    return { error: "Could not update the user." };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${parsed.data.id}`);
  redirect("/users");
}

export async function deleteUser(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const sessionUser = await requireUser();

  const id = formData.get("id");

  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing user." };
  }

  if (sessionUser.id === id) {
    return { error: "You cannot delete your own account." };
  }

  try {
    await deleteUserRecord(id);
  } catch (error) {
    if (
      error instanceof LastUserError ||
      error instanceof UserNotFoundError
    ) {
      return { error: error.message };
    }

    console.error("Failed to delete user", error);
    return { error: "Could not delete the user." };
  }

  revalidatePath("/users");
  return null;
}
