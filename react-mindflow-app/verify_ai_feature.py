
import re
import json
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Log console messages
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

    # --- 1. Mock Gemini API ---
    def handle_gemini(route):
        print("Intercepted Gemini API call")
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({
                "candidates": [{
                    "content": {
                        "parts": [{
                            "text": json.dumps({
                                "explanation": "This is a **mocked** explanation from the AI.",
                                "correct_answer": "Option B",
                                "interesting_facts": ["Fact 1: Verified", "Fact 2: Verified"],
                                "fun_fact": "This test is running in Playwright!"
                            })
                        }]
                    }
                }]
            })
        )
    page.route("**/gemini-2.5-flash:generateContent*", handle_gemini)


    # --- 2. Mock Supabase DB Calls ---
    MOCK_QUESTION = {
        "v1_id": "MOCK_001",
        "subject": "Mock Subject",
        "topic": "Mock Topic",
        "subTopic": "Mock SubTopic",
        "examName": "Mock Exam",
        "examYear": 2024,
        "difficulty": "Medium",
        "questionType": "MCQ",
        "question": "What is the capital of France?",
        "options": ["London", "Paris", "Berlin", "Madrid"],
        "correct": "Paris",
        "tags": ["geo"],
        "explanation": { "text": "Paris is the capital." }
    }

    def handle_supabase(route):
        url = route.request.url
        method = route.request.method

        # HEAD request for count
        if method == "HEAD" and "questions" in url:
            route.fulfill(
                status=200,
                headers={"Content-Range": "0-10/10"} # Total 10 (fake)
            )
            return

        # GET request
        if method == "GET" and "questions" in url:
            # Metadata fetch or Full fetch
            # Just return the mock question list for any GET on 'questions'
            print(f"Intercepted Question Fetch: {url}")
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([MOCK_QUESTION])
            )
            return

        route.continue_()

    page.route("**/rest/v1/questions*", handle_supabase)


    # --- 3. Run Test Flow ---
    print("Navigating to http://localhost:3001")
    page.goto("http://localhost:3001")

    print("Clicking Start Exploring...")
    page.get_by_label("Start Exploring").click()

    print("Waiting for Dashboard...")
    expect(page.get_by_text("Master Your Knowledge")).to_be_visible()

    print("Clicking Create Quiz (Dashboard)...")
    page.get_by_role("button", name="Create Quiz").click()

    print("Configuring Quiz...")
    expect(page.get_by_text("Create New Quiz")).to_be_visible()

    print("Starting Quiz (Saving to DB)...")
    page.get_by_role("button", name=re.compile("Create Quiz")).click()

    print("Waiting for redirection to Saved Quizzes...")
    expect(page.get_by_text("Saved Quizzes")).to_be_visible()

    print("Clicking Start/Resume on the first quiz...")
    # Find the first "Start" or "Resume" button
    # The quiz card should be there.
    # Button text is "Start" or "Resume"
    page.get_by_role("button", name=re.compile("Start|Resume")).first.click()

    # Answer a question
    print("Answering Question...")

    # Try finding by text "Paris" to be sure
    try:
        page.get_by_text("Paris").click(timeout=10000)
    except Exception as e:
        print(f"Failed to find option 'Paris'. Error: {e}")
        # Print if we are on Learning Session
        if page.get_by_text("Learning Mode").is_visible():
             print("We are on Learning Mode, but can't find option.")
        raise

    # Verify AI Button
    print("Verifying AI Button...")
    ai_button = page.get_by_role("button", name="Ask AI Tutor")
    expect(ai_button).to_be_visible()

    # Click AI Button
    print("Clicking AI Button...")
    ai_button.click()

    # Verify Modal Content
    print("Verifying Modal Content...")
    expect(page.get_by_text("AI Explanation")).to_be_visible()
    expect(page.get_by_text("This is a mocked explanation from the AI.")).to_be_visible()
    expect(page.get_by_text("Fact 1: Verified")).to_be_visible()

    print("Verification Successful!")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
