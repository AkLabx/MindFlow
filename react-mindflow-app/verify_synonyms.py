import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            has_touch=False,
            is_mobile=False
        )
        page = await context.new_page()

        print("Navigating to local server...")
        await page.goto("http://localhost:4173/MindFlow/#/")

        print("Clicking Log in...")
        await page.get_by_text('Log in', exact=True).click()

        print("Filling credentials...")
        await page.locator('input[type="email"]').fill('mindflow@user.com')
        await page.locator('input[type="password"]').fill('Test@1234')

        print("Submitting login form...")
        await page.locator('form').get_by_role('button', name='Sign in').click()

        print("Waiting for dashboard to load...")
        try:
            await page.wait_for_url("**/#/dashboard", timeout=10000)
        except Exception as e:
            print("Did not reach dashboard. Current url:", page.url)
            await page.screenshot(path="verification/synonyms_config_debug_login.png")
            raise e

        print("Navigating to Synonyms Config...")
        await page.goto("http://localhost:4173/MindFlow/#/synonyms/config")

        # Wait for the network calls to complete (especially the plugin load)
        await asyncio.sleep(3)

        print("Looking for Synonyms Master heading...")
        heading = page.get_by_role("heading", name="Synonyms Master")
        try:
            await heading.wait_for(state="visible", timeout=10000)
            print("Taking final screenshot...")
            await page.screenshot(path="verification/synonyms_config_success.png")
            print("Verification completed successfully!")
        except Exception as e:
            print("Heading not found. Current url:", page.url)
            await page.screenshot(path="verification/synonyms_config_debug_final.png")
            raise e

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
