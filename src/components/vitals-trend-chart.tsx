"use client";

import { useState, type MouseEvent } from "react";

import type { CruxHistoryPoint } from "@/lib/crux/history";
import {
  clsThresholds,
  formatCls,
  formatInp,
  formatLcp,
  inpThresholds,
  lcpThresholds,
} from "@/lib/vitals";

type MetricKey = "lcp" | "inp" | "cls";

type Thresholds = { good: number; needsImprovement: number };

const METRICS: {
  key: MetricKey;
  label: string;
  format: (value: number | null) => string;
  thresholds: Thresholds;
}[] = [
  { key: "lcp", label: "LCP", format: formatLcp, thresholds: lcpThresholds },
  { key: "inp", label: "INP", format: formatInp, thresholds: inpThresholds },
  { key: "cls", label: "CLS", format: formatCls, thresholds: clsThresholds },
];

const ZONES = [
  { rating: "good", color: "#0cce6b" },
  { rating: "needs-improvement", color: "#ffa400" },
  { rating: "poor", color: "#ff4e42" },
] as const;

const SERIES = [
  { key: "phone", label: "Phone", color: "#2563eb" },
  { key: "desktop", label: "Desktop", color: "#d946ef" },
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

function yScale(values: number[], thresholds: Thresholds) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.abs(max) * 0.2 || 1;
  let paddedMin = min >= 0 ? Math.max(0, min - span * 0.2) : min - span * 0.2;
  let paddedMax = max + span * 0.2;

  const above = [thresholds.good, thresholds.needsImprovement]
    .filter((boundary) => boundary >= max)
    .sort((a, b) => a - b)[0];
  const below = [thresholds.good, thresholds.needsImprovement]
    .filter((boundary) => boundary <= min)
    .sort((a, b) => b - a)[0];

  if (above !== undefined) {
    const headroom = Math.max((above - paddedMin) * 0.12, span * 0.15);
    paddedMax = Math.max(paddedMax, above + headroom);
  }

  if (below !== undefined) {
    const headroom = Math.max((paddedMax - below) * 0.12, span * 0.15);
    paddedMin = Math.min(paddedMin, below - headroom);
  }

  if (min >= 0) {
    paddedMin = Math.max(0, paddedMin);
  }

  return { min: paddedMin, max: paddedMax };
}

function zoneBands(scale: { min: number; max: number }, thresholds: Thresholds) {
  return [
    { color: ZONES[0].color, from: scale.min, to: thresholds.good },
    {
      color: ZONES[1].color,
      from: thresholds.good,
      to: thresholds.needsImprovement,
    },
    { color: ZONES[2].color, from: thresholds.needsImprovement, to: scale.max },
  ].flatMap((zone) => {
    const from = Math.max(zone.from, scale.min);
    const to = Math.min(zone.to, scale.max);

    if (to <= from) {
      return [];
    }

    return [{ color: zone.color, from, to }];
  });
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
  thresholds,
}: {
  label: string;
  dates: string[];
  phone: Array<number | null>;
  desktop: Array<number | null>;
  format: (value: number | null) => string;
  thresholds: Thresholds;
}) {
  const [hover, setHover] = useState<{
    index: number;
    x: number;
    y: number;
    width: number;
  } | null>(null);
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

  const scale = yScale(finite, thresholds);
  const zones = zoneBands(scale, thresholds);
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

  const active = hover?.index ?? null;
  const activeDate = active === null ? null : dates[active];

  function updateHover(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * WIDTH;
    const svgY = ((event.clientY - bounds.top) / bounds.height) * HEIGHT;
    const inside =
      svgX >= PAD.left &&
      svgX <= WIDTH - PAD.right &&
      svgY >= PAD.top &&
      svgY <= PAD.top + plotHeight;

    if (!inside) {
      setHover(null);
      return;
    }

    const rawIndex = dates.length === 1 ? 0 : Math.round((svgX - PAD.left) / step);
    const index = Math.max(0, Math.min(dates.length - 1, rawIndex));

    setHover({
      index,
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
      width: bounds.width,
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div
        className="relative cursor-crosshair"
        onMouseMove={updateHover}
        onMouseLeave={() => setHover(null)}
      >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-40 w-full"
        role="img"
        aria-label={`${label} for phone and desktop`}
      >
        {zones.map((zone) => {
          const y = yAt(zone.to);
          const height = yAt(zone.from) - y;

          return (
            <rect
              key={zone.color}
              x={PAD.left}
              y={y}
              width={plotWidth}
              height={height}
              fill={zone.color}
              opacity="0.18"
            />
          );
        })}
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
      {hover && activeDate ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
          style={{
            left: hover.x,
            top: hover.y,
            transform: `${
              hover.x > hover.width * 0.62
                ? "translate(calc(-100% - 12px)"
                : "translate(12px"
            }, ${hover.y > 72 ? "calc(-100% - 8px)" : "12px"})`,
          }}
        >
          <p className="font-medium">{formatAxisDate(activeDate)}</p>
          {SERIES.map((item) => {
            const value = series[item.key][hover.index];

            if (value === null || value === undefined) {
              return null;
            }

            return (
              <p key={item.key} className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.label} {format(value)}
              </p>
            );
          })}
        </div>
      ) : null}
      </div>
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
          thresholds={metric.thresholds}
        />
      ))}
    </div>
  );
}
