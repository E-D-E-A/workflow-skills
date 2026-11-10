# ExternalInterfaces federation remote

One Vue custom element renders the complete external interfaces collection inside
the host navbar. It fetches metadata once and subscribes once using the host's live
CommManager. A host-supplied normalizer translates messages; the remote owns all
displayed state. No additional WebSocket connection or global application store.

**Start with [GUIDE.md](GUIDE.md) for integration, [AGENT_HANDOFF.md](AGENT_HANDOFF.md)
for the receiving agent, and [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for diagnosis.**

## What is included

| Location | Purpose |
| --- | --- |
| `vite.config.ts`, `federation.constants.ts` | Pinned Vite federation setup and naming invariants |
| `src/register.ts`, `src/element.ts` | Exposed registration module and custom element property/lifecycle bridge |
| `src/contracts.ts` | Zod config, dependency, REST, and normalizer-output validation |
| `src/controller.ts`, `src/api.ts` | One subscription, one collection request, local state, cleanup and race handling |
| `src/ExternalInterfaces.vue` | Vuetify navbar UI; the loop is here |
| `examples/host/` | Registry, normalizer, environment and Vue host sketches |
| `test/unit/` | Component logic and validation tests |
| `test/host/`, `test/browser/` | Executable two-origin federation harness and browser tests |
| `test/INTERNAL_HOST_INTEGRATION.md` | Additional test sketch for the private generic host |

## Versions

| Dependency | Version |
| --- | --- |
| Vite | 7.3.1 |
| `@module-federation/vite` | 1.18.2 |
| `@module-federation/enhanced` (integration harness) | 2.6.0 |
| Vue | 3.5.29 |
| Vuetify | 4.0.7 |
| Zod | 3.25.76 |
| Private host package, supplied by your repo | `@gf/generic-module-federation-host` 1.0.1 |

Use Node 20.19+ in the Node 20 line, or Node 22.12+. The dependency engine
constraint also accepts newer supported Node versions. A lockfile is included.
The private package is not a dependency of this portable project and was not available here.

## Run checks

```sh
npm ci
npx playwright install chromium
npm run check
```

If an existing Chromium executable is preferred:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check
```

`check` runs type checking, unit tests, the production remote build, and browser
tests. Playwright builds a production host harness and starts both preview servers.
Use ports 4173 and 4174. Stop unrelated servers on those ports first.

## View the working example

```sh
npm run build
npm run build:harness
```

In two terminals:

```sh
npm run preview
```

```sh
npm run preview:harness
```

Open `http://127.0.0.1:4174`. The harness has static mock REST data and a mock
CommManager with the same one-subscriber-per-topic constraint. Its controls send a
message, unmount/remount the remote, and change the host theme. The remote is loaded
from `http://127.0.0.1:4173/remoteEntry.var.js` through enhanced/runtime 2.6.0.
These mocks are test infrastructure, not a replacement production transport.

## Properties supplied by the host

```ts
element.config = JSON.stringify({
  apiBaseUrl: '/api',
  interfacesPath: '/interfaces-x', // Replace with your internal route.
  topic: 'interface-communication-x',
});
element.websocket = existingCommManager;
element.normalizeMessage = raw => {
  // Client-specific validation and extraction happen here.
  // Return { id: number, connectionStatus: number | null }, or null to ignore.
};
```

Only `config` is JSON. The WebSocket instance and normalizer are live JavaScript
properties. See `examples/host/normalizer.ts` for a complete normalizer.
The old per-interface `interfaceId` prop is intentionally absent.

## Integration work left for the internal repo

- Set the exact REST path, API base URL, and authentication requirements.
- Wire the host's existing manager and actual message normalizer as properties.
- Check the private registry field names, injection key, registration/export
  convention and event forwarding against the installed package's types/source.
- Set the production remote public base URL and serve the entire `dist` directory.
- Supply domain status labels/colors if known. The defaults show numeric codes
  neutrally and label `null` as `Unknown`; they do not invent status semantics.

The executable harness verifies the public federation/runtime and custom element
boundary. It does not claim to verify the inaccessible private generic host.
See [VALIDATION.md](VALIDATION.md) for the actual verification results.
