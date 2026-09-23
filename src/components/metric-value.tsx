import { Badge } from "@/components/ui/badge";
import {
  formatCls,
  formatInp,
  formatLcp,
  rateCls,
  rateInp,
  rateLcp,
  type VitalRating,
} from "@/lib/vitals";

function ratingVariant(rating: VitalRating) {
  if (rating === "good") return "secondary" as const;
  if (rating === "poor") return "destructive" as const;
  return "outline" as const;
}

function ratingLabel(rating: VitalRating) {
  if (rating === "good") return "Good";
  if (rating === "poor") return "Poor";
  return "Needs improvement";
}

export function MetricValue({
  label,
  value,
  rating,
}: {
  label: string;
  value: string;
  rating: VitalRating | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium">
        {value}
        {rating ? (
          <Badge variant={ratingVariant(rating)}>{ratingLabel(rating)}</Badge>
        ) : null}
      </span>
    </div>
  );
}

export function LcpValue({ milliseconds }: { milliseconds: number | null }) {
  return (
    <MetricValue
      label="LCP"
      value={formatLcp(milliseconds)}
      rating={milliseconds === null ? null : rateLcp(milliseconds)}
    />
  );
}

export function InpValue({ milliseconds }: { milliseconds: number | null }) {
  return (
    <MetricValue
      label="INP"
      value={formatInp(milliseconds)}
      rating={milliseconds === null ? null : rateInp(milliseconds)}
    />
  );
}

export function ClsValue({ value }: { value: number | null }) {
  return (
    <MetricValue
      label="CLS"
      value={formatCls(value)}
      rating={value === null ? null : rateCls(value)}
    />
  );
}
