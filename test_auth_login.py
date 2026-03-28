from playwright.sync_api import sync_playwright

def login(page):
    page.goto("http://localhost:3000/")
    page.wait_for_selector("text=Log in")
    page.click("text=Log in")
    page.wait_for_selector("input[type='email']")
    page.fill("input[type='email']", "mindflow@user.com")
    page.fill("input[type='password']", "Test@1234")
    page.click("button:has-text('Sign In')")
    page.wait_for_selector("text=English Zone", timeout=15000)
    page.click("text=English Zone")
    page.wait_for_selector("text=Synonyms & Antonyms")
    page.click("text=Synonyms & Antonyms")
    page.wait_for_selector("text=Smart Flashcards")
    page.click("text=Smart Flashcards")
    page.wait_for_selector("text=Abandon")
    page.click("text=Abandon")
    page.wait_for_selector("text=Top Synonyms")
    page.click("text=Desert")
    page.screenshot(path="final_synonyms.png")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    c = b.new_context(viewport={'width': 1200, 'height': 800}, has_touch=True)
    page = c.new_page()
    try:
        login(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="final_error.png")
    finally:
        b.close()
