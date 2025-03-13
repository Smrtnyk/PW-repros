import { PlaywrightTestConfig } from '@playwright/test';

export const stableConfig: PlaywrightTestConfig = {
    fullyParallel: true,
    reporter: [
        ["list"],
    ],
    timeout: 60 * 1000,
    testDir: "source",
    testMatch: "**/*.spec.ts",
    quiet: false,
    preserveOutput: "failures-only",
    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" }
        },
        {
            name: "firefox",
            use: { browserName: "firefox" }
        },
        {
            name: "webkit",
            use: { browserName: "webkit" }
        }
    ]
};

export default stableConfig;
