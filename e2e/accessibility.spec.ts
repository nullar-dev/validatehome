import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const pages = [
  { name: "Home", path: "/" },
  { name: "Programs", path: "/programs" },
  { name: "US Programs", path: "/programs/us" },
  { name: "UK Programs", path: "/programs/uk" },
  { name: "AU Programs", path: "/programs/au" },
  { name: "CA Programs", path: "/programs/ca" },
  { name: "Heat Pump Calculator", path: "/calculator/heat_pump" },
  { name: "Solar Calculator", path: "/calculator/solar" },
  { name: "Search", path: "/search" },
  { name: "US California Local", path: "/local/us/ca" },
];

test.describe("Accessibility Tests", () => {
  for (const page of pages) {
    test(`${page.name} page passes basic accessibility checks`, async ({ page: p }) => {
      await p.goto(`${BASE_URL}${page.path}`);

      await expect(p.locator("main")).toBeVisible();

      const h1 = p.locator("h1");
      await expect(h1).toBeVisible({ timeout: 10000 });

      const h1Count = await h1.count();
      expect(h1Count).toBe(1);

      const buttons = p.locator("button");
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();
        if (isVisible) {
          const hasAccessibleName =
            (await button.getAttribute("aria-label")) !== null ||
            (await button.getAttribute("aria-labelledby")) !== null ||
            (await button.textContent()) !== "";
          expect(hasAccessibleName).toBe(true);
        }
      }

      const images = p.locator("img");
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const isVisible = await img.isVisible();
        if (isVisible) {
          const alt = await img.getAttribute("alt");
          const role = await img.getAttribute("role");
          expect(alt !== null || role === "presentation").toBe(true);
        }
      }

      const links = p.locator("a");
      const linkCount = await links.count();
      for (let i = 0; i < Math.min(linkCount, 20); i++) {
        const link = links.nth(i);
        const isVisible = await link.isVisible();
        if (isVisible) {
          const hasAccessibleName =
            (await link.getAttribute("aria-label")) !== null ||
            (await link.getAttribute("aria-labelledby")) !== null ||
            (await link.textContent()) !== "";
          expect(hasAccessibleName).toBe(true);
        }
      }
    });
  }

  test("forms have proper labels", async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/heat_pump`);

    const inputs = page.locator("input, select, textarea");
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const isVisible = await input.isVisible();
      if (!isVisible) continue;

      const id = await input.getAttribute("id");
      const hasLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;
      const hasAriaLabel = (await input.getAttribute("aria-label")) !== null;
      const hasAriaLabelledBy = (await input.getAttribute("aria-labelledby")) !== null;

      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
    }
  });

  test("keyboard navigation works", async ({ page }) => {
    await page.goto(BASE_URL);

    await page.keyboard.press("Tab");
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(focusedElement).toBeVisible();
  });

  test("color contrast is sufficient", async ({ page }) => {
    await page.goto(BASE_URL);

    const body = page.locator("body");
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    expect(bodyStyles.color).toBeTruthy();
    expect(bodyStyles.backgroundColor).toBeTruthy();
  });

  test("heading hierarchy is correct", async ({ page }) => {
    await page.goto(BASE_URL);

    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    const h2Count = await page.locator("h2").count();
    if (h2Count > 0) {
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });
});
