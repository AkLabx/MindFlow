import asyncio
import json
from playwright.async_api import async_playwright, Route, Request

MOCK_QUESTION = {
    "v1_id": "TEST_Q1",
    "subject": "Test Subject",
    "topic": "Test Topic",
    "subTopic": "Test SubTopic",
    "examName": "Test Exam",
    "examYear": 2024,
    "examDateShift": "Shift 1",
    "difficulty": "Easy",
    "questionType": "MCQ",
    "tags": ["test"],
    "question": "What is 2 + 2?",
    "question_hi": "2 + 2 kya hai?",
    "options": ["3", "4", "5", "6"],
    "options_hi": ["3", "4", "5", "6"],
    "correct": "4",
    "explanation": { "text": "2 plus 2 is 4." }
}

async def handle_questions_route(route: Route, request: Request):
    if request.method == "HEAD":
        await route.fulfill(status=200, headers={"Content-Range": "0-0/1"})
        return

    response_body = json.dumps([MOCK_QUESTION])
    await route.fulfill(
        status=200,
        content_type="application/json",
        body=response_body,
        headers={"Content-Range": "0-0/1"}
    )

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        await context.route("**/rest/v1/questions*", handle_questions_route)

        page = await context.new_page()

        # Capture console
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))

        print("Navigating to home...")
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(2000)

        async def click_if_visible(selector, name):
            if await page.locator(selector).is_visible():
                print(f"Clicking {name}...")
                await page.locator(selector).click()
                await page.wait_for_timeout(1000)
                return True
            return False

        if await click_if_visible("button[aria-label='Start Exploring']", "Landing Start Button"):
             print("Passed Landing Page.")

        if await page.locator("text=Master Your Knowledge").is_visible():
             print("On Dashboard.")
             await page.locator("button:has-text('Start Quiz')").first.click()
             await page.wait_for_timeout(1000)

        if await page.locator("text=Customize Your Session").is_visible():
             print("On Config Page.")
             await page.locator("text=Quick 25 Easy").click()
             print("Clicked Quick Start.")

        print("Waiting for Quiz to load...")
        try:
            await page.wait_for_selector("text=What is 2 + 2?", timeout=10000)
            print("Quiz loaded with Mock Data.")
        except Exception as e:
            print(f"Quiz did not load: {e}")
            await browser.close()
            return

        print("Testing Pause...")
        pause_btn = page.locator("[data-testid='pause-button']")
        await pause_btn.click()
        print("Clicked Pause.")

        await page.wait_for_selector("text=Quiz Paused", timeout=3000)
        print("Pause overlay visible.")

        print("Testing Persistence...")

        # Check Local Storage
        storage = await page.evaluate("() => localStorage.getItem('mindflow_quiz_session_v1')")
        print(f"Local Storage before reload: {storage[:100]}..." if storage else "Local Storage is EMPTY")

        print("Reloading page...")
        await page.reload()
        await page.wait_for_timeout(3000)

        # Check Local Storage after reload
        storage_after = await page.evaluate("() => localStorage.getItem('mindflow_quiz_session_v1')")
        print(f"Local Storage after reload: {storage_after[:100]}..." if storage_after else "Local Storage is EMPTY after reload")

        if await page.locator("text=Quiz Paused").is_visible():
            print("SUCCESS: Session remains paused after reload.")
        else:
            print("FAILURE: Session did not remain paused.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
