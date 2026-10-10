import { test, expect } from "@playwright/test";

test("browse, semantic search, save, journal persistence, and delete", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator(".place-card")).toHaveCount(24);
  await expect(page.locator(".map .leaflet-marker-icon")).toHaveCount(24);
  await page.getByLabel("Maximum walking time").selectOption("45");
  await page.getByLabel("Difficulty", { exact: true }).selectOption("easy");
  await page
    .getByLabel("Describe your ideal outing")
    .fill("a peaceful shaded stroll under a leafy canopy");
  await page.getByRole("button", { name: "Find my escape" }).click();
  await expect(page.locator(".search-proof")).toContainText(
    "Live semantic search",
  );
  const cards = page.locator(".place-card");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const label of await cards
    .locator(".difficulty-badge")
    .allTextContents())
    expect(label).toBe("easy");
  for (const label of await cards
    .locator(".place-stats span:first-child")
    .allTextContents())
    expect(parseInt(label)).toBeLessThanOrEqual(45);
  await cards.first().locator(".save-button").click();
  await page.getByRole("button", { name: "Saved places" }).click();
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: "Saved places" }).click();
  await expect(page.locator(".place-card")).toHaveCount(1);
  await page.locator(".place-card").first().locator(".card-title").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Log a completed walk" }).click();
  await page.getByLabel("Minutes outdoors").fill("42");
  await page.getByLabel("A field note").fill("Browser test: a quiet canopy.");
  await page.getByRole("button", { name: "Save to journal" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Field journal" }).click();
  await expect(page.locator(".walk-list")).toContainText(
    "Browser test: a quiet canopy.",
  );
  await page.reload();
  await page.getByRole("button", { name: "Field journal" }).click();
  await expect(page.locator(".walk-list")).toContainText("42 min");
  await page.getByRole("button", { name: /Delete walk at/ }).click();
  await expect(page.locator(".journal-empty")).toBeVisible();
  expect(errors).toEqual([]);
});

test("empty search, reset, map detail, keyboard dismissal, responsive width", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".place-card")).toHaveCount(24);
  await page.getByLabel("Maximum walking time").selectOption("30");
  await page
    .getByLabel("Difficulty", { exact: true })
    .selectOption("challenging");
  await page.getByRole("button", { name: "Find my escape" }).click();
  await expect(
    page.getByText("No places match these filters yet."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore places", exact: true })
    .click();
  await expect(page.locator(".place-card")).toHaveCount(24);
  await page.locator(".leaflet-marker-icon").first().press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "Your next little escape." })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `test-results/explore-${test.info().project.name}.png`,
    fullPage: false,
  });
});

test("backend outage has a recoverable error, never fake recommendations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".place-card")).toHaveCount(24);
  await page.route("**/api/search", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "The database is unavailable. Please try again shortly.",
      }),
    }),
  );
  await page.getByRole("button", { name: "Find my escape" }).click();
  await expect(
    page.getByText("We couldn’t reach the trailhead."),
  ).toBeVisible();
  await expect(page.locator(".place-card")).toHaveCount(0);
  await page.unroute("**/api/search");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".place-card").first()).toBeVisible();
  await expect(page.locator(".search-proof")).toContainText(
    "Live semantic search",
  );
});
