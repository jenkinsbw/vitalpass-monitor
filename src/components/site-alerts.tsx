import { ClsValue, InpValue, LcpValue } from "@/components/metric-value";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCollectedAt } from "@/lib/vitals";
import { listSiteAlerts } from "@/server/alerts";

export async function SiteAlerts({ siteId }: { siteId: string }) {
  const alerts = await listSiteAlerts(siteId);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Alerts</h2>
        <p className="text-sm text-muted-foreground">
          Saved when the weekly origin check finds LCP, INP, or CLS outside
          the good range.
        </p>
      </div>
      {alerts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No alerts</CardTitle>
            <CardDescription>
              A passing week does not create a record.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>{formatCollectedAt(alert.createdAt)}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <LcpValue milliseconds={alert.lcp} />
                  <InpValue milliseconds={alert.inp} />
                  <ClsValue value={alert.cls} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
