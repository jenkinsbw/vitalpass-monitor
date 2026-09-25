import "server-only";

import { nextWeeklyRun } from "@/lib/weekly-schedule";
import { runWeeklyVitalsCheck } from "@/server/vitals-check";

const globalForCron = globalThis as unknown as {
  weeklyVitalsCronStarted?: boolean;
};

function scheduleNextRun() {
  const next = nextWeeklyRun();
  const delay = next.getTime() - Date.now();

  setTimeout(() => {
    void runWeeklyVitalsCheck().finally(scheduleNextRun);
  }, delay);
}

export function startWeeklyVitalsCron() {
  if (globalForCron.weeklyVitalsCronStarted) {
    return;
  }

  globalForCron.weeklyVitalsCronStarted = true;
  const next = nextWeeklyRun();
  console.info(`Weekly vitals check scheduled for ${next.toISOString()}.`);
  scheduleNextRun();
}
