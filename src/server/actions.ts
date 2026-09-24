"use server";

import { Prisma } from "@/generated/prisma/client";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/auth-schemas";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { CruxError, queryOriginRecord } from "@/lib/crux";
import { createSiteSchema, OriginError } from "@/lib/sites";
import { createSiteRecord, DuplicateSiteError } from "@/server/sites";

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
    formFactor: formData.get("formFactor"),
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

  if (!env.CRUX_API_KEY) {
    return { error: "Set CRUX_API_KEY in .env and restart the server." };
  }

  try {
    const metrics = await queryOriginRecord({
      origin: site.origin,
      formFactor: site.formFactor,
      apiKey: env.CRUX_API_KEY,
    });

    await db.cruxSnapshot.create({
      data: {
        siteId: site.id,
        lcp: metrics.lcp,
        inp: metrics.inp,
        cls: metrics.cls,
        collectionPeriod: metrics.collectionPeriod,
        raw: metrics.raw as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (error instanceof CruxError) {
      return { error: error.message };
    }

    console.error("Failed to collect CrUX snapshot", error);
    return { error: "Could not collect a snapshot." };
  }

  revalidatePath("/");
  revalidatePath(`/sites/${site.id}`);
  return null;
}
