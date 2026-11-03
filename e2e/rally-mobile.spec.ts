import { expect, test } from "@playwright/test";

// Touch phones play the rally full screen, in landscape only, with thumb buttons
// below the court; leaving the game hands the page its scrolling back.
test.use({ hasTouch: true, isMobile: true });

test.describe("landscape", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("plays the whole court full screen and exits cleanly", async ({ page }) => {
    await page.goto("/");
    const rally = page.locator("#rally");
    await rally.scrollIntoViewIfNeeded();
    await rally.getByRole("button", { name: "Play match" }).tap();

    const court = await rally.locator("canvas").boundingBox();
    const controls = await page.getByRole("button", { name: "Run left" }).boundingBox();
    expect(court && controls && controls.y >= court.y + court.height).toBe(true);
    await expect(page.getByRole("button", { name: "Serve / Jump" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");

    await page.getByRole("button", { name: "Exit the game" }).tap();
    await expect(page.getByRole("button", { name: "Run left" })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
  });
});

test.describe("landscape without the Fullscreen API (iPhone Safari)", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("the fixed overlay sits above the site header", async ({ page }) => {
    // iPhone Safari has no element fullscreen, so the game falls back to a fixed overlay.
    await page.addInitScript(() => {
      delete (Element.prototype as Partial<Element>).requestFullscreen;
    });
    await page.goto("/");
    const rally = page.locator("#rally");
    await rally.scrollIntoViewIfNeeded();
    await rally.getByRole("button", { name: "Play match" }).tap();

    const exit = page.getByRole("button", { name: "Exit the game" });
    const box = await exit.boundingBox();
    expect(box).not.toBeNull();
    // Whatever is on top at the exit button's centre must be the button itself.
    const onTop = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x!, y!)?.closest("button")?.getAttribute("aria-label"),
      [box!.x + box!.width / 2, box!.y + box!.height / 2],
    );
    expect(onTop).toBe("Exit the game");
    await exit.tap();
    await expect(page.getByRole("button", { name: "Run left" })).toHaveCount(0);
  });
});

test.describe("portrait", () => {
  test.use({ viewport: { width: 390, height: 664 } });

  test("asks to turn the phone before playing", async ({ page }) => {
    await page.goto("/");
    const rally = page.locator("#rally");
    await rally.scrollIntoViewIfNeeded();
    await rally.getByRole("button", { name: "Play match" }).tap();

    await expect(rally.getByRole("alert")).toContainText("Turn your phone sideways");
    await rally.getByRole("alert").getByRole("button", { name: "Exit the game" }).tap();
    await expect(rally.getByRole("alert")).toHaveCount(0);
  });
});
