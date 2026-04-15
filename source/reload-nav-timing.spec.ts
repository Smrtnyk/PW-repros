import { expect, test } from "@playwright/test";
import { Server } from "./server.js";

test("reports reload in navigation timing after reload", async ({ page }) => {
    const server = new Server();
    await server.init();

    try {
        await page.goto(server.EMPTY_HTML_PAGE);
        await page.reload({ waitUntil: "load" });

        await expect.poll(async () => {
            return page.evaluate(() => {
                const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
                return entry?.type;
            });
        }).toBe("reload");
    } finally {
        await server.stop();
    }
});
