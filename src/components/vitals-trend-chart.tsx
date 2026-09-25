"use client";

import { useState } from "react";

import type { CruxHistoryPoint } from "@/lib/crux/history";
import { formatCls, formatInp, formatLcp } from "@/lib/vitals";

type MetricKey = "lcp" | "inp" | "cls";

const METRICS: {
  key: MetricKey;
  label: string;
  format: (value: number | null) => string;
}[] = [
  { key: "lcp", label: "LCP", format: formatLcp },
  { key: "inp", label: "INP", format: formatInp },
  { key: "cls", label: "CLS", format: formatCls },
];

const SERIES = [
  { key: "phone", label: "Phone", color: "#2563eb" },
  { key: "desktop", label: "Desktop", color: "#d97706" },
] as const;

const WIDTH = 640;
const HEIGHT = 160;
const PAD = { top: 16, right: 12, bottom: 28, left: 52 };

function formatAxisDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (!match) {
    return isoDate;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))),
  );
}

function yScale(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.2 || 1;
  const paddedMin = min - span * 0.2;

  return {
    min: min >= 0 ? Math.max(0, paddedMin) : paddedMin,
    max: max + span * 0.2,
  };
}

function labelIndexes(count: number): Set<number> {
  if (count <= 1) {
    return new Set([0]);
  }

  const ticks = Math.min(5, count);
  const indexes = new Set<number>();

  for (let tick = 0; tick < ticks; tick += 1) {
    indexes.add(Math.round((tick * (count - 1)) / (ticks - 1)));
  }

  return indexes;
}

function lineSegments(
  values: Array<number | null>,
  xAt: (index: number) => number,
  yAt: (value: number) => number,
): string[] {
  const segments: string[] = [];
  let current: string[] = [];

  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) {
        segments.push(current.join(" "));
        current = [];
      }
      return;
    }

    current.push(`${xAt(index)},${yAt(value)}`);
  });

  if (current.length > 0) {
    segments.push(current.join(" "));
  }

  return segments;
}

function MetricLine({
  label,
  dates,
  phone,
  desktop,
  format,
}: {
  label: string;
  dates: string[];
  phone: Array<number | null>;
  desktop: Array<number | null>;
  format: (value: number | null) => string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const finite = [...phone, ...desktop].flatMap((value) =>
    value === null ? [] : [value],
  );

  if (finite.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        <p className="text-xs text-muted-foreground">No weekly values.</p>
      </div>
    );
  }

  const scale = yScale(finite);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const step = dates.length === 1 ? 0 : plotWidth / (dates.length - 1);
  const ticks = labelIndexes(dates.length);
  const series = { phone, desktop };

  function xAt(index: number) {
    if (dates.length === 1) {
      return PAD.left + plotWidth / 2;
    }

    return PAD.left + step * index;
  }

  function yAt(value: number) {
    const ratio = (value - scale.min) / (scale.max - scale.min);
    return PAD.top + plotHeight - ratio * plotHeight;
  }

  const activeDate = active === null ? null : dates[active];
  const activeSummary =
    activeDate === null
      ? null
      : SERIES.map((item) => {
          const value = series[item.key][active ?? -1];
          return value === null || value === undefined
            ? null
            : `${item.label} ${format(value)}`;
        })
          .filter((item): item is string => item !== null)
          .join(" · ");

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {activeDate && activeSummary
            ? `${formatAxisDate(activeDate)} · ${activeSummary}`
            : "Phone and desktop"}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-40 w-full"
        role="img"
        aria-label={`${label} for phone and desktop`}
        onMouseLeave={() => setActive(null)}
      >
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + plotHeight}
          y2={PAD.top + plotHeight}
          className="stroke-border"
        />
        <text
          x={PAD.left - 8}
          y={PAD.top + 4}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {format(scale.max)}
        </text>
        <text
          x={PAD.left - 8}
          y={PAD.top + plotHeight}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {format(scale.min)}
        </text>
        {SERIES.map((item) =>
          lineSegments(series[item.key], xAt, yAt).map((points) => (
            <polyline
              key={`${item.key}-${points}`}
              points={points}
              fill="none"
              stroke={item.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )),
        )}
        {dates.map((date, index) => (
          <g key={date}>
            <rect
              x={xAt(index) - step / 2}
              y={PAD.top}
              width={dates.length === 1 ? plotWidth : step}
              height={plotHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setActive(index)}
            />
            {ticks.has(index) ? (
              <text
                x={xAt(index)}
                y={HEIGHT - 6}
                textAnchor={
                  index === 0 ? "start" : index === dates.length - 1 ? "end" : "middle"
                }
                className="fill-muted-foreground text-[11px]"
              >
                {formatAxisDate(date)}
              </text>
            ) : null}
            {active === index
              ? SERIES.map((item) => {
                  const value = series[item.key][index];

                  if (value === null || value === undefined) {
                    return null;
                  }

                  return (
                    <circle
                      key={item.key}
                      cx={xAt(index)}
                      cy={yAt(value)}
                      r="4"
                      fill={item.color}
                      className="stroke-background"
                      strokeWidth="2"
                    />
                  );
                })
              : null}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function VitalsTrendChart({
  phone,
  desktop,
}: {
  phone: CruxHistoryPoint[];
  desktop: CruxHistoryPoint[];
}) {
  const dates = [...new Set([...phone, ...desktop].map((point) => point.lastDate))].sort();
  const phoneByDate = new Map(phone.map((point) => [point.lastDate, point]));
  const desktopByDate = new Map(desktop.map((point) => [point.lastDate, point]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 text-xs text-muted-foreground">
        {SERIES.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
      {METRICS.map((metric) => (
        <MetricLine
          key={metric.key}
          label={metric.label}
          dates={dates}
          phone={dates.map((date) => phoneByDate.get(date)?.[metric.key] ?? null)}
          desktop={dates.map((date) => desktopByDate.get(date)?.[metric.key] ?? null)}
          format={metric.format}
        />
      ))}
    </div>
  );
}
