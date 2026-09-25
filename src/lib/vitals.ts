export type VitalRating = "good" | "needs-improvement" | "poor";

export type VitalsDistribution = {
  good: number;
  needsImprovement: number;
  poor: number;
};

export const lcpThresholds = { good: 2500, needsImprovement: 4000 } as const;
export const inpThresholds = { good: 200, needsImprovement: 500 } as const;
export const clsThresholds = { good: 0.1, needsImprovement: 0.25 } as const;

export function rateLcp(milliseconds: number): VitalRating {
  if (milliseconds <= lcpThresholds.good) return "good";
  if (milliseconds <= lcpThresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

export function rateInp(milliseconds: number): VitalRating {
  if (milliseconds <= inpThresholds.good) return "good";
  if (milliseconds <= inpThresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

export function rateCls(value: number): VitalRating {
  if (value <= clsThresholds.good) return "good";
  if (value <= clsThresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

export function leavesGoodRange(metrics: {
  lcp: number | null;
  inp: number | null;
  cls: number | null;
}): boolean {
  if (metrics.lcp !== null && rateLcp(metrics.lcp) !== "good") return true;
  if (metrics.inp !== null && rateInp(metrics.inp) !== "good") return true;
  if (metrics.cls !== null && rateCls(metrics.cls) !== "good") return true;
  return false;
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
