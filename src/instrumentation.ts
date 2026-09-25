export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  await import("@/lib/env");

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const { startWeeklyVitalsCron } = await import("@/server/weekly-cron");
  startWeeklyVitalsCron();
}
