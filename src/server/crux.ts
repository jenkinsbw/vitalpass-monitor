import "server-only";

import {
  CRUX_FORM_FACTORS,
  CruxError,
  latestHistoryPoints,
  queryOriginHistory,
  queryOriginRecord,
  queryUrlHistory,
  queryUrlRecord,
  type CruxFormFactor,
  type CruxHistoryPoint,
  type NormalizedCruxMetrics,
} from "@/lib/crux";
import { env } from "@/lib/env";

export type CurrentMonthRecord = {
  formFactor: CruxFormFactor;
  metrics: NormalizedCruxMetrics;
};

export type CurrentMonthError = {
  formFactor: CruxFormFactor;
  message: string;
};

export type CurrentMonthResult =
  | { status: "missing-key" }
  | {
      status: "ready";
      records: CurrentMonthRecord[];
      errors: CurrentMonthError[];
    };

export type WeeklyTrendRecord = {
  formFactor: CruxFormFactor;
  points: CruxHistoryPoint[];
};

export type WeeklyTrendResult =
  | { status: "missing-key" }
  | {
      status: "ready";
      records: WeeklyTrendRecord[];
      errors: CurrentMonthError[];
    };

type CurrentMonthTarget =
  | { kind: "origin"; origin: string }
  | { kind: "url"; url: string };

export async function getCurrentMonthRecords(
  target: CurrentMonthTarget,
): Promise<CurrentMonthResult> {
  if (!env.CRUX_API_KEY) {
    return { status: "missing-key" };
  }

  const apiKey = env.CRUX_API_KEY;

  const settled = await Promise.all(
    CRUX_FORM_FACTORS.map(async (formFactor) => {
      try {
        const metrics =
          target.kind === "origin"
            ? await queryOriginRecord({
                origin: target.origin,
                formFactor,
                apiKey,
              })
            : await queryUrlRecord({
                url: target.url,
                formFactor,
                apiKey,
              });
        return { ok: true as const, formFactor, metrics };
      } catch (error) {
        const message =
          error instanceof CruxError
            ? error.message
            : "Could not reach the CrUX API.";
        return { ok: false as const, formFactor, message };
      }
    }),
  );

  return {
    status: "ready",
    records: settled.flatMap((result) =>
      result.ok
        ? [{ formFactor: result.formFactor, metrics: result.metrics }]
        : [],
    ),
    errors: settled.flatMap((result) =>
      result.ok
        ? []
        : [{ formFactor: result.formFactor, message: result.message }],
    ),
  };
}

export async function getWeeklyTrend(
  target: CurrentMonthTarget,
): Promise<WeeklyTrendResult> {
  if (!env.CRUX_API_KEY) {
    return { status: "missing-key" };
  }

  const apiKey = env.CRUX_API_KEY;

  const settled = await Promise.all(
    CRUX_FORM_FACTORS.map(async (formFactor) => {
      try {
        const history =
          target.kind === "origin"
            ? await queryOriginHistory({
                origin: target.origin,
                formFactor,
                apiKey,
              })
            : await queryUrlHistory({
                url: target.url,
                formFactor,
                apiKey,
              });
        return {
          ok: true as const,
          formFactor,
          points: latestHistoryPoints(history),
        };
      } catch (error) {
        const message =
          error instanceof CruxError
            ? error.message
            : "Could not reach the CrUX API.";
        return { ok: false as const, formFactor, message };
      }
    }),
  );

  return {
    status: "ready",
    records: settled.flatMap((result) =>
      result.ok ? [{ formFactor: result.formFactor, points: result.points }] : [],
    ),
    errors: settled.flatMap((result) =>
      result.ok
        ? []
        : [{ formFactor: result.formFactor, message: result.message }],
    ),
  };
}
