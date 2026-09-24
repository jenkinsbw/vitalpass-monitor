import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VitalsDistributionChart } from "@/components/vitals-distribution-chart";
import { formatFormFactor, homeUrlFromOrigin } from "@/lib/crux";
import { formatCollectionPeriod } from "@/lib/vitals";
import {
  getCurrentMonthRecords,
  type CurrentMonthResult,
} from "@/server/crux";

function ChartsGrid({
  result,
  emptyMessage,
}: {
  result: CurrentMonthResult;
  emptyMessage: string;
}) {
  if (result.status === "missing-key") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>CrUX API key required</CardTitle>
          <CardDescription>
            Set CRUX_API_KEY in .env and restart the server to load this
            month&apos;s field data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (result.records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No field data</CardTitle>
          <CardDescription>
            {result.errors[0]?.message ?? emptyMessage}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.records.map((record) => (
        <Card key={record.formFactor}>
          <CardHeader>
            <CardTitle>{formatFormFactor(record.formFactor)}</CardTitle>
            <CardDescription>
              {formatCollectionPeriod(record.metrics.collectionPeriod)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VitalsDistributionChart
              lcp={{
                p75: record.metrics.lcp,
                distribution: record.metrics.lcpDistribution,
              }}
              inp={{
                p75: record.metrics.inp,
                distribution: record.metrics.inpDistribution,
              }}
              cls={{
                p75: record.metrics.cls,
                distribution: record.metrics.clsDistribution,
              }}
            />
          </CardContent>
        </Card>
      ))}
      {result.errors.map((error) => (
        <Card key={error.formFactor}>
          <CardHeader>
            <CardTitle>{formatFormFactor(error.formFactor)}</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export async function CurrentMonthCharts({ origin }: { origin: string }) {
  const homeUrl = homeUrlFromOrigin(origin);
  const [originResult, homeResult] = await Promise.all([
    getCurrentMonthRecords({ kind: "origin", origin }),
    getCurrentMonthRecords({ kind: "url", url: homeUrl }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-medium">Origin</h3>
          <p className="text-sm text-muted-foreground">{origin}</p>
        </div>
        <ChartsGrid
          result={originResult}
          emptyMessage="CrUX has no data for this origin."
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-medium">Home</h3>
          <p className="text-sm text-muted-foreground">{homeUrl}</p>
        </div>
        <ChartsGrid
          result={homeResult}
          emptyMessage="CrUX has no page-level data for the home URL."
        />
      </div>
    </div>
  );
}

export function CurrentMonthChartsFallback() {
  return (
    <div className="flex flex-col gap-8">
      {["Origin", "Home"].map((scope) => (
        <div key={scope} className="flex flex-col gap-3">
          <div>
            <h3 className="text-base font-medium">{scope}</h3>
            <p className="text-sm text-muted-foreground">
              Loading the current 28-day period…
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {["Phone", "Desktop"].map((label) => (
              <Card key={label}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                  <CardDescription>
                    Loading the current 28-day period…
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {["LCP", "INP", "CLS"].map((metric) => (
                    <div key={metric} className="flex flex-col gap-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
