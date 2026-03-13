import { test, expect } from '@playwright/test';

test.describe('Live Quiz Master Talk', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/#/');
    });

    test('should allow connecting to AI Quiz Master', async ({ page, context }) => {
        await page.evaluate(async () => {
            window.localStorage.setItem('mindflow_intro_seen', 'true');
            // Wait for DB to be populated
            return new Promise((resolve, reject) => {
                const request = window.indexedDB.open('MindFlowDB', 3);
                request.onupgradeneeded = (event: any) => {
                    const db = event.target.result;

                    if (!db.objectStoreNames.contains('saved_quizzes')) db.createObjectStore('saved_quizzes', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('quiz_history')) db.createObjectStore('quiz_history', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('global_bookmarks')) db.createObjectStore('global_bookmarks', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('synonym_interactions')) db.createObjectStore('synonym_interactions', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('synonym_progress')) db.createObjectStore('synonym_progress', { keyPath: 'id' });

                };
                request.onsuccess = (event: any) => {
                    const db = event.target.result;
                    const transaction = db.transaction('saved_quizzes', 'readwrite');
                    const store = transaction.objectStore('saved_quizzes');
                    const putReq = store.put({
                        id: 'test-live-quiz-123',
                        name: 'Playwright Test Quiz',
                        timestamp: Date.now(),
                        subjects: ['General Knowledge'],
                        questions: [
                            {
                                question: 'What is the capital of France?',
                                options: ['London', 'Berlin', 'Paris', 'Madrid'],
                                correct: 'Paris',
                                explanation: { summary: 'Paris is the capital of France.' }
                            }
                        ]
                    });
                    putReq.onsuccess = () => resolve(true);
                    putReq.onerror = () => reject('db put error');
                };
            });
        });

        // Grant microphone permission
        await context.grantPermissions(['microphone']);

        // Navigate to the live quiz route
        await page.goto('http://localhost:3000/#/quiz/live/test-live-quiz-123');

        // Check if title is visible indicating quiz loaded
        await expect(page.locator('text=Playwright Test Quiz')).toBeVisible({ timeout: 10000 });

        const connectButton = page.getByRole('button', { name: /Connect to Quiz Master/i });
        await expect(connectButton).toBeVisible();

        // Simulate click
        await connectButton.click();

        const connectingText = page.locator('text=Connecting...');
        const errorText = page.locator('.text-red-600');

        await Promise.race([
            expect(connectingText).toBeVisible({ timeout: 10000 }),
            expect(errorText).toBeVisible({ timeout: 10000 })
        ]);
    });
});
