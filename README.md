# Cross-site `pagehide` / `sessionStorage` repro

This repro compares Chromium, Firefox, and WebKit when a first-party page writes
to `sessionStorage` from its `pagehide` handler during a cross-site round trip.

Run the three browser projects in the version-matched Playwright Ubuntu image:

```sh
docker compose run --build --rm tests
```

The test performs the following steps in one tab:

1. Opens `first-party.test` and verifies that the storage key is absent.
2. Follows a link directly to `third-party.test`.
3. Writes the key synchronously from the first-party page's `pagehide` handler.
4. After loading, the third-party page waits 20 ms and redirects to a first-party return page.
5. The return page reads the key from its own origin's `sessionStorage`.

All three projects use the same assertion. A WebKit-only failure is therefore
reported as a browser behavior difference rather than hidden as an expected
failure.

## Redirect-before-load and nested-frame case

The second test starts on a first-party page whose head script inserts a
stylesheet that the server delays for one second, then schedules a redirect
after 20 ms.
Its `pagehide` handler writes a separate `sessionStorage` value before the page
finishes loading.

The destination is a different page on the first-party origin. It embeds a
third-party iframe, which embeds a nested first-party iframe. The test asserts
that both the destination's top frame and the nested first-party frame can read
the value written by the initial page.

With Playwright 1.61.1 in the Ubuntu container, Chromium and Firefox pass both
assertions. WebKit reads `<missing>` in both the top frame and nested
first-party frame, so its project fails and exposes the behavior difference.
