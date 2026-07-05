import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(err.message))

        print("Testing frontend route /#/mcqs")
        await page.goto("http://localhost:3001/#/mcqs")
        await page.wait_for_timeout(2000)

        print("Testing admin route /#/admin/test-series")
        await page.goto("http://localhost:3001/#/admin/test-series")
        await page.wait_for_timeout(2000)

        print("Console errors found:", console_errors)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
