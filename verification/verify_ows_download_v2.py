import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Increase viewport size to ensure sidebar is rendered correctly if responsive
        browser = await p.chromium.launch(headless=True)
        # Use a large viewport to prevent responsive hiding of elements (though the menu is always visible)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        # 1. Start at Home
        print("Navigating to Home...")
        await page.goto("http://localhost:3000/")

        # 2. Click "Start Exploring" (LandingPage)
        print("Clicking Start Exploring...")
        # LandingPage.tsx: get_by_label("Start Exploring") logic from memory
        start_btn = page.locator("button:has-text('Start Exploring')") # Fallback to text if label missing
        if await start_btn.count() == 0:
             start_btn = page.get_by_role("button", name="Start Exploring")

        await start_btn.click()

        # 3. Click "English Zone" (Dashboard)
        print("Clicking English Zone...")
        # Dashboard.tsx: "English Zone" text in h3
        await page.wait_for_selector("text=English Zone", timeout=10000)
        await page.get_by_text("English Zone").click()

        # 4. Click "Vocab Quiz" (EnglishQuizHome)
        print("Clicking Vocab Quiz...")
        # EnglishQuizHome.tsx: "Vocab Quiz" text in h3
        await page.wait_for_selector("text=Vocab Quiz", timeout=10000)
        await page.get_by_text("Vocab Quiz").click()

        # 5. Click "One-word Substitution" (VocabQuizHome)
        print("Clicking One-word Substitution...")
        # VocabQuizHome.tsx: "One-word Substitution" text in h3
        await page.wait_for_selector("text=One-word Substitution", timeout=10000)
        await page.get_by_text("One-word Substitution").click()

        # 6. Select "A" Filter (OWSConfig)
        print("Selecting Filter 'A'...")
        # OWSConfig.tsx: Button with text "A"
        await page.wait_for_selector("text=One Word Substitution", timeout=60000) # Wait for page load

        # The filter buttons are simple <button>{letter}</button>.
        # We need to target the button containing exactly "A".
        letter_a = page.get_by_role("button", name="A", exact=True)
        await letter_a.wait_for(state="visible", timeout=10000)
        await letter_a.click()

        # 7. Click "Start Flashcards" (OWSConfig)
        print("Starting Flashcards...")
        # OWSConfig.tsx: Button text starts with "Start Flashcards"
        start_flashcards_btn = page.locator("button:has-text('Start Flashcards')")
        await start_flashcards_btn.wait_for(state="visible")
        await start_flashcards_btn.click()

        # 8. Open Side Menu (OWSSession)
        print("Opening Side Menu...")
        # OWSSession.tsx: aria-label="Open Map"
        # Wait for session to load
        await page.wait_for_timeout(3000)

        menu_btn = page.get_by_label("Open Map")
        await menu_btn.wait_for(state="visible", timeout=10000)
        await menu_btn.click()

        # 9. Click Download (OWSNavigationPanel)
        print("Clicking Download...")
        # OWSNavigationPanel.tsx: title="Download Flashcards"
        download_btn = page.locator("button[title='Download Flashcards']").first
        await download_btn.wait_for(state="visible", timeout=10000)
        await download_btn.click()

        # 10. Verify Modal
        print("Verifying Modal...")
        await page.wait_for_selector("text=Download Options", timeout=5000)

        # Check for JSON button
        json_btn = page.get_by_text("Download JSON")
        if await json_btn.count() > 0:
            print("SUCCESS: 'Download JSON' button found.")
            await page.screenshot(path="verification/ows_download_modal.png")
        else:
            print("FAILURE: 'Download JSON' button NOT found.")
            await page.screenshot(path="verification/failed_final.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
