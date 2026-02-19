import { expect, test } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.E2E_API_URL ?? "http://localhost:4000";

test.describe("Smoke Tests", () => {
  test("home page loads", async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/ValidateHome/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("programs page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("US programs page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/programs/us`);
    await expect(page.locator("h1")).toContainText("United States");
  });

  test("calculator page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator/heat_pump`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/search`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("input[type='search']")).toBeVisible();
  });

  test("robots.txt loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/robots.txt`);
    const content = await page.content();
    expect(content).toContain("User-agent");
  });

  test("sitemap.xml loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/sitemap.xml`);
    const content = await page.content();
    expect(content).toContain("urlset");
    expect(content).toContain("validatehome.com");
  });

  test("local page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/local/us/ca`);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("API health check passes", async ({ page }) => {
    const response = await page.request.get(`${API_BASE_URL}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("ok");
  });

  test("no console errors on home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    const filteredErrors = errors.filter(
      (e) =>
        !e.includes("chrome-extension") &&
        !e.includes("ResizeObserver") &&
        !e.includes("network error"),
    );
    expect(filteredErrors).toHaveLength(0);
  });
});
