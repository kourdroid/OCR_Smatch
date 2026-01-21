from playwright.sync_api import Page, expect, sync_playwright
import time

def test_document_review_form(page: Page):
    # 1. Arrange: Go to the test page.
    page.goto("http://localhost:3000/palette-test")

    # 2. Verify accessibility fix
    # Before the fix, this would fail or require id matching.
    # Now it should work seamlessly.
    print("Verifying accessibility...")
    expect(page.get_by_label("Document Number")).to_be_visible()
    expect(page.get_by_label("Amount")).to_be_visible()
    print("Accessibility verification passed!")

    # 3. Setup route interception to hang the webhook call
    def handle_route(route):
        print("Intercepted webhook call, delaying...")
        time.sleep(1) # Delay to keep it in loading state
        route.fulfill(status=200, body='{"success":true}')

    # Intercept the webhook call
    page.route("**/webhook", handle_route)

    # 4. Act: Click approve
    print("Clicking Approve & Save...")
    save_button = page.get_by_role("button", name="Approve & Save")
    save_button.click()

    # 5. Verify loading state
    print("Verifying loading state...")
    expect(page.get_by_role("button", name="Saving...")).to_be_visible()

    # 6. Take screenshot of the loading state
    print("Taking screenshot...")
    page.screenshot(path="/home/jules/verification/verification.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_document_review_form(page)
      print("Test passed!")
    except Exception as e:
      print(f"Test failed: {e}")
      # Take screenshot on failure too if possible
      try:
        page.screenshot(path="/home/jules/verification/failure.png")
      except:
        pass
    finally:
      browser.close()
