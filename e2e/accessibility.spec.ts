import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// One parametrized scan across the main pages, both locales — the highest-value
// a11y check we can automate. One legal page stands in for the shared LegalPage
// layout; contact form states aren't covered, a manual review pass covers the rest.
const routes = [
  "/",
  "/courts",
  "/training",
  "/events",
  "/lounge",
  "/sponsoring",
  "/faq",
  "/vouchers",
  "/contact",
  "/book",
  "/about",
  "/impressum",
  "/de",
  "/de/courts",
  "/de/faq",
  "/de/contact",
  "/de/book",
];

for (const route of routes) {
  test(`${route} has no serious/critical accessibility violations`, async ({ page }) => {
    await page.goto(route);
    // Sections fade in via a 500ms scroll-reveal transition (see Reveal component);
    // scanning mid-transition reports a transient low-contrast blend as a false
    // positive, so we wait past it before running axe.
    await page.waitForTimeout(700);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    const seriousOrCritical = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    expect(
      seriousOrCritical,
      seriousOrCritical.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([]);
  });
}
