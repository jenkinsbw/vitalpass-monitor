const MONDAY = 1;
const HOUR_UTC = 12;

export function nextWeeklyRun(from = new Date()): Date {
  const next = new Date(from);
  const day = next.getUTCDay();
  let daysAhead = (MONDAY - day + 7) % 7;

  next.setUTCHours(HOUR_UTC, 0, 0, 0);

  if (daysAhead === 0 && next.getTime() <= from.getTime()) {
    daysAhead = 7;
  }

  if (daysAhead > 0) {
    next.setUTCDate(next.getUTCDate() + daysAhead);
    next.setUTCHours(HOUR_UTC, 0, 0, 0);
  }

  return next;
}
