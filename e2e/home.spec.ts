import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

test.describe("ValidateHome E2E Tests", () => {
  test.describe("Home page", () => {
    test("loads successfully", async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page).toHaveTitle(/ValidateHome/);
      await expect(page.locator("h1")).toContainText("Home Upgrade Rebates");
    });

    test("has country links", async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('a[href="/programs/us"]')).toBeVisible();
      await expect(page.locator('a[href="/programs/uk"]')).toBeVisible();
      await expect(page.locator('a[href="/programs/au"]')).toBeVisible();
      await expect(page.locator('a[href="/programs/ca"]')).toBeVisible();
    });

    test("has calculator link", async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator('a[href="/calculator/heat_pump"]')).toBeVisible();
    });
  });

  test.describe("Programs page", () => {
    test("loads country programs", async ({ page }) => {
      await page.goto(`${BASE_URL}/programs`);
      await expect(page.locator("h1")).toContainText("Home Energy Rebates");
      await expect(page.locator('a[href="/programs/us"]')).toBeVisible();
    });
  });

  test.describe("Country programs page", () => {
    test("loads US programs", async ({ page }) => {
      await page.goto(`${BASE_URL}/programs/us`);
      await expect(page.locator("h1")).toContainText("United States");
    });

    test("loads UK programs", async ({ page }) => {
      await page.goto(`${BASE_URL}/programs/uk`);
      await expect(page.locator("h1")).toContainText("United Kingdom");
    });

    test("loads AU programs", async ({ page }) => {
      await page.goto(`${BASE_URL}/programs/au`);
      await expect(page.locator("h1")).toContainText("Australia");
    });

    test("loads CA programs", async ({ page }) => {
      await page.goto(`${BASE_URL}/programs/ca`);
      await expect(page.locator("h1")).toContainText("Canada");
    });
  });

  test.describe("Accessibility", () => {
    test("home page is accessible", async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
    });

    test("has proper heading hierarchy", async ({ page }) => {
      await page.goto(BASE_URL);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h2").first()).toBeVisible();
    });

    test("has skip link for accessibility", async ({ page }) => {
      await page.goto(BASE_URL);
      const skipLink = page.locator('a[href^="#"]').first();
      await expect(skipLink).toBeAttached();
      const href = await skipLink.getAttribute("href");
      expect(href?.startsWith("#")).toBeTruthy();
    });
  });

  test.describe("Search page", () => {
    test("loads search page", async ({ page }) => {
      await page.goto(`${BASE_URL}/search`);
      await expect(page.locator("h1")).toContainText("Search Programs");
    });
  });

  test.describe("Local pages", () => {
    test("loads US local page", async ({ page }) => {
      await page.goto(`${BASE_URL}/local/us/ca`);
      await expect(page.locator("h1")).toContainText("California");
    });

    test("loads UK local page", async ({ page }) => {
      await page.goto(`${BASE_URL}/local/uk/london`);
      await expect(page.locator("h1")).toContainText("London");
    });
  });
});
