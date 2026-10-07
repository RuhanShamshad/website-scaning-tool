import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { NormalizedIssue } from "@/lib/validation/issues";
import { normalizedIssueSchema, shouldDisplayIssue } from "@/lib/validation/issues";

const categoryMap = {
  Design: "DESIGN",
  Layout: "LAYOUT",
  Responsive: "RESPONSIVE",
  Typography: "TYPOGRAPHY",
  Content: "CONTENT",
  Spelling: "SPELLING",
  Grammar: "GRAMMAR",
  UX: "UX",
  Accessibility: "ACCESSIBILITY",
  SEO: "SEO",
  Performance: "PERFORMANCE",
  Images: "IMAGES",
  Links: "LINKS",
  Forms: "FORMS",
  Console: "CONSOLE",
  Technical: "TECHNICAL"
} as const;

const severityMap = {
  Critical: "CRITICAL",
  High: "HIGH",
  Medium: "MEDIUM",
  Low: "LOW",
  Suggestion: "SUGGESTION"
} as const;

const sourceMap = {
  rule: "RULE",
  axe: "AXE",
  ai: "AI",
  lighthouse: "LIGHTHOUSE"
} as const;

export async function persistIssues(params: {
  scanId: string;
  scanPageId: string;
  workspaceId: string;
  issues: NormalizedIssue[];
}) {
  const validIssues = params.issues
    .map((issue) => normalizedIssueSchema.parse(issue))
    .filter(shouldDisplayIssue);

  if (validIssues.length === 0) return;

  await prisma.issue.createMany({
    data: validIssues.map((issue) => ({
      scanId: params.scanId,
      scanPageId: params.scanPageId,
      workspaceId: params.workspaceId,
      pageUrl: issue.pageUrl,
      category: categoryMap[issue.category],
      type: issue.type,
      severity: severityMap[issue.severity],
      title: issue.title,
      description: issue.description,
      recommendation: issue.recommendation,
      viewport: issue.viewport as Prisma.InputJsonValue,
      selector: issue.selector,
      confidence: issue.confidence,
      screenshotId: issue.screenshotId,
      detectedBy: sourceMap[issue.detectedBy],
      technicalDetails: issue.technicalDetails as Prisma.InputJsonValue
    }))
  });
}
