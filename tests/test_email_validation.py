from playwright.sync_api import sync_playwright
import sys

def test_email_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the local server
        try:
            page.goto("http://localhost:8000/index.html")
        except Exception as e:
            print(f"Error: Could not connect to local server. Make sure it's running. {e}")
            sys.exit(1)

        email_input = page.locator('input[name="email"]')

        # Test case: Invalid email format
        invalid_email = "invalid-email"
        email_input.fill(invalid_email)

        # Check if the input is valid according to HTML5 validation
        is_valid = email_input.evaluate("el => el.checkValidity()")
        print(f"Is '{invalid_email}' valid? {is_valid}")

        if is_valid:
            print("FAILED: Invalid email was accepted by HTML5 validation.")
            browser.close()
            sys.exit(1)
        else:
            print("PASSED: Invalid email was rejected by HTML5 validation.")

        # Test case: Valid email format
        valid_email = "test@example.com"
        email_input.fill(valid_email)
        is_valid = email_input.evaluate("el => el.checkValidity()")
        print(f"Is '{valid_email}' valid? {is_valid}")

        if not is_valid:
            print("FAILED: Valid email was rejected by HTML5 validation.")
            browser.close()
            sys.exit(1)
        else:
            print("PASSED: Valid email was accepted by HTML5 validation.")

        # Verify form submission is prevented with invalid email
        email_input.fill(invalid_email)

        # We try to click submit and see if any request is sent.
        # Since we are using HTML5 validation, the browser should block the request.

        target_url = "https://armsway.com-private.goldshore.workers.dev/inquiry"
        request_sent = False

        def handle_request(request):
            nonlocal request_sent
            if request.url == target_url:
                request_sent = True

        page.on("request", handle_request)

        # Fill other required fields
        page.fill('input[name="name"]', 'Test User')
        page.fill('textarea[name="message"]', 'Test Message')

        # Click submit
        page.click('button[type="submit"]')

        # Wait a bit to see if a request is triggered
        page.wait_for_timeout(1000)

        if request_sent:
            print("FAILED: Form was submitted despite invalid email.")
            browser.close()
            sys.exit(1)
        else:
            print("PASSED: Form submission was blocked for invalid email.")

        print("All email validation tests passed!")
        browser.close()

if __name__ == "__main__":
    test_email_validation()
