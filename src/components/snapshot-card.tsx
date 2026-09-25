"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CruxScopeTabs } from "@/components/crux-scope-tabs";
import { DeleteSnapshotButton } from "@/components/delete-snapshot-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VitalsDistributionChart } from "@/components/vitals-distribution-chart";
import {
  CRUX_FORM_FACTORS,
  formatFormFactor,
  tryParseCruxResponse,
  type CruxFormFactor,
} from "@/lib/crux";
import { formatCollectedAt, formatCollectionPeriod } from "@/lib/vitals";
import type { SnapshotDetail, SnapshotRecordView } from "@/lib/snapshots";
import { getSnapshotDetailAction } from "@/server/actions";

function RecordCharts({
  records,
  emptyMessage,
}: {
  records: SnapshotRecordView[];
  emptyMessage: string;
}) {
  const byFactor = new Map(records.map((record) => [record.formFactor, record]));

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No field data</CardTitle>
          <CardDescription>{emptyMessage}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CRUX_FORM_FACTORS.map((formFactor) => {
        const record = byFactor.get(formFactor);
        return (
          <RecordCard key={formFactor} formFactor={formFactor} record={record} />
        );
      })}
    </div>
  );
}

function RecordCard({
  formFactor,
  record,
}: {
  formFactor: CruxFormFactor;
  record: SnapshotRecordView | undefined;
}) {
  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{formatFormFactor(formFactor)}</CardTitle>
          <CardDescription>Not included in this snapshot.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = record.raw ? tryParseCruxResponse(record.raw) : null;
  const period = metrics?.collectionPeriod ?? record.collectionPeriod;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatFormFactor(formFactor)}</CardTitle>
        {period ? (
          <CardDescription>{formatCollectionPeriod(period)}</CardDescription>
        ) : null}
        {record.error ? (
          <CardDescription>{record.error}</CardDescription>
        ) : null}
      </CardHeader>
      {metrics ? (
        <CardContent>
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
        </CardContent>
      ) : null}
    </Card>
  );
}

export function SnapshotCard({
  siteId,
  snapshotId,
  collectedAt,
  onDeleted,
}: {
  siteId: string;
  snapshotId: string;
  collectedAt: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SnapshotDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const collectedLabel = formatCollectedAt(new Date(collectedAt));

  async function toggle() {
    const next = !open;
    setOpen(next);

    if (!next || detail || loading) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getSnapshotDetailAction(snapshotId, siteId);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setDetail(result.snapshot);
    setLoading(false);
  }

  const originRecords =
    detail?.records.filter((record) => record.scope === "ORIGIN") ?? [];
  const homeRecords =
    detail?.records.filter((record) => record.scope === "HOME") ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            void toggle();
          }}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 text-left"
        >
          <CardTitle>{collectedLabel}</CardTitle>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <DeleteSnapshotButton
          snapshotId={snapshotId}
          siteId={siteId}
          label={collectedLabel}
          onDeleted={onDeleted}
        />
      </CardHeader>
      {open ? (
        <CardContent className="flex flex-col gap-4">
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">
              Loading snapshot…
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {detail ? (
            <CruxScopeTabs
              origin={
                <RecordCharts
                  records={originRecords}
                  emptyMessage="This snapshot has no origin data."
                />
              }
              home={
                <RecordCharts
                  records={homeRecords}
                  emptyMessage="This snapshot has no home page data."
                />
              }
            />
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
