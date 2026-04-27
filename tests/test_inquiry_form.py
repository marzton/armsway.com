from playwright.sync_api import sync_playwright

def test_inquiry_form_submission():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Target URL for form submission in the NEW public/index.html
        target_url = "http://localhost:8000/api/contact"

        # Intercept the POST request and mock response
        page.route(target_url, lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"ok": true}'
        ))

        # Navigate to the local server
        page.goto("http://localhost:8000/index.html")

        # Fill out the form fields
        page.fill('input[name="name"]', 'Jane Doe')
        page.fill('input[name="email"]', 'jane@example.com')
        page.fill('input[name="company"]', 'General Hospital')
        page.select_option('select[name="inquiry"]', 'strategy-call')
        page.fill('textarea[name="message"]', 'Requesting a quote for 500 sleeves.')

        # Expect a request to be sent when clicking submit
        with page.expect_request(lambda request: request.url == target_url and request.method == "POST") as request_info:
            page.click('button[type="submit"]')

        request = request_info.value
        post_data = request.post_data

        print(f"Post data: {post_data}")

        # Form data is multipart/form-data from FormData
        assert "Jane Doe" in post_data
        assert "jane@example.com" in post_data
        assert "General Hospital" in post_data
        assert "Requesting a quote for 500 sleeves." in post_data

        print("Test passed!")
        browser.close()

if __name__ == "__main__":
    test_inquiry_form_submission()
