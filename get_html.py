from playwright.sync_api import sync_playwright

def run(page):
    page.goto("http://localhost:3000/")
    page.wait_for_selector("text=Log in")
    page.click("text=Log in")
    page.wait_for_selector("input[type='email']")
    page.fill("input[type='email']", "mindflow@user.com")
    page.fill("input[type='password']", "Test@1234")
    page.click("button:has-text('Sign In')")
    page.wait_for_timeout(5000)
    print(page.content())

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    c = b.new_context(viewport={'width': 1200, 'height': 800}, has_touch=True)
    page = c.new_page()
    try:
        run(page)
    finally:
        b.close()
