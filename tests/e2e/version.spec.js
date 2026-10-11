const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// The version lives in package.json; the changelog has a section for it and the Game Zone page shows it.
const root = path.join(__dirname, '..', '..');
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');

test('package.json, package-lock.json and the changelog agree on the version', () => {
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  expect(lock.version).toBe(version);
  expect(lock.packages[''].version).toBe(version);
  const released = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);   // the newest released section
  expect(released && released[1]).toBe(version);
  expect(changelog).toMatch(/^## \[Unreleased\]/m);
});

test('the Game Zone page shows the version', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#version')).toHaveText(new RegExp(`^v${version.replace(/\./g, '\\.')} · What's new$`));
});
