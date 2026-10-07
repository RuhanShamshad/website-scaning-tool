import { describe, expect, it } from "vitest";
import { isPrivateIp, normalizeDiscoveredUrl, normalizeSubmittedUrl } from "@/lib/security/url";

describe("URL security and normalization", () => {
  it("normalizes submitted URLs and strips tracking parameters", () => {
    const result = normalizeSubmittedUrl("example.com/?utm_source=x&b=2&a=1#hero");
    expect(result.normalized).toBe("https://example.com/?a=1&b=2");
    expect(result.domain).toBe("example.com");
  });

  it("rejects localhost and private IP input", () => {
    expect(() => normalizeSubmittedUrl("http://localhost:3000")).toThrow();
    expect(() => normalizeSubmittedUrl("http://192.168.1.10")).toThrow();
  });

  it("detects private IP ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
  });

  it("ignores unsafe discovered links", () => {
    expect(normalizeDiscoveredUrl("mailto:test@example.com", "https://example.com")).toBeNull();
    expect(normalizeDiscoveredUrl("/wp-admin/settings", "https://example.com")).toBeNull();
    expect(normalizeDiscoveredUrl("/about?utm_campaign=x", "https://example.com")).toBe("https://example.com/about");
  });
});
