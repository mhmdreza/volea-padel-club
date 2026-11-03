import { expect, test, type Page } from "@playwright/test";

// Tomorrow on the club's clock, independent of the machine running the tests.
function berlinDate(offsetDays: number) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + offsetDays)).toISOString().slice(0, 10);
}

// The radios are visually hidden inside styled labels; click the label like a visitor.
const labelFor = (page: Page, name: RegExp) =>
  page.locator("label", { has: page.getByRole("radio", { name }) });

test("book a slot with the keyboard and hand it to the contact form", async ({ page }) => {
  await page.goto("/book");

  const firstDoubles = page.getByRole("radio", { name: /^Doubles Court 1/ });
  await firstDoubles.focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  const court = page.getByRole("radio", { name: /^Doubles Court 2/ });
  await expect(court).toHaveAttribute("aria-checked", "true");
  await expect(court).toBeFocused();

  const tomorrow = berlinDate(1);
  // Today's slots stay on screen while tomorrow's load; don't read those.
  const tomorrowLoaded = page.waitForResponse((res) =>
    res.url().includes(`/api/availability?date=${tomorrow}&duration=90`),
  );
  await labelFor(page, /^Tomorrow/).click();
  await labelFor(page, /^90 min$/).click();
  await tomorrowLoaded;
  await expect(page.getByRole("radio", { name: /^Tomorrow/ })).toBeChecked();

  const firstFree = page.locator('input[name="booking-time"]:not([disabled])').first();
  const start = await firstFree.getAttribute("value");
  expect(start).toMatch(/^\d\d:\d\d$/);
  await labelFor(page, new RegExp(`^${start}$`)).click();

  const summary = page.getByRole("complementary", { name: "Your slot" });
  await expect(summary).toContainText("Price to be confirmed");
  await expect(summary).toContainText("Doubles Court 2");
  await expect(summary).toContainText(start!);

  await expect(page).toHaveURL(
    new RegExp(`court=doubles-2&date=${tomorrow}&duration=90&time=${start!.replace(":", "%3A")}`),
  );

  // Reload restores the whole selection from the URL alone.
  await page.reload();
  await expect(page.getByRole("radio", { name: /^Doubles Court 2/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("radio", { name: start! })).toBeChecked();
  await expect(summary).toContainText(start!);

  await summary.getByRole("link", { name: "Request this slot" }).click();
  await expect(page).toHaveURL(/\/contact\?type=booking&message=/);
  await expect(page.getByLabel("Message")).toHaveValue(
    new RegExp(`^I'd like to book Doubles Court 2 on .+, ${start}–\\d\\d:\\d\\d \\(90 min\\)\\.$`),
  );
  await expect(page.locator("#inquiryType")).toContainText("Court Booking Request");
});

test("the rally deep link preselects a singles court and says hello", async ({ page }) => {
  await page.goto("/book?court=singles-1&from=rally");
  await expect(page.getByText("Good match. Singles Court 1 is warmed up for you.")).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Singles Court 1/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

test("a broken link degrades field by field", async ({ page }) => {
  await page.goto("/book?court=centre&date=2026-02-30&duration=45&time=18:15");
  await expect(page.getByRole("radio", { name: /^Today/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /^90 min$/ })).toBeChecked();
  await expect(page.getByText("Choose a court on the plan to see its free times.")).toBeVisible();
});

test("a stale link drops a booked slot and says so", async ({ page, request }) => {
  const tomorrow = berlinDate(1);
  const res = await request.get(`/api/availability?date=${tomorrow}&duration=90`);
  const body = (await res.json()) as {
    courts: { courtId: string; slots: { start: string; status: string }[] }[];
  };
  const court = body.courts.find((c) => c.slots.some((s) => s.status === "booked"))!;
  const booked = court.slots.find((s) => s.status === "booked")!.start;

  await page.goto(`/book?court=${court.courtId}&date=${tomorrow}&duration=90&time=${booked}`);
  await expect(page.getByText("That slot is no longer free")).toBeVisible();
  await expect(page).not.toHaveURL(/time=/);
});

test("switching to German keeps the selection", async ({ page }) => {
  await page.goto("/book?court=doubles-1&duration=60");
  await expect(page.getByRole("radio", { name: /^Doubles Court 1/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.getByRole("button", { name: "DE" }).click();
  await expect(page).toHaveURL(/\/de\/book\?court=doubles-1&duration=60$/);
  await expect(page.getByRole("radio", { name: /^Doppel-Court 1/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("radio", { name: /^60 Min\.$/ })).toBeChecked();
});

test("reduced motion shows the chosen court in its final state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/book?court=doubles-3");
  const ball = page.locator('[class*="animate-ball-drop"]');
  await expect(ball).toHaveCount(1);
  expect(await ball.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  const lines = page.locator('[class*="animate-line-draw"]');
  expect(await lines.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the next step in a bottom bar without horizontal scroll", async ({ page }) => {
    await page.goto("/book?court=singles-2");
    await expect(page.getByTestId("booking-bar")).toBeVisible();
    await expect(page.getByTestId("booking-bar")).toContainText(
      "Choose a court, a day and a time to continue.",
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});
