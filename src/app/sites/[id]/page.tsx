import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import {
  CurrentMonthCharts,
  CurrentMonthChartsFallback,
} from "@/components/current-month-charts";
import { SiteAlerts } from "@/components/site-alerts";
import { SnapshotList } from "@/components/snapshot-list";
import { SnapshotRefreshProvider } from "@/components/snapshot-refresh";
import { WeeklyCheckToggle } from "@/components/weekly-check-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <div className="flex flex-col items-start gap-3">
          <BackLink href="/">Back to Sites</BackLink>
          <h1 className="text-2xl font-semibold tracking-tight">{site.name}</h1>
          <p className="text-sm text-muted-foreground">{site.origin}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly origin check</CardTitle>
            <CardDescription>
              Once a week, VitalPass reads origin LCP, INP, and CLS. If any
              value leaves the good range, it saves an alert.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyCheckToggle
              siteId={site.id}
              enabled={site.weeklyCheckEnabled}
            />
          </CardContent>
        </Card>

        <SiteAlerts siteId={site.id} />

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
