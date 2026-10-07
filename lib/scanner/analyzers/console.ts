import type { Analyzer } from "@/lib/scanner/types";

export const consoleAnalyzer: Analyzer = {
  name: "console",
  async analyze(context) {
    return context.consoleEntries
      .filter((entry) => ["error", "pageerror"].includes(entry.type))
      .slice(0, 20)
      .map((entry) => ({
        pageUrl: context.pageUrl,
        category: "Console",
        type: "console_error",
        severity: "Medium",
        title: "Browser console error",
        description: "The page emitted a JavaScript or browser error while loading.",
        recommendation: "Review the console message and fix first-party script errors before investigating third-party noise.",
        viewport: context.viewport,
        confidence: 0.82,
        detectedBy: "rule",
        technicalDetails: entry
      }));
  }
};
