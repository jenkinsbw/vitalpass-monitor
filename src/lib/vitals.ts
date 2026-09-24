export type VitalRating = "good" | "needs-improvement" | "poor";

export type VitalsDistribution = {
  good: number;
  needsImprovement: number;
  poor: number;
};

export function rateLcp(milliseconds: number): VitalRating {
  if (milliseconds <= 2500) return "good";
  if (milliseconds <= 4000) return "needs-improvement";
  return "poor";
}

export function rateInp(milliseconds: number): VitalRating {
  if (milliseconds <= 200) return "good";
  if (milliseconds <= 500) return "needs-improvement";
  return "poor";
}

export function rateCls(value: number): VitalRating {
  if (value <= 0.1) return "good";
  if (value <= 0.25) return "needs-improvement";
  return "poor";
}

export function formatLcp(milliseconds: number | null): string {
  if (milliseconds === null) return "—";
  return `${(milliseconds / 1000).toFixed(2)} s`;
}

export function formatInp(milliseconds: number | null): string {
  if (milliseconds === null) return "—";
  return `${Math.round(milliseconds)} ms`;
}

export function formatCls(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2);
}

export function formatCollectionPeriod(period: string): string {
  const [start, end] = period.split("/");
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);

  if (!startDate || !endDate) {
    return period;
  }

  const formatter = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatCollectedAt(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
