import "server-only";

import {
  CRUX_FORM_FACTORS,
  CruxError,
  queryOriginRecord,
  queryUrlRecord,
  type CruxFormFactor,
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
