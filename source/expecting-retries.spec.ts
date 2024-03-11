import { expect } from '@playwright/test';
import { test } from "./fixtures";

test("retries 3 times",  async ({ server, page }) => {
   await page.goto(server.EMPTY_HTML_PAGE);
   expect(1).toBe(2)
});
