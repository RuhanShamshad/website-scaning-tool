import type { Analyzer } from "@/lib/scanner/types";

export const overflowAnalyzer: Analyzer = {
  name: "horizontal-overflow",
  async analyze(context) {
    const findings = await context.page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const elements = Array.from(document.body.querySelectorAll<HTMLElement>("*"));

      return elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const overflowRight = Math.round(rect.right - viewportWidth);
          const overflowLeft = Math.round(0 - rect.left);
          const overflowPx = Math.max(overflowRight, overflowLeft, 0);
          if (rect.width < 1 || rect.height < 1 || overflowPx < 8) return null;

          return {
            selector: buildSelector(element),
            overflowPx,
            rect: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            }
          };
        })
        .filter(Boolean)
        .slice(0, 10);

      function buildSelector(element: Element): string {
        if (element.id) return `#${CSS.escape(element.id)}`;
        const classes = Array.from(element.classList).slice(0, 3).map((item) => `.${CSS.escape(item)}`).join("");
        return `${element.tagName.toLowerCase()}${classes}`;
      }
    });

    return findings.map((finding) => ({
      pageUrl: context.pageUrl,
      category: "Responsive",
      type: "horizontal_overflow",
      severity: finding!.overflowPx > 48 ? "High" : "Medium",
      title: "Content extends beyond the viewport",
      description: `This element is ${finding!.overflowPx}px wider than the ${context.viewport.width}px viewport, which can cause horizontal scrolling.`,
      recommendation: "Constrain this element to the viewport, stack it on small screens, or wrap wide content in a controlled overflow container.",
      viewport: context.viewport,
      selector: finding!.selector,
      confidence: 0.92,
      detectedBy: "rule",
      technicalDetails: { rect: finding!.rect, overflowPx: finding!.overflowPx }
    }));
  }
};
