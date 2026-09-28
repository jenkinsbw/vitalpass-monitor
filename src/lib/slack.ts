import "server-only";

import { env } from "@/lib/env";
import {
  formatCls,
  formatInp,
  formatLcp,
  rateCls,
  rateInp,
  rateLcp,
  type VitalRating,
} from "@/lib/vitals";

export type SlackAlertPayload = {
  siteName: string;
  origin: string;
  lcp: number | null;
  inp: number | null;
  cls: number | null;
};

function ratingLabel(rating: VitalRating | null): string {
  if (rating === null) return "n/a";
  if (rating === "good") return "good";
  if (rating === "needs-improvement") return "needs improvement";
  return "poor";
}

function metricLine(
  name: string,
  formatted: string,
  rating: VitalRating | null,
): string {
  const flag = rating !== null && rating !== "good" ? " ⚠" : "";
  return `• *${name}:* ${formatted} (${ratingLabel(rating)})${flag}`;
}

export function buildAlertSlackText(payload: SlackAlertPayload): string {
  const lcpRating = payload.lcp === null ? null : rateLcp(payload.lcp);
  const inpRating = payload.inp === null ? null : rateInp(payload.inp);
  const clsRating = payload.cls === null ? null : rateCls(payload.cls);

  return [
    `*VitalPass alert:* ${payload.siteName}`,
    `\`${payload.origin}\` left the good Core Web Vitals range.`,
    metricLine("LCP", formatLcp(payload.lcp), lcpRating),
    metricLine("INP", formatInp(payload.inp), inpRating),
    metricLine("CLS", formatCls(payload.cls), clsRating),
  ].join("\n");
}

/**
 * Posts an alert to Slack via Incoming Webhook.
 * No-ops when SLACK_WEBHOOK_URL is unset. Failures are logged and never thrown.
 */
export async function notifySlackAlert(
  payload: SlackAlertPayload,
): Promise<void> {
  const webhookUrl = env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: buildAlertSlackText(payload) }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        `Slack webhook failed (${response.status}): ${body || response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Slack webhook request failed", error);
  }
}
