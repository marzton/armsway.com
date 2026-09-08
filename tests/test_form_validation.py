from playwright.sync_api import sync_playwright

def test_form_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        target = "http://localhost:8000/api/contact"
        page.route(target, lambda route: route.fulfill(status=200, content_type="application/json", body='{"ok":true}'))
        page.goto("http://localhost:8000/index.html")
        page.fill('input[name="email"]', 'test@example.com')
        page.fill('textarea[name="message"]', 'A clinical evaluation inquiry of sufficient length.')
        assert not page.locator('form').evaluate("el => el.checkValidity()")
        page.fill('input[name="name"]', 'Test User')
        page.select_option('select[name="inquiry"]', 'strategy-call')
        with page.expect_request(lambda request: request.url == target and request.method == "POST"):
            page.click('button[type="submit"]')
        page.wait_for_function("document.getElementById('formNotice').textContent.includes('Intake received')")
        browser.close()

if __name__ == "__main__":
    test_form_validation()
