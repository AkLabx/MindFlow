import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:3000/")

        # Click Start Exploring
        await page.get_by_label("Start Exploring").click()
        await page.wait_for_url("**/dashboard")
        print("Reached Dashboard")

        # Click Analytics explicitly by heading
        print("Clicking Analytics card...")
        # Get the card that contains the h3 "Analytics"
        await page.locator("div").filter(has=page.locator("h3:text-is('Analytics')")).first.click()

        await page.wait_for_selector("text=No Data Yet", timeout=5000)
        print("Successfully reached Analytics empty state!")
        await page.screenshot(path="analytics_empty.png")

        # Go back to Dashboard
        print("Going back to Dashboard...")
        await page.locator("text=Back to Dashboard").click()
        await page.wait_for_url("**/dashboard")

        # Click Bookmarks explicitly by heading
        print("Clicking Bookmarks card...")
        await page.locator("div").filter(has=page.locator("h3:text-is('Bookmarks')")).first.click()

        # Wait a moment for rendering and take screenshot
        await page.wait_for_timeout(2000)
        await page.screenshot(path="bookmarks_empty.png")
        print("Successfully reached Bookmarks page!")

        await browser.close()

asyncio.run(run())
