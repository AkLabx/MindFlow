import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        # Increase viewport size to ensure sidebar is rendered correctly if responsive
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        # Navigate directly to OWS config
        print("Navigating to OWS Config...")
        await page.goto("http://localhost:3000/#/ows/config")

        # Wait for title
        print("Waiting for OWS Config load...")
        await page.wait_for_selector("text=One Word Substitution", timeout=60000)

        # Filter by "A" - precise selector for the button text "A"
        print("Selecting filter 'A'...")
        letter_a = page.get_by_role("button", name="A", exact=True)
        await letter_a.wait_for(state="visible", timeout=30000)
        await letter_a.click()

        # Click Start Flashcards button (it contains dynamic text like "Start Flashcards (52)")
        print("Starting session...")
        start_btn = page.locator("button:has-text('Start Flashcards')")
        await start_btn.wait_for(state="visible", timeout=10000)
        await start_btn.click()

        # Wait for Session to load
        print("Waiting for session...")
        await page.wait_for_timeout(3000)

        # Find Menu button (Hamburger)
        # In OWSSession.tsx: aria-label="Open Map"
        print("Opening menu...")
        menu_btn = page.get_by_label("Open Map")
        if await menu_btn.count() == 0:
            # Fallback to selector
            menu_btn = page.locator("button:has(svg.lucide-menu)")

        await menu_btn.wait_for(state="visible", timeout=30000)
        await menu_btn.click()

        # Wait for sidebar animation
        print("Waiting for sidebar...")
        await page.wait_for_timeout(1000)

        # Check for sidebar content "Word Map"
        await page.wait_for_selector("text=Word Map", timeout=10000)

        # Click Download button in the sidebar
        # In OWSNavigationPanel.tsx: title="Download Flashcards"
        print("Clicking download...")
        download_btn = page.locator("button[title='Download Flashcards']").first
        await download_btn.wait_for(state="visible", timeout=10000)
        await download_btn.click()

        # Wait for Modal
        print("Waiting for modal...")
        await page.wait_for_selector("text=Download Options", timeout=10000)

        # Verify JSON button exists
        json_btn = page.get_by_text("Download JSON")
        if await json_btn.count() > 0:
            print("Found 'Download JSON' button.")
        else:
            print("ERROR: 'Download JSON' button not found.")
            await page.screenshot(path="verification/failed_final.png")
            await browser.close()
            return

        # Take screenshot
        await page.screenshot(path="verification/ows_download_modal.png")
        print("Screenshot saved to verification/ows_download_modal.png")
        print("SUCCESS: Download JSON option verified in OWS!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
