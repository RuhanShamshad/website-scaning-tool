export type ScreenshotReviewInput = {
  pageUrl: string;
  viewport: { width: number; height: number; label?: string };
  screenshotStorageKey: string;
  detectedIssues: unknown[];
};

export type ContentReviewInput = {
  pageUrl: string;
  visibleText: string;
};

export type AIProvider = {
  analyzeScreenshot(input: ScreenshotReviewInput): Promise<unknown[]>;
  analyzeContent(input: ContentReviewInput): Promise<unknown[]>;
  validateDesignIssue(input: unknown): Promise<{ valid: boolean; confidence: number }>;
  generateSummary(input: { score: number; issues: unknown[] }): Promise<string>;
};
