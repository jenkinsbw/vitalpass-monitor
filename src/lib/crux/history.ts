import { z } from "zod";

import { CruxError } from "@/lib/crux/errors";

export type CruxHistoryPoint = {
  lastDate: string;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
};

const cruxDateSchema = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number(),
});

const percentileSchema = z.union([z.number(), z.string()]);

const metricTimeseriesSchema = z.object({
  percentilesTimeseries: z
    .object({
      p75s: z.array(percentileSchema).optional(),
    })
    .optional(),
});

const historyResponseSchema = z.object({
  record: z.object({
    collectionPeriods: z
      .array(
        z.object({
          lastDate: cruxDateSchema,
        }),
      )
      .optional(),
    metrics: z
      .object({
        largest_contentful_paint: metricTimeseriesSchema.optional(),
        interaction_to_next_paint: metricTimeseriesSchema.optional(),
        cumulative_layout_shift: metricTimeseriesSchema.optional(),
      })
      .optional(),
  }),
});

function formatCruxDate(date: z.infer<typeof cruxDateSchema>): string | null {
  if (
    !Number.isInteger(date.year) ||
    !Number.isInteger(date.month) ||
    !Number.isInteger(date.day) ||
    date.month < 1 ||
    date.month > 12 ||
    date.day < 1 ||
    date.day > 31
  ) {
    return null;
  }

  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

function readPercentile(value: z.infer<typeof percentileSchema> | undefined): number | null {
  if (value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (value.trim() === "" || value === "NaN") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readSeries(
  metric: z.infer<typeof metricTimeseriesSchema> | undefined,
  index: number,
): number | null {
  return readPercentile(metric?.percentilesTimeseries?.p75s?.[index]);
}

export function parseCruxHistoryResponse(body: unknown): CruxHistoryPoint[] {
  const parsed = historyResponseSchema.safeParse(body);

  if (!parsed.success) {
    throw new CruxError("CrUX history returned an unexpected payload.");
  }

  const periods = parsed.data.record.collectionPeriods ?? [];
  const metrics = parsed.data.record.metrics;
  const points: CruxHistoryPoint[] = [];

  periods.forEach((period, index) => {
    const lastDate = formatCruxDate(period.lastDate);

    if (!lastDate) {
      return;
    }

    points.push({
      lastDate,
      lcp: readSeries(metrics?.largest_contentful_paint, index),
      inp: readSeries(metrics?.interaction_to_next_paint, index),
      cls: readSeries(metrics?.cumulative_layout_shift, index),
    });
  });

  return points;
}

export const HISTORY_WEEKS = 20;

export function latestHistoryPoints(
  points: CruxHistoryPoint[],
  count = HISTORY_WEEKS,
): CruxHistoryPoint[] {
  return [...points]
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate))
    .slice(-count);
}
