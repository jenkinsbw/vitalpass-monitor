"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { SnapshotCard } from "@/components/snapshot-card";
import { useSnapshotRefresh } from "@/components/snapshot-refresh";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RECENT_SNAPSHOT_LIMIT,
  type SnapshotSummary,
} from "@/lib/snapshots";
import { listRecentSnapshotsAction } from "@/server/actions";

export function SnapshotList({
  siteId,
  snapshotCount,
}: {
  siteId: string;
  snapshotCount: number;
}) {
  const { version } = useSnapshotRefresh();
  const [seenVersion, setSeenVersion] = useState(version);
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<SnapshotSummary[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (version !== seenVersion) {
    setSeenVersion(version);
    if (version > 0) {
      setOpen(true);
      setSnapshots(null);
      setError(null);
    }
  }

  const loading = open && snapshots === null && error === null;

  useEffect(() => {
    if (!loading) {
      return;
    }

    let cancelled = false;

    void listRecentSnapshotsAction(siteId).then(
      (result) => {
        if (cancelled) {
          return;
        }

        setSnapshots(result.snapshots);
        setHasMore(result.hasMore);
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
  }, [loading, siteId]);

  function toggle() {
    setOpen((current) => {
      if (!current) {
        setError(null);
      }
      return !current;
    });
  }

  const countLabel =
    snapshots === null
      ? snapshotCount === 1
        ? "1 saved"
        : `${snapshotCount} saved`
      : snapshots.length === 1
        ? "1 recent"
        : `${snapshots.length} recent`;

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={toggle}
        className="flex cursor-pointer items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="block text-lg font-medium">Snapshots</span>
          <span className="block text-sm text-muted-foreground">
            {open
              ? "Latest saves of origin and home, for phone and desktop."
              : `${countLabel}. Open to list the latest snapshots.`}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3">
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
          {snapshots && snapshots.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No snapshots yet</CardTitle>
                <CardDescription>
                  Use Save Snapshot to store origin and home for phone and
                  desktop.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}
          {snapshots && snapshots.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {snapshots.map((snapshot) => (
                <li key={snapshot.id}>
                  <SnapshotCard
                    siteId={siteId}
                    snapshotId={snapshot.id}
                    collectedAt={snapshot.collectedAt}
                    onDeleted={() => {
                      setSnapshots((current) =>
                        current
                          ? current.filter((item) => item.id !== snapshot.id)
                          : current,
                      );
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : null}
          {hasMore ? (
            <p className="text-sm text-muted-foreground">
              Showing the latest {RECENT_SNAPSHOT_LIMIT} snapshots.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
