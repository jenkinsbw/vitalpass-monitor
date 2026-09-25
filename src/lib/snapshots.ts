import type { CruxFormFactor } from "@/lib/crux";

export const RECENT_SNAPSHOT_LIMIT = 10;

export const CRUX_SCOPES = ["ORIGIN", "HOME"] as const;

export type CruxScopeName = (typeof CRUX_SCOPES)[number];

export type SnapshotSummary = {
  id: string;
  collectedAt: string;
};

export type SnapshotRecordView = {
  scope: CruxScopeName;
  formFactor: CruxFormFactor;
  url: string | null;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  collectionPeriod: string | null;
  error: string | null;
  raw: unknown;
};

export type SnapshotDetail = {
  id: string;
  siteId: string;
  collectedAt: string;
  records: SnapshotRecordView[];
};
