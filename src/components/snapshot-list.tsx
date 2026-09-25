"use client";

import { useEffect, useState } from "react";

import { SnapshotCard } from "@/components/snapshot-card";
import { useSnapshotRefresh } from "@/components/snapshot-refresh";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SnapshotPage } from "@/lib/snapshots";
import { listSnapshotPageAction } from "@/server/actions";

export function SnapshotList({ siteId }: { siteId: string }) {
  const { version } = useSnapshotRefresh();
  const [seenVersion, setSeenVersion] = useState(version);
  const [request, setRequest] = useState({ page: 1, token: 0 });
  const [result, setResult] = useState<SnapshotPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (version !== seenVersion) {
    setSeenVersion(version);
    if (version > 0) {
      setRequest({ page: 1, token: request.token + 1 });
      setResult(null);
      setError(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void listSnapshotPageAction(siteId, request.page).then(
      (page) => {
        if (cancelled) {
          return;
        }

        if (page.snapshots.length === 0 && page.page > 1) {
          setRequest({ page: page.page - 1, token: request.token + 1 });
          return;
        }

        setResult(page);
      },
      () => {
        if (!cancelled) {
          setError("Could not load snapshots.");
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [siteId, request]);

  const loading = result === null && error === null;
  const showPager = result !== null && result.pageCount > 1;

  return (
    <section className="flex flex-col gap-3 border-t pt-6">
      <h2 className="text-lg font-medium">Snapshots</h2>

      {loading ? (
        <p className="text-sm text-muted-foreground" role="status">
          Loading snapshots…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {result && result.snapshots.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No snapshots yet</CardTitle>
            <CardDescription>
              Use Save Snapshot to store origin and home for phone and desktop.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {result && result.snapshots.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {result.snapshots.map((snapshot) => (
            <li key={snapshot.id}>
              <SnapshotCard
                siteId={siteId}
                snapshotId={snapshot.id}
                collectedAt={snapshot.collectedAt}
                onDeleted={() => {
                  setResult(null);
                  setError(null);
                  setRequest((current) => ({
                    page: current.page,
                    token: current.token + 1,
                  }));
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {showPager && result ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() => {
              setResult(null);
              setError(null);
              setRequest((current) => ({
                page: current.page - 1,
                token: current.token + 1,
              }));
            }}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {result.pageCount}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={result.page >= result.pageCount}
            onClick={() => {
              setResult(null);
              setError(null);
              setRequest((current) => ({
                page: current.page + 1,
                token: current.token + 1,
              }));
            }}
          >
            Next
          </Button>
        </div>
      ) : null}
    </section>
  );
}
