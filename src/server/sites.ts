import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeOrigin, type createSiteSchema } from "@/lib/sites";
import type { z } from "zod";

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

export class DuplicateSiteError extends Error {
  constructor() {
    super("A site with this origin already exists.");
    this.name = "DuplicateSiteError";
  }
}

export function listSites() {
  return db.site.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export function getSite(id: string) {
  return db.site.findUnique({
    where: { id },
  });
}

export async function createSiteRecord(input: CreateSiteInput) {
  const origin = normalizeOrigin(input.origin);

  try {
    return await db.site.create({
      data: {
        name: input.name,
        origin,
        weeklyCheckEnabled: input.weeklyCheckEnabled,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DuplicateSiteError();
    }

    throw error;
  }
}
