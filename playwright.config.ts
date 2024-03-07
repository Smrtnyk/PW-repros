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
    projects: [
        {
            name: "chromium",
            use: { browserName: "chromium" }
        }
    ]
};

export default stableConfig;
