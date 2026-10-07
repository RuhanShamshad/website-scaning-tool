import { chromium, type Browser, type BrowserContext } from "playwright";
import { prisma } from "@/lib/db/prisma";
import { milestoneAnalyzers } from "@/lib/scanner/analyzers";
import { detectPlatform } from "@/lib/scanner/platform";
import { persistIssues } from "@/lib/scanner/persistence/issues";
import { scoreIssues } from "@/lib/scanner/scoring";
import { generateRuleBasedSummary } from "@/lib/scanner/summary";
import { captureFullPageScreenshot } from "@/lib/scanner/storage/screenshots";
import { type ConsoleEntry, defaultViewports } from "@/lib/scanner/types";
import { updateScanProgress } from "@/lib/queue/progress";
import { assertPubliclyRoutable, normalizeSubmittedUrl } from "@/lib/security/url";

export async function runScan(scanId: string): Promise<void> {
  const scan = await prisma.scan.findUniqueOrThrow({
    where: { id: scanId },
    include: { website: true }
  });

  await prisma.scan.update({
    where: { id: scanId },
    data: { startedAt: new Date() }
  });

  let browser: Browser | null = null;

  try {
    await updateScanProgress(scanId, "STARTING_BROWSER", 5);
    await assertPubliclyRoutable(scan.normalizedUrl);
    browser = await chromium.launch({ headless: true });

    await updateScanProgress(scanId, "DISCOVERING_PAGES", 15);
    const safeUrl = normalizeSubmittedUrl(scan.normalizedUrl);
    const pagesToScan = [safeUrl.normalized];

    for (const [index, pageUrl] of pagesToScan.entries()) {
      await updateScanProgress(scanId, "SCANNING_PAGES", 20 + index * 15);
      await scanPage({
        browser,
        scanId,
        workspaceId: scan.workspaceId,
        pageUrl
      });
    }

    await updateScanProgress(scanId, "GENERATING_REPORT", 88);
    const issues = await prisma.issue.findMany({ where: { scanId } });
    const { overall, categoryScores } = scoreIssues(issues);
    const summary = generateRuleBasedSummary(issues, overall);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "COMPLETED",
        progress: 100,
        score: overall,
        categoryScores,
        summary,
        completedAt: new Date()
      }
    });
  } catch (error) {
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "FAILED",
        progress: 100,
        errorMessage: error instanceof Error ? error.message : "Unknown scan failure",
        failedAt: new Date()
      }
    });
    throw error;
  } finally {
    await browser?.close();
  }
}

async function scanPage(params: {
  browser: Browser;
  scanId: string;
  workspaceId: string;
  pageUrl: string;
}) {
  const context = await params.browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: "WebsiteAuditBot/0.1 (+https://example.com/audit-bot)"
  });
  await guardContext(context);

  try {
    const pageRecord = await prisma.scanPage.upsert({
      where: { scanId_url: { scanId: params.scanId, url: params.pageUrl } },
      update: {},
      create: {
        scanId: params.scanId,
        workspaceId: params.workspaceId,
        url: params.pageUrl,
        discoveredLinks: []
      }
    });

    const page = await context.newPage();
    const consoleEntries: ConsoleEntry[] = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleEntries.push({ type: message.type(), text: message.text(), location: message.location().url });
      }
    });
    page.on("pageerror", (error) => {
      consoleEntries.push({ type: "pageerror", text: error.message });
    });

    const started = Date.now();
    const response = await page.goto(params.pageUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);
    const title = await page.title().catch(() => null);
    const links = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).map((link) => link.href).slice(0, 250));
    const platform = await detectPlatform(page);

    await prisma.scanPage.update({
      where: { id: pageRecord.id },
      data: {
        title,
        httpStatus: response?.status(),
        loadTimeMs: Date.now() - started,
        redirectChain: [],
        discoveredLinks: links
      }
    });

    if (platform) {
      await prisma.website.update({
        where: { id: (await prisma.scan.findUniqueOrThrow({ where: { id: params.scanId } })).websiteId },
        data: { platform }
      });
    }

    for (const viewport of defaultViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const screenshot = await captureFullPageScreenshot({
        page,
        scanId: params.scanId,
        pageId: pageRecord.id,
        viewport
      });
      await prisma.screenshot.create({
        data: {
          scanId: params.scanId,
          scanPageId: pageRecord.id,
          workspaceId: params.workspaceId,
          url: params.pageUrl,
          viewport,
          kind: "full_page",
          storageKey: screenshot.storageKey,
          width: screenshot.width,
          height: screenshot.height
        }
      });

      const issueSets = await Promise.all(
        milestoneAnalyzers.map((analyzer) =>
          analyzer.analyze({
            scanId: params.scanId,
            scanPageId: pageRecord.id,
            workspaceId: params.workspaceId,
            pageUrl: params.pageUrl,
            page,
            viewport,
            consoleEntries
          })
        )
      );

      await persistIssues({
        scanId: params.scanId,
        scanPageId: pageRecord.id,
        workspaceId: params.workspaceId,
        issues: issueSets.flat()
      });
    }
  } finally {
    await context.close();
  }
}

async function guardContext(context: BrowserContext) {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();

    try {
      await assertPubliclyRoutable(url);
      await route.continue();
    } catch {
      await route.abort("blockedbyclient");
    }
  });
}
