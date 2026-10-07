import type { Issue } from "@prisma/client";

type CategoryScoreKey = "Design" | "Responsive" | "Content" | "Accessibility" | "SEO" | "Performance" | "Technical";

const weights = {
  CRITICAL: 18,
  HIGH: 10,
  MEDIUM: 5,
  LOW: 2,
  SUGGESTION: 1
} as const;

const categoryGroups: Record<CategoryScoreKey, string[]> = {
  Design: ["DESIGN", "LAYOUT", "TYPOGRAPHY", "UX"],
  Responsive: ["RESPONSIVE", "LAYOUT"],
  Content: ["CONTENT", "SPELLING", "GRAMMAR"],
  Accessibility: ["ACCESSIBILITY"],
  SEO: ["SEO", "IMAGES", "LINKS"],
  Performance: ["PERFORMANCE", "IMAGES"],
  Technical: ["TECHNICAL", "CONSOLE", "FORMS"]
};

export function scoreIssues(issues: Pick<Issue, "severity" | "category">[]) {
  const categoryScores = Object.fromEntries(
    Object.entries(categoryGroups).map(([key, categories]) => [key, scoreForIssues(issues.filter((issue) => categories.includes(issue.category)))])
  ) as Record<CategoryScoreKey, number>;

  const overall = Math.round(
    categoryScores.Design * 0.18 +
      categoryScores.Responsive * 0.18 +
      categoryScores.Content * 0.12 +
      categoryScores.Accessibility * 0.18 +
      categoryScores.SEO * 0.12 +
      categoryScores.Performance * 0.12 +
      categoryScores.Technical * 0.1
  );

  return { overall, categoryScores };
}

function scoreForIssues(issues: Pick<Issue, "severity">[]): number {
  const penalty = issues.reduce((total, issue) => total + weights[issue.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}
