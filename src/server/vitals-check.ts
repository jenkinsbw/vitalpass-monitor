import "server-only";

import { CruxError, queryOriginAggregate } from "@/lib/crux";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { leavesGoodRange } from "@/lib/vitals";

export type WeeklyVitalsCheckResult = {
  checked: number;
  alerts: number;
  failures: { origin: string; message: string }[];
};

export async function runWeeklyVitalsCheck(): Promise<WeeklyVitalsCheckResult> {
  if (!env.CRUX_API_KEY) {
    console.error("Weekly vitals check skipped: CRUX_API_KEY is not set.");
    return { checked: 0, alerts: 0, failures: [] };
  }

  const apiKey = env.CRUX_API_KEY;
  const sites = await db.site.findMany({
    where: { weeklyCheckEnabled: true },
    orderBy: { createdAt: "asc" },
  });

  let alerts = 0;
  const failures: WeeklyVitalsCheckResult["failures"] = [];

  for (const site of sites) {
    try {
      const metrics = await queryOriginAggregate({
        origin: site.origin,
        apiKey,
      });
      const values = {
        lcp: metrics.lcp,
        inp: metrics.inp,
        cls: metrics.cls,
      };

      if (!leavesGoodRange(values)) {
        continue;
      }

      await db.alert.create({
        data: {
          siteId: site.id,
          lcp: values.lcp,
          inp: values.inp,
          cls: values.cls,
        },
      });
      alerts += 1;
    } catch (error) {
      const message =
        error instanceof CruxError
          ? error.message
          : "Could not reach the CrUX API.";
      failures.push({ origin: site.origin, message });
      console.error(`Weekly vitals check failed for ${site.origin}`, error);
    }
  }

  console.info(
    `Weekly vitals check finished: ${sites.length} sites, ${alerts} alerts, ${failures.length} failures.`,
  );

  return { checked: sites.length, alerts, failures };
}
