from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch()
    # Emulate a mobile device (Pixel 8 approx)
    context = browser.new_context(
        viewport={'width': 390, 'height': 844},
        user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.193 Mobile Safari/537.36'
    )

    page = context.new_page()

    try:
        page.goto('http://localhost:3005', timeout=15000)
        time.sleep(2)  # Wait for load

        if page.locator('input[type="email"]').is_visible():
            page.fill('input[type="email"]', 'mindflow@user.com')
            page.fill('input[type="password"]', 'Test@1234')
            page.click('button[type="submit"]')
            time.sleep(3)

        page.goto('http://localhost:3005/#/english?tab=vocabidiom')
        time.sleep(3)

        page.screenshot(path="english_hub_mobile_view.png")
        print("Screenshot captured: english_hub_mobile_view.png")

        # Test tab click to verify
        page.click('text="OWS"')
        time.sleep(1)
        page.screenshot(path="english_hub_ows_tab.png")
        print("Screenshot captured: english_hub_ows_tab.png")

    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
