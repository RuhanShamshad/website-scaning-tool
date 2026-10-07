import AxeBuilder from "@axe-core/playwright";
import type { Analyzer } from "@/lib/scanner/types";

export const accessibilityAnalyzer: Analyzer = {
  name: "accessibility",
  async analyze(context) {
    const results = await new AxeBuilder({ page: context.page })
      .disableRules(["color-contrast"])
      .analyze();

    return results.violations.flatMap((violation) =>
      violation.nodes.slice(0, 5).map((node) => ({
        pageUrl: context.pageUrl,
        category: "Accessibility",
        type: violation.id,
        severity: mapImpact(violation.impact),
        title: violation.help,
        description: violation.description,
        recommendation: violation.helpUrl,
        viewport: context.viewport,
        selector: node.target.join(", "),
        confidence: 0.94,
        detectedBy: "axe",
        technicalDetails: {
          impact: violation.impact,
          tags: violation.tags,
          failureSummary: node.failureSummary
        }
      }))
    );
  }
};

function mapImpact(impact: string | null | undefined) {
  if (impact === "critical") return "Critical";
  if (impact === "serious") return "High";
  if (impact === "moderate") return "Medium";
  return "Low";
}
