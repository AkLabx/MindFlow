
import { test, expect } from '@playwright/test';

// Mock response data
const MOCK_AI_RESPONSE = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          explanation: "This is a **mocked** explanation from the AI.",
          correct_answer: "Option B",
          interesting_facts: ["Fact 1: Verified", "Fact 2: Verified"],
          fun_fact: "This test is running in Playwright!"
        })
      }]
    }
  }]
};

test('AI Tutor button appears and opens explanation modal', async ({ page }) => {
  // 1. Mock the Google Gemini API call
  await page.route('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent*', async route => {
    console.log('Intercepted Gemini API call');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_AI_RESPONSE)
    });
  });

  // 2. Navigate to the app (assuming it's running on localhost:3000)
  await page.goto('http://localhost:3000');

  // 3. Start a quiz (Navigate flow: Landing -> Start -> Dashboard -> Custom Quiz -> Start)
  await page.getByRole('button', { name: 'Start Exploring' }).click();

  // Wait for dashboard
  await expect(page.getByText('Your Learning Journey')).toBeVisible();

  // Click "Custom Quiz"
  await page.getByText('Custom Quiz').click();

  // Wait for config screen and click "Start Quiz"
  await expect(page.getByText('Configure Your Quiz')).toBeVisible();
  await page.getByRole('button', { name: 'Start Quiz' }).click();

  // 4. Answer a question to make the AI button appear
  // (The button only appears if isAnswered is true)
  // Find the first option and click it
  const firstOption = page.locator('.p-4.rounded-xl.border-2').first();
  await firstOption.click();

  // 5. Verify "Ask AI Tutor" button appears
  const aiButton = page.getByRole('button', { name: 'Ask AI Tutor' });
  await expect(aiButton).toBeVisible();

  // 6. Click the AI button
  await aiButton.click();

  // 7. Verify Modal Content
  // Check header
  await expect(page.getByText('AI Explanation')).toBeVisible();

  // Check mocked explanation content
  await expect(page.getByText('This is a mocked explanation from the AI.')).toBeVisible();

  // Check facts
  await expect(page.getByText('Did You Know?')).toBeVisible();
  await expect(page.getByText('Fact 1: Verified')).toBeVisible();

  // Check fun fact
  await expect(page.getByText('Fun Fact')).toBeVisible();
  await expect(page.getByText('This test is running in Playwright!')).toBeVisible();

  // 8. Close the modal
  await page.locator('button').filter({ hasText: 'Ask AI Tutor' }).locator('..').getByRole('button').last().click(); // Close button is X icon

  // Or click outside/esc, but X button is explicit.
  // The close button is usually the X icon in the header.
  // Using a more robust selector for the close button:
  await page.locator('.fixed').getByRole('button').first().click(); // Assuming X is the first button in the fixed overlay?
  // Let's use the SVG selector or parent class to be safe if the above is flaky.
  // In the code: header contains h3 and a button with X.
  // await page.locator('div.fixed h3 + button').click();

  // Verify modal is gone
  await expect(page.getByText('AI Explanation')).toBeHidden();
});
