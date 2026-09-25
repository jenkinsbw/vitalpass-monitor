"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/auth-schemas";
import { db } from "@/lib/db";
import { createSiteSchema, OriginError } from "@/lib/sites";
import { createUserSchema, updateUserSchema } from "@/lib/users";
import type { SnapshotDetail, SnapshotSummary } from "@/lib/snapshots";
import {
  createSnapshotForSite,
  getSnapshotDetail,
  listRecentSnapshots,
} from "@/server/snapshots";
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
  error?: string;
  success?: string;
  detail?: string;
} | null;

export type SnapshotListResult = {
  snapshots: SnapshotSummary[];
  hasMore: boolean;
};

export type SnapshotDetailResult =
  | { snapshot: SnapshotDetail }
  | { error: string };

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

export async function collectSnapshot(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const siteId = formData.get("siteId");

  if (typeof siteId !== "string" || siteId.length === 0) {
    return { error: "Missing site." };
  }

  const site = await db.site.findUnique({ where: { id: siteId } });

  if (!site) {
    return { error: "Site not found." };
  }

  try {
    const result = await createSnapshotForSite(site);
    revalidatePath("/");
    revalidatePath(`/sites/${site.id}`);

    if (result.warnings.length > 0) {
      return {
        success: "Snapshot saved.",
        detail: result.warnings.join(" "),
      };
    }

    return { success: "Snapshot saved." };
  } catch (error) {
    if (error instanceof Error && error.message) {
      return { error: error.message };
    }

    console.error("Failed to collect CrUX snapshot", error);
    return { error: "Could not save a snapshot." };
  }
}

export async function listRecentSnapshotsAction(
  siteId: string,
): Promise<SnapshotListResult> {
  await requireUser();

  if (siteId.length === 0) {
    return { snapshots: [], hasMore: false };
  }

  return listRecentSnapshots(siteId);
}

export async function getSnapshotDetailAction(
  snapshotId: string,
  siteId: string,
): Promise<SnapshotDetailResult> {
  await requireUser();

  if (snapshotId.length === 0 || siteId.length === 0) {
    return { error: "Missing snapshot." };
  }

  const snapshot = await getSnapshotDetail(snapshotId, siteId);

  if (!snapshot) {
    return { error: "Snapshot not found." };
  }

  return { snapshot };
}

export async function deleteSnapshot(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  const id = formData.get("id");
  const siteId = formData.get("siteId");

  if (typeof id !== "string" || id.length === 0) {
    return { error: "Missing snapshot." };
  }

  if (typeof siteId !== "string" || siteId.length === 0) {
    return { error: "Missing site." };
  }

  const snapshot = await db.snapshot.findFirst({
    where: { id, siteId },
    select: { id: true, siteId: true },
  });

  if (!snapshot) {
    return { error: "Snapshot not found." };
  }

  await db.snapshot.delete({ where: { id: snapshot.id } });

  revalidatePath("/");
  revalidatePath(`/sites/${snapshot.siteId}`);
  return { success: "Snapshot deleted." };
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
