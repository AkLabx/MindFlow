import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800}
        )
        page = await context.new_page()

        print("Navigating to home...")
        await page.goto("http://localhost:3000")
        await page.wait_for_timeout(3000)

        # Helper to click if visible
        async def click_if_visible(selector, name):
            if await page.locator(selector).is_visible():
                print(f"Clicking {name}...")
                await page.locator(selector).click()
                await page.wait_for_timeout(1000)
                return True
            return False

        # 1. Check if we are on Landing Page
        # The button has aria-label="Start Exploring"
        if await click_if_visible("button[aria-label='Start Exploring']", "Landing Start Button"):
             print("Passed Landing Page.")

        # 2. Check if we are on Dashboard
        # Look for "Master Your Knowledge" or "Start Quiz" button
        if await page.locator("text=Master Your Knowledge").is_visible():
             print("On Dashboard.")
             # Click "Start Quiz" button
             # There is a button with text "Start Quiz"
             await page.locator("button:has-text('Start Quiz')").first.click()
             await page.wait_for_timeout(1000)

        # 3. Check if we are on Config Page (Customize Your Session)
        if await page.locator("text=Customize Your Session").is_visible():
             print("On Config Page.")
             # Click Quick 25 Easy
             await page.locator("text=Quick 25 Easy").click()
             print("Clicked Quick Start.")
        else:
             print("Not on Config Page. Dumping text...")
             print(await page.inner_text("body"))

        # 4. Wait for Quiz
        print("Waiting for Quiz to load...")
        try:
            await page.wait_for_selector("text=Question 1", timeout=15000)
            print("Quiz loaded.")
        except Exception:
            print("Quiz did not load. Screenshotting...")
            await page.screenshot(path="error_v5_quiz_load.png")
            await browser.close()
            return

        # 5. Test Pause
        print("Testing Pause...")
        # The pause button might have text "Pause" or just an icon.
        # In LearningSession.tsx: <span className="hidden sm:inline">Pause</span>
        # We are 1280px wide, so it should be visible.
        pause_btn = page.locator("button:has-text('Pause')")
        if not await pause_btn.is_visible():
             print("Pause button text not visible? Trying to find by icon or structure...")
             # Fallback: finding the button in the header (usually top right)
             # Let's assume text works for now.
             pass

        await pause_btn.click()
        print("Clicked Pause.")

        # Verify Overlay
        await page.wait_for_selector("text=Session Paused", timeout=3000)
        print("Pause overlay visible.")

        # Test Resume
        print("Testing Resume...")
        resume_btn = page.locator("button:has-text('Resume Quiz')")
        await resume_btn.click()

        # Verify Overlay Gone
        await page.wait_for_selector("text=Session Paused", state="hidden", timeout=3000)
        print("Resume successful.")

        # Test Persistence
        print("Testing Persistence...")
        await pause_btn.click()
        await page.wait_for_selector("text=Session Paused")

        print("Reloading page...")
        await page.reload()
        await page.wait_for_timeout(3000)

        # Should still be paused
        if await page.locator("text=Session Paused").is_visible():
            print("SUCCESS: Session remains paused after reload.")
        else:
            print("FAILURE: Session did not remain paused.")
            # Dump to help debug
            # print(await page.inner_text("body"))

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
