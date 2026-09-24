import { CruxError } from "@/lib/crux/errors";
import type { VitalsDistribution } from "@/lib/vitals";

export type NormalizedCruxMetrics = {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
  lcpDistribution: VitalsDistribution | null;
  inpDistribution: VitalsDistribution | null;
  clsDistribution: VitalsDistribution | null;
  collectionPeriod: string;
  raw: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readP75(metric: unknown): number | null {
  if (!isRecord(metric) || !isRecord(metric.percentiles)) {
    return null;
  }

  const value = metric.percentiles.p75;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readDensity(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "" && value !== "NaN") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return null;
}

function readDistribution(metric: unknown): VitalsDistribution | null {
  if (!isRecord(metric) || !Array.isArray(metric.histogram)) {
    return null;
  }

  const densities = metric.histogram.slice(0, 3).map((bin) => {
    if (!isRecord(bin)) {
      return null;
    }

    return readDensity(bin.density);
  });

  const [good, needsImprovement, poor] = densities;

  if (
    densities.length < 3 ||
    good === null ||
    good === undefined ||
    needsImprovement === null ||
    needsImprovement === undefined ||
    poor === null ||
    poor === undefined
  ) {
    return null;
  }

  return { good, needsImprovement, poor };
}

function formatDate(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const { year, month, day } = value;

  if (
    typeof year !== "number" ||
    typeof month !== "number" ||
    typeof day !== "number"
  ) {
    return null;
  }

  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");
  return `${year}-${monthText}-${dayText}`;
}

function formatCollectionPeriod(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const firstDate = formatDate(value.firstDate);
  const lastDate = formatDate(value.lastDate);

  if (!firstDate || !lastDate) {
    return null;
  }

  return `${firstDate}/${lastDate}`;
}

export function parseCruxResponse(body: unknown): NormalizedCruxMetrics {
  if (!isRecord(body) || !isRecord(body.record)) {
    throw new CruxError("CrUX returned an unexpected payload.");
  }

  const collectionPeriod = formatCollectionPeriod(body.record.collectionPeriod);

  if (!collectionPeriod) {
    throw new CruxError("CrUX response is missing a collection period.");
  }

  const metrics = isRecord(body.record.metrics) ? body.record.metrics : {};

  return {
    lcp: readP75(metrics.largest_contentful_paint),
    inp: readP75(metrics.interaction_to_next_paint),
    cls: readP75(metrics.cumulative_layout_shift),
    lcpDistribution: readDistribution(metrics.largest_contentful_paint),
    inpDistribution: readDistribution(metrics.interaction_to_next_paint),
    clsDistribution: readDistribution(metrics.cumulative_layout_shift),
    collectionPeriod,
    raw: body,
  };
}
