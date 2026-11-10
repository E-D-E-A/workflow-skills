# Verification record

Verified on 2026-11-10 in an isolated workspace using Node 24.22.1, npm 11.9.0 and
Chromium from `/usr/bin/chromium`. No internal repository was accessed.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 21 unit tests |
| `npm run build` | Passed: production remote with `remoteEntry.var.js`, ESM entry, exposed module, JS/CSS assets and manifest |
| `npm run build:harness` | Passed as part of the browser-test startup |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser` | Passed: 6 browser tests, using production builds of both host harness and remote |
| Manual-harness smoke via Chromium, using its static API fixture without network interception | Passed: API 200, 2 rows, 1 subscription, loader READY, inherited theme variable, no page errors; screenshot visually inspected |

The unit tests cover one fetch/subscription, alternate message structure, ID-specific
updates, null statuses, initial REST/WS race, malformed/throwing normalizers, unknown
IDs, abort/late completion, receiver identity/private fields, subscription acquisition
failure, HTTP/schema/duplicate-ID failures, unsubscribe failure and request timeout.
Boundary tests check both callable WS methods, function/config validation, original
object identity and URL base-prefix preservation.

Browser tests verify real `var` entry loading through enhanced/runtime 2.6.0, actual
Vue/Vuetify rendering, row interaction events, no additional WebSocket construction,
one collection GET/subscription, unmount/remount, pre-upgrade object/function props,
alternate normalizers, invalid outputs, inherited host theme, invalid-config cleanup,
metadata failure/retry and failed entry loading.

## Scope of evidence

The public Vite plugin 1.18.2 and enhanced/runtime 2.6.0 branches coexist in this
harness. The generated var wrapper and the ESM entry it delegates to loaded across
two localhost origins. The exact dependency tree is pinned in package-lock.json.

The private generic-host package, its real registry helper/injection key, export
conventions, event forwarding, actual HTTP authentication and endpoint, deployment
server/CSP and business status mappings remain internal integration work. They were
not tested here and are not represented as verified. Apply
`test/INTERNAL_HOST_INTEGRATION.md` in that repository.

The initial development-server harness run exposed an intermittent Vite virtual
shared-module request stall during page reload. The reference browser suite now
tests production builds of both sides. Production tests passed; universal dev/HMR
compatibility is not claimed. Use built previews when isolating federation problems.
