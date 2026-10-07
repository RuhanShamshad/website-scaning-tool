import { z } from "zod";

export const issueCategories = [
  "Design",
  "Layout",
  "Responsive",
  "Typography",
  "Content",
  "Spelling",
  "Grammar",
  "UX",
  "Accessibility",
  "SEO",
  "Performance",
  "Images",
  "Links",
  "Forms",
  "Console",
  "Technical"
] as const;

export const issueSeverities = ["Critical", "High", "Medium", "Low", "Suggestion"] as const;

export const viewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  label: z.string().optional()
});

export const normalizedIssueSchema = z.object({
  pageUrl: z.string().url(),
  category: z.enum(issueCategories),
  type: z.string().min(1),
  severity: z.enum(issueSeverities),
  title: z.string().min(1),
  description: z.string().min(1),
  recommendation: z.string().min(1),
  viewport: viewportSchema.optional(),
  selector: z.string().optional(),
  confidence: z.number().min(0).max(1),
  screenshotId: z.string().optional(),
  detectedBy: z.enum(["rule", "axe", "ai", "lighthouse"]),
  technicalDetails: z.record(z.string(), z.unknown()).optional()
});

export type IssueCategory = (typeof issueCategories)[number];
export type IssueSeverity = (typeof issueSeverities)[number];
export type Viewport = z.infer<typeof viewportSchema>;
export type NormalizedIssue = z.infer<typeof normalizedIssueSchema>;

export function shouldDisplayIssue(issue: NormalizedIssue): boolean {
  return issue.confidence >= 0.7 || issue.severity === "Suggestion";
}
