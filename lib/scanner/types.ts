import type { Page } from "playwright";
import type { NormalizedIssue, Viewport } from "@/lib/validation/issues";

export const defaultViewports: Viewport[] = [
  { label: "Desktop", width: 1440, height: 900 },
  { label: "Mobile", width: 390, height: 844 }
];

export type ConsoleEntry = {
  type: string;
  text: string;
  location?: string;
};

export type PageAnalysisContext = {
  scanId: string;
  scanPageId: string;
  workspaceId: string;
  pageUrl: string;
  page: Page;
  viewport: Viewport;
  consoleEntries: ConsoleEntry[];
};

export type Analyzer = {
  name: string;
  analyze(context: PageAnalysisContext): Promise<NormalizedIssue[]>;
};

export type DiscoveredPage = {
  url: string;
  title?: string;
  httpStatus?: number;
  loadTimeMs?: number;
  discoveredLinks: string[];
};
