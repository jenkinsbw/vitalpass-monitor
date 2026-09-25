import { z } from "zod";

export class OriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OriginError";
  }
}

export const createSiteSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  origin: z.string().trim().min(1, "Origin is required."),
  weeklyCheckEnabled: z.boolean(),
});

export function normalizeOrigin(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  let url: URL;

  try {
    url = new URL(withProtocol);
  } catch {
    throw new OriginError("Enter a valid origin, like https://example.com.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new OriginError("Origin must use http or https.");
  }

  if (url.hostname.length === 0) {
    throw new OriginError("Enter a valid origin, like https://example.com.");
  }

  return url.origin;
}
