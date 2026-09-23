export type VitalRating = "good" | "needs-improvement" | "poor";

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

export function formatCollectedAt(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
