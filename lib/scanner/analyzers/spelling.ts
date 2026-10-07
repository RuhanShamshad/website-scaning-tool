import type { Analyzer } from "@/lib/scanner/types";

const commonMistakes = new Map([
  ["profesional", "professional"],
  ["recieve", "receive"],
  ["seperate", "separate"],
  ["adress", "address"],
  ["buisness", "business"],
  ["occured", "occurred"],
  ["untill", "until"],
  ["enviroment", "environment"]
]);

export const spellingAnalyzer: Analyzer = {
  name: "spelling",
  async analyze(context) {
    const text = await context.page.evaluate(() => document.body.innerText);
    const clean = text.replace(/https?:\/\/\S+|\S+@\S+|\b[A-Z0-9]{4,}\b/g, " ");
    type AnalyzerIssue = Awaited<ReturnType<Analyzer["analyze"]>>[number];

const issues: AnalyzerIssue[] = [];

    for (const [mistake, suggestion] of commonMistakes) {
      const match = clean.match(new RegExp(`\\b${mistake}\\b`, "i"));
      if (match) {
        issues.push({
          pageUrl: context.pageUrl,
          category: "Spelling",
          type: "likely_spelling_mistake",
          severity: "Low",
          title: "Likely spelling mistake",
          description: `Found "${match[0]}" in visible page text.`,
          recommendation: `Review the text and consider changing it to "${suggestion}".`,
          viewport: context.viewport,
          confidence: 0.8,
          detectedBy: "rule",
          technicalDetails: { original: match[0], suggestion }
        });
      }
    }

    return issues;
  }
};
