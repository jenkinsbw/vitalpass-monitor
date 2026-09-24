import { Badge } from "@/components/ui/badge";
import {
  formatCls,
  formatInp,
  formatLcp,
  rateCls,
  rateInp,
  rateLcp,
  type VitalRating,
  type VitalsDistribution,
} from "@/lib/vitals";

export type VitalsMetricInput = {
  p75: number | null;
  distribution: VitalsDistribution | null;
};

const SEGMENTS = [
  { key: "good", label: "Good", className: "bg-[#0cce6b]" },
  {
    key: "needsImprovement",
    label: "Needs improvement",
    className: "bg-[#ffa400]",
  },
  { key: "poor", label: "Poor", className: "bg-[#ff4e42]" },
] as const;

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

function formatShare(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function DistributionBar({
  label,
  distribution,
}: {
  label: string;
  distribution: VitalsDistribution;
}) {
  const total =
    distribution.good + distribution.needsImprovement + distribution.poor;
  const summary = SEGMENTS.map((segment) => {
    return `${formatShare(distribution[segment.key])} ${segment.label.toLowerCase()}`;
  }).join(", ");

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${label} distribution: ${summary}`}
      >
        {SEGMENTS.map((segment) => {
          const share = total > 0 ? distribution[segment.key] / total : 0;

          if (share <= 0) {
            return null;
          }

          return (
            <div
              key={segment.key}
              className={segment.className}
              style={{ width: `${(share * 100).toFixed(2)}%` }}
            />
          );
        })}
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {SEGMENTS.map((segment) => (
          <span key={segment.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={`size-2 rounded-full ${segment.className}`}
            />
            {formatShare(distribution[segment.key])} {segment.label}
          </span>
        ))}
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  rating,
  distribution,
}: {
  label: string;
  value: string;
  rating: VitalRating | null;
  distribution: VitalsDistribution | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="flex items-center gap-2 text-sm font-medium">
          {value}
          {rating ? (
            <Badge variant={ratingVariant(rating)}>{ratingLabel(rating)}</Badge>
          ) : null}
        </span>
      </div>
      {distribution ? (
        <DistributionBar label={label} distribution={distribution} />
      ) : (
        <p className="text-xs text-muted-foreground">No distribution.</p>
      )}
    </div>
  );
}

export function VitalsDistributionChart({
  lcp,
  inp,
  cls,
}: {
  lcp: VitalsMetricInput;
  inp: VitalsMetricInput;
  cls: VitalsMetricInput;
}) {
  return (
    <div className="flex flex-col gap-5">
      <MetricRow
        label="LCP"
        value={formatLcp(lcp.p75)}
        rating={lcp.p75 === null ? null : rateLcp(lcp.p75)}
        distribution={lcp.distribution}
      />
      <MetricRow
        label="INP"
        value={formatInp(inp.p75)}
        rating={inp.p75 === null ? null : rateInp(inp.p75)}
        distribution={inp.distribution}
      />
      <MetricRow
        label="CLS"
        value={formatCls(cls.p75)}
        rating={cls.p75 === null ? null : rateCls(cls.p75)}
        distribution={cls.distribution}
      />
    </div>
  );
}
