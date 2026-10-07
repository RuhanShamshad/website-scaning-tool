import type { Page } from "playwright";

export async function detectPlatform(page: Page): Promise<string | null> {
  const signals = await page.evaluate(() => {
    const html = document.documentElement.innerHTML.slice(0, 250000).toLowerCase();
    const generator = document.querySelector<HTMLMetaElement>('meta[name="generator"]')?.content.toLowerCase() ?? "";
    return { html, generator };
  });

  if (signals.generator.includes("wordpress") || signals.html.includes("/wp-content/")) return "WordPress";
  if (signals.html.includes("woocommerce")) return "WordPress + WooCommerce";
  if (signals.html.includes("cdn.shopify.com") || signals.html.includes("shopify")) return "Shopify";
  if (signals.html.includes("webflow")) return "Webflow";
  if (signals.html.includes("static.wixstatic.com")) return "Wix";
  if (signals.html.includes("squarespace")) return "Squarespace";
  if (signals.html.includes("__next")) return "Next.js";
  if (signals.html.includes("data-reactroot") || signals.html.includes("react")) return "React";
  if (signals.html.includes("vue")) return "Vue";
  return null;
}
