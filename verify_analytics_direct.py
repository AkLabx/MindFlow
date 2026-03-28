import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        print("Navigating directly to analytics...")
        await page.goto("http://localhost:3000/#/quiz/analytics")

        await page.wait_for_timeout(2000)
        await page.screenshot(path="analytics_direct.png")
        print("Captured analytics_direct.png")

        await browser.close()

asyncio.run(run())
