import { test, expect } from '@playwright/test';

test('verify synonyms feature', async ({ page }) => {
  await page.goto('http://localhost:4173/MindFlow/#/vocab');
  await page.waitForTimeout(2000);

  const html = await page.content();
  console.log('HTML CONTENT:', html.substring(0, 1000));

  const textContent = await page.locator('body').innerText();
  console.log('PAGE TEXT:', textContent);

});
