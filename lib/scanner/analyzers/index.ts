import type { Analyzer } from "@/lib/scanner/types";
import { accessibilityAnalyzer } from "@/lib/scanner/analyzers/accessibility";
import { brokenLinkAnalyzer } from "@/lib/scanner/analyzers/links";
import { consoleAnalyzer } from "@/lib/scanner/analyzers/console";
import { imageAnalyzer } from "@/lib/scanner/analyzers/images";
import { overflowAnalyzer } from "@/lib/scanner/analyzers/overflow";
import { spellingAnalyzer } from "@/lib/scanner/analyzers/spelling";

export const milestoneAnalyzers: Analyzer[] = [
  overflowAnalyzer,
  imageAnalyzer,
  brokenLinkAnalyzer,
  consoleAnalyzer,
  spellingAnalyzer,
  accessibilityAnalyzer
];
