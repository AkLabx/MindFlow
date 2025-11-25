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

        # Wait for page load
        await page.wait_for_timeout(2000)

        # Try to find "Customize Your Session" or navigate to it
        try:
            # Check if we are on landing page and need to click something
            # Or if we are already on Config page
            # Look for "Quick 25 Easy" button
            quick_start_btn = page.locator("text=Quick 25 Easy")
            if await quick_start_btn.count() > 0:
                print("Found Quick Start button immediately.")
                await quick_start_btn.click()
            else:
                # Maybe we are on Landing page? Look for a "Start" button or "Create" in footer
                print("Quick start not found, looking for Create nav...")
                create_nav = page.locator("text=Create") # The footer nav item
                if await create_nav.count() > 0:
                    await create_nav.click()
                    await page.wait_for_timeout(1000)
                    await page.locator("text=Quick 25 Easy").click()
                else:
                    print("Could not find navigation controls. Dumping page text.")
                    print(await page.inner_text("body"))
                    await browser.close()
                    return

            print("Clicked Quick Start. Waiting for quiz to load...")
            # Wait for quiz question to appear
            await page.wait_for_selector("text=Question 1", timeout=15000)
            print("Quiz loaded.")

            # Test Pause
            print("Testing Pause...")
            pause_btn = page.locator("button:has-text('Pause')")
            # If "Pause" text is hidden (mobile), look for button with Pause icon or try clicking the button in header
            if await pause_btn.count() == 0:
                 # Fallback for icon-only button if strictly mobile view, but we set 1280 width.
                 # Maybe it's just an icon.
                 # The code has <span className="hidden sm:inline">Pause</span>
                 # So it should be visible.
                 print("Pause button text not found, looking for button with icon...")
                 # This is harder to select by icon class in playwright without specific test id.
                 # Let's hope the text is there.
                 pass

            await pause_btn.click()
            print("Clicked Pause.")

            # Verify Overlay
            await page.wait_for_selector("text=Session Paused", timeout=2000)
            print("Pause overlay visible.")

            # Test Resume
            print("Testing Resume...")
            resume_btn = page.locator("button:has-text('Resume Quiz')")
            await resume_btn.click()

            # Verify Overlay Gone
            await page.wait_for_selector("text=Session Paused", state="hidden", timeout=2000)
            print("Resume successful.")

            # Test Persistence
            print("Testing Persistence (Reload with Pause)...")
            await pause_btn.click()
            await page.wait_for_selector("text=Session Paused")

            print("Reloading page...")
            await page.reload()
            await page.wait_for_timeout(2000)

            # Should still be paused
            if await page.locator("text=Session Paused").is_visible():
                print("SUCCESS: Session remains paused after reload.")
            else:
                print("FAILURE: Session did not remain paused.")
                # print(await page.inner_text("body"))

        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path="error_v4.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
