import { expect, Page } from '@playwright/test';
import { test } from "./fixtures";

test("detects inp", async ({ server, page }) => {
    await page.goto(server.EMPTY_HTML_PAGE);

    const input = page.locator("#input");
    await input.press("k");
    await page.waitForTimeout(200);

    const inp = await getLargestINP(page);

    expect(inp).toBeDefined();
});

function getLargestINP(page: Page): Promise<PerformanceEventTiming> {
    return page.evaluate(() => {
        return new Promise<PerformanceEventTiming>((resolve) => {
            (new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries().sort((a, b) => a.duration - b.duration);
                resolve(entries[entries.length - 1] as PerformanceEventTiming);
                // @ts-expect-error -- experimental feature
            })).observe({ buffered: true, type: "event", durationThreshold: 40 });
        });
    });
}
