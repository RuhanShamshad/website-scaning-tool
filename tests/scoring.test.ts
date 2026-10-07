import { describe, expect, it } from "vitest";
import { scoreIssues } from "@/lib/scanner/scoring";

describe("scoreIssues", () => {
  it("calculates transparent penalties from measurable issues", () => {
    const score = scoreIssues([
      { severity: "HIGH", category: "RESPONSIVE" },
      { severity: "MEDIUM", category: "ACCESSIBILITY" },
      { severity: "LOW", category: "CONSOLE" }
    ]);

    expect(score.categoryScores.Responsive).toBe(90);
    expect(score.categoryScores.Accessibility).toBe(95);
    expect(score.categoryScores.Technical).toBe(98);
    expect(score.overall).toBeLessThan(100);
  });
});
