from playwright.sync_api import sync_playwright

def test_subject_topic_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to login
        page.goto('http://localhost:3000/')

        # Login
        page.fill('input[type="email"]', 'mindflow@user.com')
        page.fill('input[type="password"]', 'Test@1234')
        page.click('button[type="submit"]')

        # Wait for dashboard to load
        page.wait_for_selector('text=Dashboard', timeout=10000)

        # Navigate to a subject page (e.g. Geography if it exists, or just direct route)
        page.goto('http://localhost:3000/#/subject/Geography')

        # Wait to ensure it doesn't crash on "metadata not found"
        page.wait_for_timeout(3000)

        page.screenshot(path='subject_page.png')
        print("Screenshot saved to subject_page.png")

        browser.close()

if __name__ == '__main__':
    test_subject_topic_page()
