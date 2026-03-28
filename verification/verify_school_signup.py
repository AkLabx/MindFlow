from playwright.sync_api import sync_playwright, expect
import time
import os

def test_school_signup(page):
    # Mock settings store to simulate a brand new school intent signup
    page.add_init_script("""
        localStorage.setItem('mindflow_target_audience_intent', 'school');
        localStorage.setItem('mindflow_is_signup', 'true');
    """)

    # Mock the Supabase Client to trigger onAuthStateChange
    # This is tricky because Supabase handles the actual OAuth flow and sets its own localstorage
    # A simpler way to test the fix is to see if we can trigger the audience intent consumption
    # But since it relies on the Google Auth callback, let's just test that the onboarding screen stays
    # and doesn't redirect if we are a school user.

    # Actually, we can just load the site and manually trigger the AuthContext logic via a mock event
    # However, since Vite serves the built output, and we need to simulate the auth redirect,
    # let's set a fake token in storage that the Supabase client might pick up, or just set targetAudience to school

    # We will inject the target audience state so the layout renders SchoolLayout
    page.add_init_script("""
        localStorage.setItem('mindflow-settings', JSON.stringify({
            state: {
                targetAudience: 'school',
                schoolOnboardingSeen: false
            },
            version: 1
        }));
    """)

    page.goto("http://localhost:4173/MindFlow/")

    # Wait for the app to load
    page.wait_for_timeout(2000)

    # The URL should become /#/school/dashboard but show the onboarding since schoolOnboardingSeen is false
    page.screenshot(path="verification/school_onboarding_check.png")

    print("Screenshot saved to verification/school_onboarding_check.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_school_signup(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
