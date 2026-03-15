from playwright.sync_api import sync_playwright, expect
import time
import os

def run():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        # Simulate mobile device for bottom sheet testing
        context = browser.new_context(
            viewport={'width': 412, 'height': 915},
            user_agent='Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
            has_touch=True
        )
        page = context.new_page()

        # Set dark mode
        page.add_init_script("localStorage.setItem('mindflow_settings_v1_darkMode', 'true'); document.documentElement.classList.add('dark');")

        # Navigate to Chat page
        print("Navigating to chat page...")
        page.goto("http://localhost:4173/MindFlow/#/ai/chat")

        # Wait for page load
        page.wait_for_selector('text="How can I help you learn today?"', timeout=10000)

        # 1. Take screenshot of initial state (empty input, mic icon visible)
        os.makedirs('/home/jules/verification', exist_ok=True)
        page.screenshot(path='/home/jules/verification/1_initial_state.png')
        print("Initial state screenshot saved.")

        # 2. Type text and verify Mic changes to Send
        print("Typing text to test dynamic button...")
        textarea = page.locator('textarea[placeholder="Ask Mindflow"]')
        textarea.fill("Hello, this is a test message.")

        # Wait a moment for React state to update UI
        time.sleep(1)
        page.screenshot(path='/home/jules/verification/2_text_entered_send_visible.png')
        print("Text entered screenshot saved.")

        # 3. Open Model Switcher Bottom Sheet
        print("Opening model switcher...")
        model_btn = page.locator('button:has-text("Fast")').first
        if model_btn.is_visible():
            model_btn.click()
            time.sleep(1) # wait for animation
            page.screenshot(path='/home/jules/verification/3_model_switcher_open.png')
            print("Model switcher screenshot saved.")

            # Close it by clicking backdrop
            page.mouse.click(10, 10)
            time.sleep(1)
        else:
            print("Model button not found")

        # 4. Send message to see AI bubble and stop button
        print("Sending message...")
        send_btn = page.locator('button[title="Send message"]')
        send_btn.click()

        # Immediately capture generating state
        time.sleep(0.5)
        page.screenshot(path='/home/jules/verification/4_generating_state.png')
        print("Generating state screenshot saved.")

        browser.close()

if __name__ == '__main__':
    run()
