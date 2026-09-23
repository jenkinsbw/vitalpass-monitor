import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectForm } from "@/components/collect-form";
import { ClsValue, InpValue, LcpValue } from "@/components/metric-value";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";
import { formatFormFactor } from "@/lib/sites";
import { formatCollectedAt } from "@/lib/vitals";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to sites
          </Link>
          <h1 className="mt-2 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
            {site.name}
            <Badge variant="outline">{formatFormFactor(site.formFactor)}</Badge>
          </h1>
          <p className="text-sm text-muted-foreground">{site.origin}</p>
        </div>
        {env.CRUX_API_KEY ? (
          <CollectForm siteId={site.id} />
        ) : (
          <p className="max-w-xs text-sm text-muted-foreground">
            Set CRUX_API_KEY in .env and restart the server to fetch snapshots.
          </p>
        )}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Snapshots</h2>
        {site.snapshots.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No snapshots yet</CardTitle>
              <CardDescription>
                Fetch the current CrUX record for this origin.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {site.snapshots.map((snapshot) => (
              <li key={snapshot.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{formatCollectedAt(snapshot.collectedAt)}</CardTitle>
                    <CardDescription>
                      Collection period {snapshot.collectionPeriod}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-6">
                    <LcpValue milliseconds={snapshot.lcp} />
                    <InpValue milliseconds={snapshot.inp} />
                    <ClsValue value={snapshot.cls} />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
