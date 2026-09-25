import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  CRUX_FORM_FACTORS,
  CruxError,
  formatCruxScope,
  formatFormFactor,
  homeUrlFromOrigin,
  queryOriginRecord,
  queryUrlRecord,
} from "@/lib/crux";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  CRUX_SCOPES,
  SNAPSHOT_PAGE_SIZE,
  type SnapshotDetail,
  type SnapshotPage,
} from "@/lib/snapshots";

export async function listSnapshotPage(
  siteId: string,
  page: number,
): Promise<SnapshotPage> {
  const total = await db.snapshot.count({ where: { siteId } });
  const pageCount = Math.max(1, Math.ceil(total / SNAPSHOT_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, Math.floor(page)), pageCount);

  const rows = await db.snapshot.findMany({
    where: { siteId },
    orderBy: { collectedAt: "desc" },
    skip: (safePage - 1) * SNAPSHOT_PAGE_SIZE,
    take: SNAPSHOT_PAGE_SIZE,
    select: { id: true, collectedAt: true },
  });

  return {
    snapshots: rows.map((row) => ({
      id: row.id,
      collectedAt: row.collectedAt.toISOString(),
    })),
    page: safePage,
    pageCount,
  };
}

export async function getSnapshotDetail(
  id: string,
  siteId: string,
): Promise<SnapshotDetail | null> {
  const snapshot = await db.snapshot.findFirst({
    where: { id, siteId },
    select: {
      id: true,
      siteId: true,
      collectedAt: true,
      records: {
        select: {
          scope: true,
          formFactor: true,
          url: true,
          lcp: true,
          inp: true,
          cls: true,
          collectionPeriod: true,
          error: true,
          raw: true,
        },
      },
    },
  });

  if (!snapshot) {
    return null;
  }

  return {
    id: snapshot.id,
    siteId: snapshot.siteId,
    collectedAt: snapshot.collectedAt.toISOString(),
    records: snapshot.records.map((record) => ({
      scope: record.scope,
      formFactor: record.formFactor,
      url: record.url,
      lcp: record.lcp,
      inp: record.inp,
      cls: record.cls,
      collectionPeriod: record.collectionPeriod,
      error: record.error,
      raw: record.raw,
    })),
  };
}

export async function createSnapshotForSite(site: { id: string; origin: string }) {
  if (!env.CRUX_API_KEY) {
    throw new Error("Set CRUX_API_KEY in .env and restart the server.");
  }

  const apiKey = env.CRUX_API_KEY;
  const homeUrl = homeUrlFromOrigin(site.origin);
  const collectedAt = new Date();

  const settled = await Promise.all(
    CRUX_SCOPES.flatMap((scope) =>
      CRUX_FORM_FACTORS.map(async (formFactor) => {
        try {
          const metrics =
            scope === "ORIGIN"
              ? await queryOriginRecord({
                  origin: site.origin,
                  formFactor,
                  apiKey,
                })
              : await queryUrlRecord({
                  url: homeUrl,
                  formFactor,
                  apiKey,
                });

          return {
            scope,
            formFactor,
            url: scope === "HOME" ? homeUrl : null,
            metrics,
            error: null as string | null,
          };
        } catch (error) {
          if (error instanceof CruxError) {
            return {
              scope,
              formFactor,
              url: scope === "HOME" ? homeUrl : null,
              metrics: null,
              error: error.message,
            };
          }

          console.error("Failed to collect CrUX snapshot", error);
          return {
            scope,
            formFactor,
            url: scope === "HOME" ? homeUrl : null,
            metrics: null,
            error: "Could not reach the CrUX API.",
          };
        }
      }),
    ),
  );

  const warnings = settled
    .filter((result) => result.error)
    .map(
      (result) =>
        `${formatCruxScope(result.scope)} ${formatFormFactor(result.formFactor)}: ${result.error}`,
    );

  const saved = settled.filter((result) => result.metrics !== null);

  if (saved.length === 0) {
    throw new Error(warnings[0] ?? "Could not save a snapshot.");
  }

  let snapshot: { id: string };

  try {
    snapshot = await db.snapshot.create({
      data: {
        siteId: site.id,
        collectedAt,
        records: {
          create: settled.map((result) => ({
            scope: result.scope,
            formFactor: result.formFactor,
            url: result.url,
            lcp: result.metrics?.lcp ?? null,
            inp: result.metrics?.inp ?? null,
            cls: result.metrics?.cls ?? null,
            collectionPeriod: result.metrics?.collectionPeriod ?? null,
            error: result.error,
            raw: result.metrics
              ? (result.metrics.raw as Prisma.InputJsonValue)
              : Prisma.DbNull,
          })),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to store CrUX snapshot", error);
    throw new Error("Could not save a snapshot.");
  }

  return { id: snapshot.id, warnings };
}
