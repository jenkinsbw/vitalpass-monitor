import { ChevronDownIcon } from "lucide-react";

import { ClsValue, InpValue, LcpValue } from "@/components/metric-value";
import { formatCollectedAt, leavesGoodRange } from "@/lib/vitals";
import { listSiteAlerts } from "@/server/alerts";

export async function SiteAlerts({ siteId }: { siteId: string }) {
  const alerts = await listSiteAlerts(siteId);
  const latest = alerts[0];

  if (!latest) {
    return (
      <p className="border-t px-(--card-spacing) py-3 text-sm text-muted-foreground">
        No records yet.
      </p>
    );
  }

  const outside = leavesGoodRange({
    lcp: latest.lcp,
    inp: latest.inp,
    cls: latest.cls,
  });

  return (
    <details className="group border-t">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-(--card-spacing) py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className={outside ? "text-red-600" : "text-green-600"}>
          {outside
            ? "The latest record is outside the good range."
            : "The latest record is within the good range."}
        </span>
        <ChevronDownIcon className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <ul className="flex flex-col gap-4 border-t px-(--card-spacing) py-3">
        {alerts.map((alert) => (
          <li key={alert.id} className="flex flex-col gap-3">
            <p className="text-sm font-medium">{formatCollectedAt(alert.createdAt)}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <LcpValue milliseconds={alert.lcp} />
              <InpValue milliseconds={alert.inp} />
              <ClsValue value={alert.cls} />
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}
