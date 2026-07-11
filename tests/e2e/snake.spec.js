const { test, expect } = require('@playwright/test');

test('snake page loads', async ({ page }) => {
  await page.goto('http://localhost:8080/snake/');
  await expect(page).toHaveTitle(/snake/i);
});
