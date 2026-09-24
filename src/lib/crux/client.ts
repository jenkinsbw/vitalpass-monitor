import { CruxError } from "@/lib/crux/errors";
import { parseCruxResponse, type NormalizedCruxMetrics } from "@/lib/crux/parse";

const CRUX_ENDPOINT =
  "https://chromeuxreport.googleapis.com/v1/records:queryRecord";

const METRICS = [
  "largest_contentful_paint",
  "interaction_to_next_paint",
  "cumulative_layout_shift",
] as const;

export const CRUX_FORM_FACTORS = ["PHONE", "DESKTOP"] as const;

export type CruxFormFactor = (typeof CRUX_FORM_FACTORS)[number];

type QueryRecordInput = {
  formFactor: CruxFormFactor;
  apiKey: string;
} & ({ origin: string; url?: never } | { url: string; origin?: never });

type QueryOriginRecordInput = {
  origin: string;
  formFactor: CruxFormFactor;
  apiKey: string;
};

type QueryUrlRecordInput = {
  url: string;
  formFactor: CruxFormFactor;
  apiKey: string;
};

export function formatFormFactor(formFactor: CruxFormFactor): string {
  return formFactor === "PHONE" ? "Phone" : "Desktop";
}

export function homeUrlFromOrigin(origin: string): string {
  return new URL("/", origin).href;
}

function messageForStatus(status: number, fallback: string): string {
  if (status === 400) {
    return "CrUX rejected the origin, URL, or form factor.";
  }

  if (status === 403) {
    return "CrUX rejected the API key.";
  }

  if (status === 404) {
    return "CrUX has no data for this target and form factor.";
  }

  if (status === 429) {
    return "CrUX rate limit reached. Try again later.";
  }

  return fallback;
}

function readGoogleError(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return null;
  }

  const error = body.error;

  if (typeof error !== "object" || error === null || !("message" in error)) {
    return null;
  }

  return typeof error.message === "string" && error.message.trim() !== ""
    ? error.message
    : null;
}

async function queryRecord(input: QueryRecordInput): Promise<NormalizedCruxMetrics> {
  const url = new URL(CRUX_ENDPOINT);
  url.searchParams.set("key", input.apiKey);

  const bodyPayload =
    input.origin !== undefined
      ? {
          origin: input.origin,
          formFactor: input.formFactor,
          metrics: METRICS,
        }
      : {
          url: input.url,
          formFactor: input.formFactor,
          metrics: METRICS,
        };

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CruxError("Could not reach the CrUX API.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const fallback =
      readGoogleError(body) ?? `CrUX request failed (${response.status}).`;
    throw new CruxError(messageForStatus(response.status, fallback), response.status);
  }

  return parseCruxResponse(body);
}

export function queryOriginRecord(
  input: QueryOriginRecordInput,
): Promise<NormalizedCruxMetrics> {
  return queryRecord({
    origin: input.origin,
    formFactor: input.formFactor,
    apiKey: input.apiKey,
  });
}

export function queryUrlRecord(
  input: QueryUrlRecordInput,
): Promise<NormalizedCruxMetrics> {
  return queryRecord({
    url: input.url,
    formFactor: input.formFactor,
    apiKey: input.apiKey,
  });
}
