import {test} from "./fixtures";
import {expect} from "@playwright/test";

test('fetch with keep-alive should throw when offline', async ({page, server}) => {
    await page.goto("about:blank");
    const url = server.BEACONS_ENDPOINT
    const initialFetch = await page.evaluate(async (url) => {
        try {
            const response = await fetch(url, {
                keepalive: true
            });
            return {success: true, status: response.status};
        } catch (error) {
            return {success: false, error: error.toString()};
        }
    }, url);

    expect(initialFetch.success).toBe(true);

    await page.context().setOffline(true);

    const offlineResult = await page.evaluate(async (url) => {
        try {
            await fetch(url, {
                keepalive: true
            });
            return {threw: false};
        } catch (error) {
            return {threw: true, error: error.toString()};
        }
    }, url);

    expect(offlineResult.threw).toBe(true);

    await page.context().setOffline(false);
});
