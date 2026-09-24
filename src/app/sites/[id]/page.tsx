import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BackLink } from "@/components/back-link";
import { CollectForm } from "@/components/collect-form";
import {
  CurrentMonthCharts,
  CurrentMonthChartsFallback,
  parseCruxScope,
} from "@/components/current-month-charts";
import { SnapshotCard } from "@/components/snapshot-card";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { getSite } from "@/server/sites";

export const dynamic = "force-dynamic";

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    scope?: string | string[];
  }>;
}) {
  const { id } = await params;
  const { scope: scopeParam } = await searchParams;
  const scope = parseCruxScope(scopeParam);
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  return (
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
          <CurrentMonthCharts
            origin={site.origin}
            siteId={site.id}
            scope={scope}
          />
        </Suspense>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-medium">Snapshots</h2>
          <p className="text-sm text-muted-foreground">
            Saved origin records from Save Snapshot. Expand a snapshot to see
            the same LCP, INP, and CLS distribution as above.
          </p>
        </div>
        {site.snapshots.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No snapshots yet</CardTitle>
              <CardDescription>
                Use Save Snapshot to store the current origin record for phone
                and desktop.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {site.snapshots.map((snapshot) => (
              <li key={snapshot.id}>
                <SnapshotCard snapshot={snapshot} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
