import { describe, expect, it } from "vitest";
import { shouldDisplayIssue } from "@/lib/validation/issues";

describe("issue confidence", () => {
  it("keeps normal issues above the confidence threshold", () => {
    expect(
      shouldDisplayIssue({
        pageUrl: "https://example.com",
        category: "Responsive",
        type: "horizontal_overflow",
        severity: "High",
        title: "Overflow",
        description: "Overflow",
        recommendation: "Fix overflow",
        confidence: 0.9,
        detectedBy: "rule"
      })
    ).toBe(true);
  });

  it("does not display low-confidence errors as normal issues", () => {
    expect(
      shouldDisplayIssue({
        pageUrl: "https://example.com",
        category: "Design",
        type: "spacing",
        severity: "Medium",
        title: "Spacing",
        description: "Spacing",
        recommendation: "Review spacing",
        confidence: 0.4,
        detectedBy: "ai"
      })
    ).toBe(false);
  });
});
