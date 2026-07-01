# Playwright MCP Mapping for docs/qa Test Cases

## Viewport / breakpoint pixel table

CSS breakpoints in the app are authored in `em`; `browser_resize` takes
pixels. Convert at the CSS root (16px):

| Source               | CSS value | Pixels       | Used for                                        |
| -------------------- | --------- | ------------ | ----------------------------------------------- |
| `VIEWPORTS.Desktop`  | —         | 1440×900     | Default device viewport                         |
| `VIEWPORTS.Tablet`   | —         | 834×1112     | Tablet device viewport                          |
| `VIEWPORTS.Mobile`   | —         | 390×844      | Mobile device viewport                          |
| Sidebar collapse     | `53.75em` | 860px width  | TC-RESP-001, TC-RESP-002                        |
| System grid          | `47.5em`  | 760px width  | TC-RESP-003                                     |
| Tests table (wide)   | `44em`    | 704px width  | TC-RESP-004                                     |
| Tests table (narrow) | `35em`    | 560px width  | TC-RESP-004                                     |
| Preview grid         | `65em`    | 1040px width | `ui.module.css` preview layout, spot-check only |

Resize to width −1px and +1px around a breakpoint when a case cares about
the exact collapse point (e.g. 859px vs. 861px for TC-RESP-001).

## Action → Playwright MCP tool mapping

| Test-case action                                                             | Tool(s)                                                                                                                                                |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Load a route / hash change                                                   | `browser_navigate` to `http://localhost:5173/#/<route>`                                                                                                |
| Browser Back (TC-NAV-008)                                                    | `browser_navigate_back`                                                                                                                                |
| Click a nav item, chip, card, Seg button                                     | `browser_snapshot` first for a current ref, then `browser_click`                                                                                       |
| Hover states                                                                 | `browser_hover`                                                                                                                                        |
| Keyboard-only pass (TC-A11Y-001)                                             | `browser_press_key` (`Tab`, `Shift+Tab`, `Enter`) repeatedly + `browser_snapshot` after each to confirm the focused element and visible order          |
| Resize for a device/breakpoint case                                          | `browser_resize` before navigating/asserting                                                                                                           |
| Zero-console-errors check                                                    | `browser_console_messages` after each view load                                                                                                        |
| Live-mode polling (TC-DATA-002/003)                                          | `browser_network_requests` filtered to `state.json` / `*.jsonl`; confirm ~2s cadence and response status                                               |
| Text/ARIA/role assertions (`aria-current`, `role=progressbar`, sr-only text) | `browser_snapshot` (accessibility tree)                                                                                                                |
| Computed style / class assertions (severity styling, pill color, truncation) | `browser_evaluate` running `getComputedStyle(...)` or reading `className`/`textContent`                                                                |
| Visual/responsive evidence, broken-image fallback                            | `browser_take_screenshot`                                                                                                                              |
| Simulate a broken screenshot (TC-PROTO-004)                                  | `browser_evaluate` to rewrite an `<img>`'s `src` to a 404 path, then `browser_snapshot`/`browser_take_screenshot` to confirm the fallback icon renders |
| Copy-to-clipboard (TC-ERR-002)                                               | `browser_click` the "Copy error" button, then `browser_evaluate` calling `navigator.clipboard.readText()`                                              |

## Automation limits in detail

**`prefers-reduced-motion` (TC-A11Y-002).** This is a browser/OS-level media
feature, not something a page script can flip — `window.matchMedia` reflects
the real OS/browser setting, and the app's CSS `@media` rules read the same
source, so overriding `matchMedia` from page JS has no effect on how the
stylesheet evaluates. True emulation needs Chrome DevTools Protocol's
`Emulation.setEmulatedMedia`, exposed in Playwright as
`page.emulateMedia({ reducedMotion: 'reduce' })`. Use it only if an available
MCP tool grants raw Playwright API access; otherwise mark the case "not
automatable via current MCP tool surface" and flag it for a manual OS-level
pass rather than guessing Pass or Fail.

**Forcing a React render error (`TC-ERR-001`–`003`).** There is no
page-script way to make a mounted React tree throw during render from
outside the app. Practical path:

1. Add a temporary `throw new Error('qa-forced-error')` at the top of the
   target view's function component.
2. Save and reload (`browser_navigate` to the same URL, or let Vite HMR pick
   it up).
3. Run the case — `ErrorBoundary` should catch it and render the
   Retry/Reload/Copy error card.
4. Revert the temporary throw before finishing the run. Do not commit it.

**Clipboard read-back (TC-ERR-002).** Some browsers restrict
`navigator.clipboard.readText()` to trusted/user-gesture contexts even under
automation. If `browser_evaluate` throws a permissions error reading the
clipboard, treat a successful `writeText` (no thrown error on the Copy
click) as sufficient automated evidence and note that the read-back needs a
manual paste to fully confirm.

## Fixture drift check

Before a run, diff the counts hardcoded in `docs/qa/test-cases.md` (6
prototypes, 8 screenshots, 3 findings, 6 test runs, 4 MCP calls) against the
current `web/src/data/mock.ts`. If they've drifted, warn before running —
cases will fail against stale expected counts, not real regressions — and
suggest updating `docs/qa/test-cases.md` per its own Suite Maintenance note.
