import dns from "node:dns/promises";
import net from "node:net";

const blockedHostnames = new Set(["localhost", "metadata.google.internal"]);
const ignoredQueryParams = [/^utm_/i, /^fbclid$/i, /^gclid$/i, /^mc_/i];
const binaryExtensions = /\.(zip|rar|7z|pdf|docx?|xlsx?|pptx?|png|jpe?g|gif|webp|svg|mp4|mov|avi|mp3|wav|woff2?|ttf|eot)$/i;

export type SafeUrl = {
  original: string;
  normalized: string;
  hostname: string;
  domain: string;
};

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlValidationError";
  }
}

export function normalizeSubmittedUrl(input: string): SafeUrl {
  const trimmed = input.trim();
  const withProtocol = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new UrlValidationError("Enter a valid public website URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new UrlValidationError("Only HTTP and HTTPS websites can be scanned.");
  }

  parsed.hash = "";
  parsed.username = "";
  parsed.password = "";
  parsed.hostname = parsed.hostname.toLowerCase();
  parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/");
  if (parsed.pathname !== "/") {
    parsed.pathname = parsed.pathname.replace(/\/$/, "");
  }

  for (const key of [...parsed.searchParams.keys()]) {
    if (ignoredQueryParams.some((pattern) => pattern.test(key))) {
      parsed.searchParams.delete(key);
    }
  }
  parsed.searchParams.sort();

  const hostname = parsed.hostname;
  if (blockedHostnames.has(hostname) || hostname.endsWith(".localhost")) {
    throw new UrlValidationError("Local and internal websites cannot be scanned.");
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new UrlValidationError("Private network addresses cannot be scanned.");
  }

  return {
    original: input,
    normalized: parsed.toString(),
    hostname,
    domain: hostname.replace(/^www\./, "")
  };
}

export function normalizeDiscoveredUrl(rawUrl: string, baseUrl: string): string | null {
  if (rawUrl.startsWith("mailto:") || rawUrl.startsWith("tel:") || rawUrl.startsWith("javascript:")) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl, baseUrl);
  } catch {
    return null;
  }

  if (!["http:", "https:"].includes(parsed.protocol) || binaryExtensions.test(parsed.pathname)) {
    return null;
  }

  if (isIgnoredPath(parsed.pathname)) {
    return null;
  }

  return normalizeSubmittedUrl(parsed.toString()).normalized;
}

export function belongsToSameSite(candidate: string, root: SafeUrl): boolean {
  const url = new URL(candidate);
  const domain = url.hostname.replace(/^www\./, "");
  return domain === root.domain;
}

export async function assertPubliclyRoutable(url: string): Promise<void> {
  const parsed = new URL(url);
  const records = await dns.lookup(parsed.hostname, { all: true, verbatim: true });

  if (records.length === 0) {
    throw new UrlValidationError("The hostname could not be resolved.");
  }

  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new UrlValidationError("The website resolves to a private or internal network address.");
    }
  }
}

export function isPrivateIp(address: string): boolean {
  if (address === "::1") return true;
  if (address.toLowerCase().startsWith("fe80:")) return true;
  if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) return true;

  if (!net.isIP(address) || net.isIP(address) !== 4) return false;

  const parts = address.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    address === "0.0.0.0"
  );
}

function isIgnoredPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  return [
    "/logout",
    "/wp-admin",
    "/admin",
    "/cart/add",
    "/checkout",
    "/account/login",
    "/login"
  ].some((blocked) => lower.includes(blocked));
}
