import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// The homepage's facts, hall, explore, and partner bands stack like cards: each one
// slides over the last, and the anchors live on sentinels before the cards.

const anchorTop = (page: Page, id: string) =>
  page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().top, id);

const scrollToAnchor = (page: Page, id: string, offset: number) =>
  page.evaluate(
    ([id, offset]) => {
      const top = document.getElementById(id)!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + offset);
    },
    [id, offset] as const,
  );

test.describe("desktop", () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test("scrolling into explore buries the facts card under it", async ({ page }) => {
    await page.goto("/");
    await scrollToAnchor(page, "explore", 200);

    const facts = page.locator("#facts + .stack-card");
    await expect(facts).toHaveAttribute("data-covered", "");
    const hit = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return {
        inExplore: Boolean(document.querySelector("#explore + .stack-card")?.contains(el)),
        inFacts: Boolean(document.querySelector("#facts + .stack-card")?.contains(el)),
      };
    });
    expect(hit).toEqual({ inExplore: true, inFacts: false });
  });

  test("focusing a link in a covered card brings the card back out", async ({ page }) => {
    await page.goto("/");
    await scrollToAnchor(page, "partners", 0);
    const explore = page.locator("#explore + .stack-card");
    await expect(explore).toHaveAttribute("data-covered", "");

    const link = explore.getByRole("link").first();
    await link.focus();
    await expect(explore).not.toHaveAttribute("data-covered");
    const visible = await link.evaluate((a) => {
      const r = a.getBoundingClientRect();
      return a.contains(document.elementFromPoint(r.left + r.width / 2, r.top + 10));
    });
    expect(visible).toBe(true);
  });

  test("the timeline's Facts link brings the facts card back", async ({ page }) => {
    await page.goto("/");
    await scrollToAnchor(page, "explore", 200);
    const timeline = page.getByRole("navigation", { name: "Page sections" });
    await expect(timeline.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "aria-current",
      "location",
    );

    await timeline.getByRole("link", { name: "Facts" }).click();
    await expect.poll(() => anchorTop(page, "facts")).toBeCloseTo(64, -1);
    await expect(page.locator("#facts + .stack-card")).not.toHaveAttribute("data-covered");
    await expect(timeline.getByRole("link", { name: "Facts" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("the timeline leaves once explore is passed", async ({ page }) => {
    await page.goto("/");
    await scrollToAnchor(page, "partners", 0);
    const timeline = page.locator('nav[aria-label="Page sections"]');
    await expect(timeline).toHaveAttribute("aria-hidden", "true");
    await expect(timeline).toHaveCSS("opacity", "0");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("nothing sticks; the cards just flow", async ({ page }) => {
    await page.goto("/");
    const positions = await page
      .locator(".stack-card")
      .evaluateAll((cards) => cards.map((c) => getComputedStyle(c).position));
    expect(positions.length).toBe(4);
    expect(positions.every((p) => p !== "sticky")).toBe(true);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow and no serious a11y violations mid-stack", async ({ page }) => {
    await page.goto("/");
    await scrollToAnchor(page, "explore", 0);
    // Past the Reveal fade-in (see accessibility.spec.ts).
    await page.waitForTimeout(700);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBe(0);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, serious.map((v) => `${v.id}: ${v.help}`).join("\n")).toEqual([]);
  });
});
