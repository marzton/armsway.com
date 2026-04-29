import os
from playwright.sync_api import sync_playwright

def test_html5_email_validation():
    """Verify that HTML5 validation correctly flags invalid email formats."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        base_url = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")

        page.goto(f"{base_url}/index.html")
        email_input = page.locator('input[name="email"]')

        # Invalid email format
        invalid_email = "invalid-email"
        email_input.fill(invalid_email)
        is_valid = email_input.evaluate("el => el.checkValidity()")
        assert not is_valid, f"Email '{invalid_email}' should be invalid"

        # Valid email format
        valid_email = "test@example.com"
        email_input.fill(valid_email)
        is_valid = email_input.evaluate("el => el.checkValidity()")
        assert is_valid, f"Email '{valid_email}' should be valid"

        browser.close()

def test_form_submission_blocked_with_invalid_email():
    """Verify that form submission is prevented when the email is invalid."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        base_url = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")

        page.goto(f"{base_url}/index.html")

        # Get the form action URL
        form = page.locator('form.inquiry-form')
        target_url = form.evaluate("el => el.action")

        request_sent = False

        def handle_request(request):
            nonlocal request_sent
            if request.url == target_url:
                request_sent = True

        page.on("request", handle_request)

        # Fill form with invalid email
        page.fill('input[name="name"]', 'Test User')
        page.fill('input[name="email"]', 'not-an-email')
        page.fill('textarea[name="message"]', 'Test message content')

        # Attempt to submit
        page.click('button[type="submit"]')

        # Wait to ensure no request is sent
        page.wait_for_timeout(500)

        assert not request_sent, "Form should not be submitted with an invalid email"

        browser.close()

if __name__ == "__main__":
    test_html5_email_validation()
    test_form_submission_blocked_with_invalid_email()
    print("All tests passed!")
