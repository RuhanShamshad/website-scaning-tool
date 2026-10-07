import type { Analyzer } from "@/lib/scanner/types";

export const imageAnalyzer: Analyzer = {
  name: "images",
  async analyze(context) {
    const findings = await context.page.evaluate(() => {
      return Array.from(document.images)
        .map((image) => {
          const rect = image.getBoundingClientRect();
          const selector = image.id ? `#${CSS.escape(image.id)}` : image.alt ? `img[alt="${CSS.escape(image.alt).slice(0, 40)}"]` : "img";
          const src = image.currentSrc || image.src;

          if (!image.complete || image.naturalWidth === 0) {
            return { type: "broken", selector, src };
          }

          if (!image.alt && rect.width > 80 && rect.height > 80) {
            return { type: "missing_alt", selector, src };
          }

          if (image.naturalWidth > 0 && rect.width > 0 && image.naturalWidth > rect.width * 3 && image.naturalWidth > 1600) {
            return {
              type: "oversized",
              selector,
              src,
              renderedWidth: Math.round(rect.width),
              naturalWidth: image.naturalWidth
            };
          }

          return null;
        })
        .filter(Boolean)
        .slice(0, 20);
    });

    return findings.map((finding) => {
      if (finding!.type === "broken") {
        return {
          pageUrl: context.pageUrl,
          category: "Images",
          type: "broken_image",
          severity: "High",
          title: "Broken image detected",
          description: "An image failed to load for visitors.",
          recommendation: "Verify the image URL, file permissions, CDN configuration, and responsive image sources.",
          viewport: context.viewport,
          selector: finding!.selector,
          confidence: 0.95,
          detectedBy: "rule",
          technicalDetails: { src: finding!.src }
        };
      }

      if (finding!.type === "missing_alt") {
        return {
          pageUrl: context.pageUrl,
          category: "Accessibility",
          type: "missing_image_alt",
          severity: "Medium",
          title: "Image is missing descriptive alt text",
          description: "A meaningful image does not expose alt text to assistive technology.",
          recommendation: "Add concise alt text that explains the image purpose, or use empty alt only for decorative images.",
          viewport: context.viewport,
          selector: finding!.selector,
          confidence: 0.86,
          detectedBy: "rule",
          technicalDetails: { src: finding!.src }
        };
      }

      return {
        pageUrl: context.pageUrl,
        category: "Performance",
        type: "oversized_image",
        severity: "Low",
        title: "Image is larger than its rendered size",
        description: `This image is ${finding!.naturalWidth}px wide but renders around ${finding!.renderedWidth}px wide.`,
        recommendation: "Serve responsive image sizes with srcset or compress the image for the displayed dimensions.",
        viewport: context.viewport,
        selector: finding!.selector,
        confidence: 0.78,
        detectedBy: "rule",
        technicalDetails: finding!
      };
    });
  }
};
