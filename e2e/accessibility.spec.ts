import { expect, type Page, test } from "@playwright/test";

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

async function assertInteractiveElementsHaveNames(page: Page): Promise<void> {
  const buttons = page.locator("button");
  const buttonCount = await buttons.count();
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const isVisible = await button.isVisible();
    if (isVisible) {
      const hasAccessibleName =
        (await button.getAttribute("aria-label")) !== null ||
        (await button.getAttribute("aria-labelledby")) !== null ||
        ((await button.textContent())?.trim() ?? "") !== "";
      expect(hasAccessibleName).toBe(true);
    }
  }

  const links = page.locator("a");
  const linkCount = await links.count();
  for (let i = 0; i < Math.min(linkCount, 20); i++) {
    const link = links.nth(i);
    const isVisible = await link.isVisible();
    if (isVisible) {
      const hasAccessibleName =
        (await link.getAttribute("aria-label")) !== null ||
        (await link.getAttribute("aria-labelledby")) !== null ||
        ((await link.textContent())?.trim() ?? "") !== "";
      expect(hasAccessibleName).toBe(true);
    }
  }
}

async function assertImagesHaveAltText(page: Page): Promise<void> {
  const images = page.locator("img");
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
}

test.describe("Accessibility Tests", () => {
  for (const page of pages) {
    test(`${page.name} page passes basic accessibility checks`, async ({ page: p }) => {
      await p.goto(`${BASE_URL}${page.path}`);

      await expect(p.locator("main")).toBeVisible();

      const h1 = p.locator("h1");
      await expect(h1).toBeVisible({ timeout: 10000 });

      const h1Count = await h1.count();
      expect(h1Count).toBe(1);

      await assertInteractiveElementsHaveNames(p);
      await assertImagesHaveAltText(p);
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

  test("body text and background meet minimum contrast", async ({ page }) => {
    await page.goto(BASE_URL);

    const body = page.locator("body");
    const bodyStyles = await body.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });

    const parseRgb = (value: string): [number, number, number] => {
      const match = value.match(/\d+/g);
      if (!match || match.length < 3) {
        return [0, 0, 0];
      }
      return [Number(match[0]), Number(match[1]), Number(match[2])];
    };
    const toLuminance = (rgb: [number, number, number]): number => {
      const normalized = rgb.map((channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * normalized[0] + 0.7152 * normalized[1] + 0.0722 * normalized[2];
    };

    const textRgb = parseRgb(bodyStyles.color);
    const bgRgb = parseRgb(bodyStyles.backgroundColor);
    const textL = toLuminance(textRgb);
    const bgL = toLuminance(bgRgb);
    const contrastRatio = (Math.max(textL, bgL) + 0.05) / (Math.min(textL, bgL) + 0.05);

    expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
  });

  test("heading hierarchy is correct", async ({ page }) => {
    await page.goto(BASE_URL);

    const headings = page.locator("h1, h2");
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);

    if (count >= 2) {
      await expect(headings.first()).toHaveJSProperty("tagName", "H1");
    }
  });
});
