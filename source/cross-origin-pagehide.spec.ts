import { expect } from "@playwright/test";
import { test } from "./fixtures.js";

const STORAGE_KEY = "written-during-pagehide";
const STORAGE_VALUE = "first-party-page-was-hidden";
const SLOW_PAGE_STORAGE_VALUE = "slow-first-party-page-was-hidden";

test("preserves sessionStorage written during pagehide across a third-party round trip", async ({ page, server }) => {
    const firstPartyURL = `http://first-party.test:${server.PORT}/first-party.html`;
    const thirdPartyURL = `http://third-party.test:${server.PORT}/third-party.html`;
    const returnURL = `http://first-party.test:${server.PORT}/return.html`;

    await page.goto(firstPartyURL);
    await expect(page.getByRole("heading", { name: "First-party page" })).toBeVisible();
    expect(await page.evaluate(key => sessionStorage.getItem(key), STORAGE_KEY)).toBeNull();

    const thirdPartyResponse = page.waitForResponse(thirdPartyURL);
    await Promise.all([
        page.waitForURL(returnURL),
        page.getByRole("link", { name: "Go to third-party page" }).click(),
    ]);

    expect((await thirdPartyResponse).ok()).toBe(true);
    await expect(page.getByRole("heading", { name: "First-party return page" })).toBeVisible();

    await expect(page.getByTestId("stored-value")).toHaveText(STORAGE_VALUE);
});

test("shares sessionStorage with a nested first-party frame after redirecting before load", async ({ page, server }) => {
    const initialURL = `http://first-party.test:${server.PORT}/slow-first-party.html`;
    const destinationURL = `http://first-party.test:${server.PORT}/framed-first-party.html`;
    const slowResourceURL = `http://first-party.test:${server.PORT}/slow-resource.css`;

    await Promise.all([
        page.waitForRequest(slowResourceURL),
        page.waitForURL(destinationURL),
        page.goto(initialURL, { waitUntil: "commit" }),
    ]);

    await expect(page.getByRole("heading", { name: "First-party destination page" })).toBeVisible();
    expect.soft(await page.getByTestId("top-frame-stored-value").textContent()).toBe(SLOW_PAGE_STORAGE_VALUE);

    const nestedFirstPartyFrame = page
        .frameLocator("#third-party-frame")
        .frameLocator("#nested-first-party-frame");

    await expect(nestedFirstPartyFrame.getByRole("heading", { name: "Nested first-party frame" })).toBeVisible();
    expect.soft(await nestedFirstPartyFrame.getByTestId("nested-frame-stored-value").textContent()).toBe(SLOW_PAGE_STORAGE_VALUE);
});
