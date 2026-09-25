import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { CollectForm } from "@/components/collect-form";
import {
  CurrentMonthCharts,
  CurrentMonthChartsFallback,
} from "@/components/current-month-charts";
import { SnapshotList } from "@/components/snapshot-list";
import { SnapshotRefreshProvider } from "@/components/snapshot-refresh";
import { env } from "@/lib/env";
import { getSite } from "@/server/sites";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  return (
    <SnapshotRefreshProvider>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-start gap-3">
            <BackLink href="/">Back to Sites</BackLink>
            <h1 className="text-2xl font-semibold tracking-tight">
              {site.name}
            </h1>
            <p className="text-sm text-muted-foreground">{site.origin}</p>
          </div>
          {env.CRUX_API_KEY ? (
            <CollectForm siteId={site.id} />
          ) : (
            <p className="max-w-xs text-sm text-muted-foreground">
              Set CRUX_API_KEY in .env and restart the server to save snapshots.
            </p>
          )}
        </div>

        <section>
          <Suspense fallback={<CurrentMonthChartsFallback />}>
            <CurrentMonthCharts origin={site.origin} />
          </Suspense>
        </section>

        <SnapshotList
          siteId={site.id}
          snapshotCount={site._count.snapshots}
        />
      </div>
    </SnapshotRefreshProvider>
  );
}
