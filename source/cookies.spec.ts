import { test, expect } from "@playwright/test";

/**
 * Tests cookie setting and retrieval across frames
 *
 * This test does the following:
 * 1. Sets up a test environment with main frame from test.local and iframe from sub.test.local
 * 2. Intercepts requests to both domains and returns custom HTML that sets cookies
 * 3. Waits for both frames to signal that cookies have been set
 * 4. Retrieves all cookies via the Playwright context API
 * 5. Verifies that cookies from both domains are present and have the expected values
 */
test("should set and retrieve cookies from both frames", async ({page, context}) => {
    const mainFrameHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Main Frame</title>
      </head>
      <body>
        <h1>Main Frame</h1>
        <iframe src="https://sub.test.local/iframe.html" id="testFrame"></iframe>
        <script>
          document.cookie = "mainCookie=mainValue;path=/;Domain=.test.local;path=/;secure=true;";
          document.body.setAttribute('data-cookie-set', 'true');
        </script>
      </body>
    </html>
  `;

    const iframeHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Iframe</title>
      </head>
      <body>
        <h1>Iframe Content</h1>
        <script>
          document.cookie = "iframeCookie=iframeValue;Domain=.test.local;path=/;secure=true;";
          document.body.setAttribute('data-cookie-set', 'true');
        </script>
      </body>
    </html>
  `;

    await page.route("https://test.local/", route => {
        route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: mainFrameHtml
        });
    });

    await page.route("https://sub.test.local/iframe.html", route => {
        route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: iframeHtml,
        });
    });

    await page.goto("https://test.local/");
    await page.waitForSelector('body[data-cookie-set="true"]');

    const frameLocator = page.frameLocator('#testFrame');
    await frameLocator.locator('body[data-cookie-set="true"]').waitFor();

    const cookies = await context.cookies();
    expect(cookies.map(cookie => cookie.name)).toStrictEqual(["mainCookie", "iframeCookie"])
});