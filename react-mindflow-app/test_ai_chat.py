from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1280, 'height': 720},
        has_touch=True
    )
    page = context.new_page()

    page.goto("http://localhost:4173/MindFlow/")
    page.wait_for_timeout(1000)

    # Go to AI
    page.goto("http://localhost:4173/MindFlow/#/ai/chat")
    page.wait_for_timeout(1000)

    # Take screenshot to verify quota and header UI
    page.screenshot(path="verification_ai_chat2.png", full_page=True)

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
