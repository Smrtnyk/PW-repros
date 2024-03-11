import { expect, test, Page } from '@playwright/test';

test.describe.serial("retry", () => {
    test("visits empty page", async () => {

        expect(1).toBe(1)
    });

    test("retries 3 times",  ({  page }) => {
        return failTest(page)
    });
});

async function failTest(page: Page) {
    expect(1).toBe(1);
    throw new Error("Failing intentionally");
}
