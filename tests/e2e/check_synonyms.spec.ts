import { test, expect } from '@playwright/test';

test('verify synonyms feature', async ({ page }) => {
  await page.goto('http://localhost:4173/MindFlow/#/vocab');
  await page.waitForTimeout(1000);

  // Look for the Synonyms & Antonyms Master card
  const isSynonymsPresent = await page.locator('text=Synonyms & Antonyms Master').isVisible();
  console.log('Synonyms Card Present in Vocab Home:', isSynonymsPresent);

  if (isSynonymsPresent) {
    await page.getByText('Synonyms & Antonyms Master').click();
    await page.waitForTimeout(1000);
    console.log('Current URL after click:', page.url());
  }
});
