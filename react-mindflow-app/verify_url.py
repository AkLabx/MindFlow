import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto("http://localhost:3000/")
        await page.get_by_label("Start Exploring").click()
        await page.wait_for_url("**/dashboard")

        print(f"URL before click: {page.url}")

        # We need to click the exact card
        # Using a more precise locator
        await page.locator("h3:text-is('Analytics')").click()

        await page.wait_for_timeout(1000)
        print(f"URL after click: {page.url}")

        await browser.close()

asyncio.run(run())
