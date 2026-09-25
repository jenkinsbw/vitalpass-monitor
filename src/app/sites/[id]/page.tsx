import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { DeleteSiteButton } from "@/components/delete-site-button";
import {
  CurrentMonthCharts,
  CurrentMonthChartsFallback,
} from "@/components/current-month-charts";
import { SiteAlerts } from "@/components/site-alerts";
import { SnapshotList } from "@/components/snapshot-list";
import { SnapshotRefreshProvider } from "@/components/snapshot-refresh";
import { WeeklyCheckToggle } from "@/components/weekly-check-toggle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="flex w-full flex-col gap-3">
          <BackLink href="/">Back to Sites</BackLink>
          <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
          <div className="flex w-full items-center justify-between gap-4">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              {site.origin}
            </p>
            <DeleteSiteButton siteId={site.id} />
          </div>
        </div>

        <Card className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-4">
            <CardTitle>Weekly check</CardTitle>
            <WeeklyCheckToggle
              siteId={site.id}
              enabled={site.weeklyCheckEnabled}
            />
          </CardHeader>
          <SiteAlerts siteId={site.id} />
        </Card>

        <section>
          <Suspense fallback={<CurrentMonthChartsFallback siteId={site.id} />}>
            <CurrentMonthCharts origin={site.origin} siteId={site.id} />
          </Suspense>
        </section>

        <SnapshotList siteId={site.id} />
      </div>
    </SnapshotRefreshProvider>
  );
}
