import { test, expect } from '@playwright/test';

test('verify synonyms feature', async ({ page }) => {
  await page.goto('http://localhost:3000/#/vocab');
  await page.waitForTimeout(2000);

  const textContent = await page.locator('body').innerText();
  console.log('PAGE TEXT:', textContent);
});
