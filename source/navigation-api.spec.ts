import { test, expect } from "@playwright/test";

test.describe("Navigation API route change detection", () => {
  test("detects route changes using Navigation API", async ({ page }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Navigation API Test</title>
      </head>
      <body>
        <div id="logs"></div>
        <script>
          const logs = [];
          const logsElement = document.getElementById("logs");

          function log(message) {
            logs.push(message);
            logsElement.textContent = logs.join("\\n");
            console.log(message);
          }

          window.__routeChangeLogs = logs;

          log("navigation exists: " + (typeof window.navigation !== "undefined"));
          log("oncurrententrychange in navigation: " + ("oncurrententrychange" in (window.navigation || {})));

          window.navigation.addEventListener("currententrychange", () => {
            log("ROUTE_CHANGE: " + navigation.currentEntry.url);
          });

          log("Route change listener initialized");
        </script>
      </body>
      </html>
    `;

    await page.route("http://localhost:3000/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: htmlContent,
      });
    });

    await page.goto("http://localhost:3000/");

    await page.evaluate(() => {
      history.pushState({ page: 1 }, "", "/page1");
    });

    await page.evaluate(() => {
      history.pushState({ page: 2 }, "", "/page2");
    });

    await page.evaluate(() => {
      history.pushState({ page: 3 }, "", "/page3");
    });

    await page.waitForTimeout(100);

    const routeChangeLogs = await page.evaluate(() => window.__routeChangeLogs);
    console.log("Captured logs:", routeChangeLogs);

    const routeChanges = routeChangeLogs.filter((log: string) => log.startsWith("ROUTE_CHANGE:"));

    expect(routeChanges[0]).toContain("/page1");
    expect(routeChanges[1]).toContain("/page2");
    expect(routeChanges[2]).toContain("/page3");
  });
});

declare global {
  interface Window {
    __routeChangeLogs: string[];
    navigation?: {
      addEventListener(type: string, listener: (event: any) => void): void;
    };
  }
}
