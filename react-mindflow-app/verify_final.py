import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating to app...")
        await page.goto("http://localhost:3000/")
        await page.get_by_label("Start Exploring").click()
        await page.wait_for_url("**/dashboard")
        print("Reached Dashboard")

        # Take a screenshot of the Dashboard showing our new cards
        await page.screenshot(path="verification_dashboard.png")

        # Click Analytics explicitly by targeting the text
        print("Clicking Analytics card...")
        await page.locator("h3:text-is('Analytics')").click()

        # Wait for the "No Data Yet" heading
        await page.wait_for_selector("h2:text-is('No Data Yet')")
        print("Successfully reached Analytics empty state!")
        await page.screenshot(path="verification_analytics.png")

        # Go back to Dashboard
        print("Going back to Dashboard...")
        await page.locator("button:has-text('Back to Dashboard')").click()
        await page.wait_for_url("**/dashboard")

        # Click Bookmarks explicitly
        print("Clicking Bookmarks card...")
        await page.locator("h3:text-is('Bookmarks')").click()

        # Wait for "No Bookmarks Yet"
        await page.wait_for_selector("h2:has-text('No Bookmarks')")
        print("Successfully reached Bookmarks empty state!")
        await page.screenshot(path="verification_bookmarks.png")

        await browser.close()

asyncio.run(run())
