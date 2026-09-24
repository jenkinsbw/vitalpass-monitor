import { ChevronDown } from "lucide-react";

import { DeleteSnapshotButton } from "@/components/delete-snapshot-button";
import { ClsValue, InpValue, LcpValue } from "@/components/metric-value";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VitalsDistributionChart } from "@/components/vitals-distribution-chart";
import { formatFormFactor, tryParseCruxResponse } from "@/lib/crux";
import {
  formatCollectedAt,
  formatCollectionPeriod,
} from "@/lib/vitals";
import type { FormFactor } from "@/generated/prisma/client";

type SnapshotCardProps = {
  snapshot: {
    id: string;
    siteId: string;
    formFactor: FormFactor;
    collectedAt: Date;
    collectionPeriod: string;
    lcp: number | null;
    inp: number | null;
    cls: number | null;
    raw: unknown;
  };
};

export function SnapshotCard({ snapshot }: SnapshotCardProps) {
  const formFactorLabel = formatFormFactor(snapshot.formFactor);
  const collectedLabel = formatCollectedAt(snapshot.collectedAt);
  const metrics = tryParseCruxResponse(snapshot.raw);
  const periodLabel = metrics
    ? formatCollectionPeriod(metrics.collectionPeriod)
    : snapshot.collectionPeriod;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {collectedLabel}
            <Badge variant="outline">{formFactorLabel}</Badge>
          </CardTitle>
          <CardDescription>Collection period {periodLabel}</CardDescription>
        </div>
        <DeleteSnapshotButton
          snapshotId={snapshot.id}
          siteId={snapshot.siteId}
          label={`${formFactorLabel} · ${collectedLabel}`}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-6">
          <LcpValue milliseconds={snapshot.lcp} />
          <InpValue milliseconds={snapshot.inp} />
          <ClsValue value={snapshot.cls} />
        </div>

        <details className="group rounded-lg border">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <span>Distribution</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t px-3 py-3">
            {metrics ? (
              <VitalsDistributionChart
                lcp={{
                  p75: metrics.lcp,
                  distribution: metrics.lcpDistribution,
                }}
                inp={{
                  p75: metrics.inp,
                  distribution: metrics.inpDistribution,
                }}
                cls={{
                  p75: metrics.cls,
                  distribution: metrics.clsDistribution,
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Stored payload could not be parsed.
              </p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
