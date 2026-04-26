from playwright.sync_api import sync_playwright

def test_form_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        target_url = "https://armsway.com-private.goldshore.workers.dev/inquiry"
        page.route(target_url, lambda route: route.fulfill(
            status=200,
            content_type="text/plain",
            body="OK"
        ))

        page.goto("http://localhost:8000/index.html")

        # 1. Test Missing Name
        # Fill email and message, leave name empty
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('textarea[name="message"]', 'Test message')

        # Try to submit and ensure no request is sent
        request_sent = False
        def handle_request(request):
            nonlocal request_sent
            if request.url == target_url:
                request_sent = True

        page.on("request", handle_request)
        page.click('button[type="submit"]')
        page.wait_for_timeout(500) # Wait a bit to ensure no request is sent
        assert not request_sent, "Request sent even though Name is missing"

        # Verify name input is invalid
        is_valid = page.eval_on_selector('input[name="name"]', 'el => el.checkValidity()')
        assert not is_valid, "Name input should be invalid"

        # 2. Test Missing Email
        page.reload()
        page.fill('input[name="name"]', 'Test User')
        page.fill('textarea[name="message"]', 'Test message')
        request_sent = False
        page.click('button[type="submit"]')
        page.wait_for_timeout(500)
        assert not request_sent, "Request sent even though Email is missing"
        is_valid = page.eval_on_selector('input[name="email"]', 'el => el.checkValidity()')
        assert not is_valid, "Email input should be invalid"

        # 3. Test Invalid Email Format
        page.reload()
        page.fill('input[name="name"]', 'Test User')
        page.fill('input[name="email"]', 'invalid-email')
        page.fill('textarea[name="message"]', 'Test message')
        request_sent = False
        page.click('button[type="submit"]')
        page.wait_for_timeout(500)
        assert not request_sent, "Request sent even though Email format is invalid"
        is_valid = page.eval_on_selector('input[name="email"]', 'el => el.checkValidity()')
        assert not is_valid, "Email input should be invalid due to format"

        # 4. Test Missing Message
        page.reload()
        page.fill('input[name="name"]', 'Test User')
        page.fill('input[name="email"]', 'test@example.com')
        request_sent = False
        page.click('button[type="submit"]')
        page.wait_for_timeout(500)
        assert not request_sent, "Request sent even though Message is missing"
        is_valid = page.eval_on_selector('textarea[name="message"]', 'el => el.checkValidity()')
        assert not is_valid, "Message textarea should be invalid"

        # 5. Test All Valid (Sanity Check)
        page.reload()
        page.fill('input[name="name"]', 'Test User')
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('textarea[name="message"]', 'Test message')

        with page.expect_request(lambda request: request.url == target_url and request.method == "POST"):
            page.click('button[type="submit"]')

        print("All validation tests passed!")
        browser.close()

if __name__ == "__main__":
    test_form_validation()
