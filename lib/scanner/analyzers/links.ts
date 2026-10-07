import type { Analyzer } from "@/lib/scanner/types";

export const brokenLinkAnalyzer: Analyzer = {
  name: "broken-links",
  async analyze(context) {
    const links = await context.page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .map((link) => ({
          href: link.href,
          text: link.innerText.trim().slice(0, 80),
          selector: link.id ? `#${CSS.escape(link.id)}` : "a[href]"
        }))
        .filter((link) => link.href.startsWith("http"))
        .slice(0, 40)
    );

    const internalHost = new URL(context.pageUrl).hostname.replace(/^www\./, "");
    const internalLinks = links.filter((link) => new URL(link.href).hostname.replace(/^www\./, "") === internalHost);
    const results = await Promise.all(
      internalLinks.slice(0, 20).map(async (link) => {
        try {
          const response = await fetch(link.href, { method: "HEAD", redirect: "follow" });
          if (response.status >= 400) return { ...link, status: response.status };
          return null;
        } catch (error) {
          return { ...link, status: 0, error: error instanceof Error ? error.message : "Request failed" };
        }
      })
    );

    return results
      .filter(Boolean)
      .map((result) => ({
        pageUrl: context.pageUrl,
        category: "Links",
        type: "broken_link",
        severity: result!.status >= 500 || result!.status === 0 ? "High" : "Medium",
        title: "Broken internal link",
        description: `An internal link returned ${result!.status === 0 ? "a network error" : `HTTP ${result!.status}`}.`,
        recommendation: "Update the link target, restore the missing page, or add the correct redirect.",
        viewport: context.viewport,
        selector: result!.selector,
        confidence: 0.9,
        detectedBy: "rule",
        technicalDetails: result!
      }));
  }
};
