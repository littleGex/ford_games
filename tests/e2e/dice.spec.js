const { test, expect } = require('@playwright/test');

test('dice page loads', async ({ page }) => {
  await page.goto('/dice/');
  await expect(page).toHaveTitle(/dice/i);
});
