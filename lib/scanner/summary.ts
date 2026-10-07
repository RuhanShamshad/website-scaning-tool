import type { Issue } from "@prisma/client";

export function generateRuleBasedSummary(issues: Pick<Issue, "severity" | "category" | "title">[], score: number): string {
  if (issues.length === 0) {
    return "The scanned page did not surface any high-confidence issues in the Milestone 1 checks.";
  }

  const counts = new Map<string, number>();
  for (const issue of issues) {
    counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
  }
  const topCategories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => `${count} ${category.toLowerCase()} issue${count === 1 ? "" : "s"}`)
    .join(", ");

  const priority = issues.find((issue) => ["CRITICAL", "HIGH"].includes(issue.severity)) ?? issues[0];
  return `The scan produced an overall score of ${score}/100 with ${topCategories}. The first priority is: ${priority.title}.`;
}
