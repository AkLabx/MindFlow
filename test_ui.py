import pytest
from playwright.sync_api import Page, expect

def test_dashboard_ui(page: Page):
    page.goto("http://localhost:4173/MindFlow/#/")
    page.evaluate("localStorage.setItem('mindflow_intro_seen', 'true'); localStorage.setItem('mindflow_onboarding_seen', 'true');")

    # We might need to click "Sign In" or mock it fully if we can't load the real dashboard easily
    # But usually the dashboard might be visible or we can see the changes in the layout.

    page.reload()
    page.wait_for_timeout(3000)

    page.set_viewport_size({"width": 375, "height": 812})
    page.screenshot(path="dashboard_new_ui.png")
