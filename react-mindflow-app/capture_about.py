from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:4173/MindFlow/#/about')
        page.wait_for_selector('text=Legal & Information', timeout=10000)
        page.wait_for_timeout(3000) # wait for animations
        page.screenshot(path='/home/jules/verification/about_us_final.png')

        page.goto('http://localhost:4173/MindFlow/#/about/developer-profile')
        page.wait_for_selector('text=Owner', timeout=10000)
        page.wait_for_timeout(3000)
        page.screenshot(path='/home/jules/verification/developer_profile_final.png')

        browser.close()

if __name__ == '__main__':
    run()
