import { CruxScopeTabs } from "@/components/crux-scope-tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VitalsDistributionChart } from "@/components/vitals-distribution-chart";
import { VitalsTrendChart } from "@/components/vitals-trend-chart";
import { formatFormFactor, homeUrlFromOrigin } from "@/lib/crux";
import { formatCollectionPeriod } from "@/lib/vitals";
import {
  getCurrentMonthRecords,
  getWeeklyTrend,
  type CurrentMonthResult,
  type WeeklyTrendResult,
} from "@/server/crux";

function collectionPeriodFrom(result: CurrentMonthResult): string | null {
  if (result.status !== "ready") {
    return null;
  }

  return result.records[0]?.metrics.collectionPeriod ?? null;
}

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

function TrendGrid({ result }: { result: WeeklyTrendResult }) {
  if (result.status !== "ready") {
    return null;
  }

  if (result.records.length === 0 && result.errors.length === 0) {
    return null;
  }

  const phone = result.records.find((record) => record.formFactor === "PHONE");
  const desktop = result.records.find((record) => record.formFactor === "DESKTOP");
  const hasPoints =
    (phone?.points.length ?? 0) > 0 || (desktop?.points.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last 15 weeks</CardTitle>
        <CardDescription>
          Weekly p75 for phone and desktop on the same chart.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasPoints ? (
          <VitalsTrendChart
            phone={phone?.points ?? []}
            desktop={desktop?.points ?? []}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            CrUX has no weekly points for this period.
          </p>
        )}
        {result.errors.map((error) => (
          <p key={error.formFactor} className="text-sm text-muted-foreground">
            {formatFormFactor(error.formFactor)}: {error.message}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

export async function CurrentMonthCharts({ origin }: { origin: string }) {
  const homeUrl = homeUrlFromOrigin(origin);
  const [originResult, homeResult, originTrend, homeTrend] = await Promise.all([
    getCurrentMonthRecords({ kind: "origin", origin }),
    getCurrentMonthRecords({ kind: "url", url: homeUrl }),
    getWeeklyTrend({ kind: "origin", origin }),
    getWeeklyTrend({ kind: "url", url: homeUrl }),
  ]);

  const period =
    collectionPeriodFrom(originResult) ?? collectionPeriodFrom(homeResult);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg font-medium">
          <span>This month</span>
          {period ? (
            <span className="text-sm font-normal text-muted-foreground">
              {formatCollectionPeriod(period)}
            </span>
          ) : null}
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-user LCP, INP, and CLS for the current 28-day collection
          period, for the whole origin and the home page.
        </p>
      </div>

      <CruxScopeTabs
        origin={
          <div className="flex flex-col gap-6">
            <ChartsGrid
              result={originResult}
              emptyMessage="CrUX has no data for this origin."
            />
            <TrendGrid result={originTrend} />
          </div>
        }
        home={
          <div className="flex flex-col gap-6">
            <ChartsGrid
              result={homeResult}
              emptyMessage="CrUX has no page-level data for the home URL."
            />
            <TrendGrid result={homeTrend} />
          </div>
        }
      />
    </div>
  );
}

export function CurrentMonthChartsFallback() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-lg font-medium">
          <span>This month</span>
          <span className="h-4 w-40 animate-pulse rounded bg-muted" />
        </h2>
        <p className="text-sm text-muted-foreground">
          Real-user LCP, INP, and CLS for the current 28-day collection
          period, for the whole origin and the home page.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex w-fit gap-1 rounded-lg border p-1">
          <div className="h-8 w-16 rounded-md bg-muted" />
          <div className="h-8 w-14 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Phone", "Desktop"].map((label) => (
            <Card key={label}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
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
    </div>
  );
}
