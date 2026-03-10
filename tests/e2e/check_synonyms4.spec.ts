import { test, expect } from '@playwright/test';

test('verify synonyms feature', async ({ page }) => {
  await page.goto('http://localhost:3000/#/synonyms/config');
  await page.waitForTimeout(2000);

  const textContent = await page.locator('body').innerText();
  console.log('CONFIG TEXT:', textContent);

  await page.getByText('Start Session').click();
  await page.waitForTimeout(2000);

  const flashcardText = await page.locator('body').innerText();
  console.log('FLASHCARD TEXT:', flashcardText);
});
