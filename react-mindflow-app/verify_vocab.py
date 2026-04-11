import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto("http://localhost:4173/MindFlow/")

        await page.evaluate("localStorage.setItem('mindflow_intro_seen', 'true'); localStorage.setItem('mindflow_onboarding_seen', 'true'); localStorage.setItem('mindflow-auth', '{\"state\":{\"isAuthenticated\":true,\"user\":{\"id\":\"123\",\"email\":\"mindflow@user.com\",\"name\":\"Test User\"}}}');")
        await page.goto("http://localhost:4173/MindFlow/#/vocab")

        await page.wait_for_selector('text="Vocabulary Master"')
        await page.screenshot(path="/home/jules/verification/vocab_master.png")

        await page.evaluate("localStorage.setItem('mindflow_settings_v1_darkMode', 'true'); document.documentElement.classList.add('dark');")
        await page.reload()

        await page.wait_for_selector('text="Vocabulary Master"')
        await page.screenshot(path="/home/jules/verification/vocab_master_dark.png")

        await browser.close()

asyncio.run(run())
