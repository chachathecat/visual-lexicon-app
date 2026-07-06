import { expect, test } from "@playwright/test";

const baseUrl =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://127.0.0.1:3006";

test.describe("Saved Library current contract", () => {
  test("/saved renders the v3 memory queue entry point", async ({ page }) => {
    const response = await page.goto(`${baseUrl}/saved`, {
      waitUntil: "networkidle"
    });

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { name: "Saved Library", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Saved words become review cards.")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Due/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Weak/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /New/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Learning/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Mastered/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All/ })).toBeVisible();
  });
});
