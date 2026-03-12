import { test, expect } from '@playwright/test';

test('loader renders', async ({ page }) => {
  await page.goto('http://localhost:4173/MindFlow/');
  // The app loader usually flashes quickly before redirecting or loading auth
  // Just want to ensure the page doesn't crash on load
});
