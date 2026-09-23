import Link from "next/link";

import { ClsValue, InpValue, LcpValue } from "@/components/metric-value";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFormFactor } from "@/lib/sites";
import { formatCollectedAt } from "@/lib/vitals";
import { listSites } from "@/server/sites";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sites = await listSites();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground">
            Origins monitored with the Chrome UX Report.
          </p>
        </div>
        <Link href="/sites/new" className={buttonVariants()}>
          Add site
        </Link>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
            <CardDescription>
              Add an origin to store CrUX snapshots after VitalPass is applied.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {sites.map((site) => {
            const latest = site.snapshots[0];

            return (
              <li key={site.id}>
                <Link href={`/sites/${site.id}`} className="block">
                  <Card className="transition-colors hover:bg-muted/40">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {site.name}
                        <Badge variant="outline">
                          {formatFormFactor(site.formFactor)}
                        </Badge>
                        {site.active ? null : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{site.origin}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-6">
                      {latest ? (
                        <>
                          <LcpValue milliseconds={latest.lcp} />
                          <InpValue milliseconds={latest.inp} />
                          <ClsValue value={latest.cls} />
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              Collected
                            </span>
                            <span className="text-sm font-medium">
                              {formatCollectedAt(latest.collectedAt)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No snapshots yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
