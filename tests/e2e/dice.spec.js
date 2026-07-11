const { test, expect } = require('@playwright/test');

test('dice page loads', async ({ page }) => {
  await page.goto('http://localhost:8080/dice/');
  await expect(page).toHaveTitle(/dice/i);
});
