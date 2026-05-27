import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const PAGE_URL = "http://test.local/csp-reporting-observer-repro.html";
const REPORT_URL = "http://test.local/csp-report";

interface CspProbe {
    hasReportingObserver: boolean;
    reportingObserverError: string | null;
    reportingObserverReports: string[];
}

const BLOCKED_FETCH_URL = "http://blocked-fetch.invalid/fetch.json";
const BLOCKED_IMAGE_URL = "http://blocked-image.invalid/image.png";
const BLOCKED_SCRIPT_URL = "http://blocked-script.invalid/script.js";

const EXPECTED_BLOCKED_URLS = [
    BLOCKED_FETCH_URL,
    BLOCKED_IMAGE_URL,
    BLOCKED_SCRIPT_URL
];

test("does not duplicate report-only CSP violations with report-to", async ({ page }) => {
    await routeCspPage(page);

    await page.goto(PAGE_URL);

    await expect.poll(() => readCspProbe(page), {
        message: "script, image, and fetch CSP violations should each be reported once",
        timeout: 2000
    }).toEqual({
        hasReportingObserver: true,
        reportingObserverError: null,
        reportingObserverReports: EXPECTED_BLOCKED_URLS
    });
});

async function routeCspPage(page: Page): Promise<void> {
    await page.route(REPORT_URL, async (route) => {
        await route.fulfill({ status: 204 });
    });

    await page.route(PAGE_URL, async (route) => {
        await route.fulfill({
            contentType: "text/html",
            headers: {
                "Reporting-Endpoints": "csp-endpoint=\"/csp-report\"",
                "Content-Security-Policy-Report-Only": "default-src 'self' 'unsafe-inline'; report-to csp-endpoint"
            },
            body: `<!doctype html>
                <script>
                    window.cspProbe = {
                        hasReportingObserver: typeof ReportingObserver !== "undefined",
                        reportingObserverError: null,
                        reportingObserverReports: []
                    };

                    try {
                        new ReportingObserver((reports) => {
                            for (const report of reports) {
                                window.cspProbe.reportingObserverReports.push(report.body.blockedURL);
                            }
                        }, { buffered: true, types: ["csp-violation"] }).observe();
                    } catch (error) {
                        window.cspProbe.reportingObserverError = String(error);
                    }
                </script>
                <script src="${BLOCKED_SCRIPT_URL}"></script>
                <img src="${BLOCKED_IMAGE_URL}" alt="blocked">
                <script>
                    fetch("${BLOCKED_FETCH_URL}").catch(() => {});
                </script>`
        });
    });
}

async function readCspProbe(page: Page): Promise<CspProbe> {
    const probe = await page.evaluate(() => {
        return (window as Window & { cspProbe: CspProbe }).cspProbe;
    });

    return {
        ...probe,
        reportingObserverReports: normalizeBlockedUrls(probe.reportingObserverReports)
    };
}

function normalizeBlockedUrls(urls: string[]): string[] {
    return urls.map((url) => new URL(url).href).sort();
}
