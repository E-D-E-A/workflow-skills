# External interfaces MFE

One custom element fetches the interfaces array and subscribes once using the
host's existing CommManager. A host-provided normalizer returns the status update.
The component owns the list and renders the loop. No router, store or new socket.

## Visual walkthrough

Open [walkthrough.html](walkthrough.html) in a browser for a visual architecture map,
13 guided code steps, a timing simulator, and embedded source files. It works offline
without installing dependencies. The simulator is an educational model, not the
production remote. The embedded code is a snapshot; refresh it after source changes.

## Read these files

| File | Responsibility |
| --- | --- |
| `src/ExternalInterfaces.vue` | Local state, lifecycle coordination and rendering |
| `src/externalInterfacesData.ts` | REST fetch/validation and socket subscription/normalization/cleanup |
| `src/contracts.ts` | Types and Zod validation |
| `src/register.ts` | Vue's built-in custom element wrapper and local Vuetify setup |
| `src/entry.ts` | Async standalone bootstrap |
| `vite.config.ts`, `federation.constants.ts` | Federation build and shared versions |
| `examples/host/` | Registry, normalizer and navbar integration examples |

Tests and `test/host/` are verification tools; they are not part of the remote's
application architecture. Start with the Vue component, then the registration file.

## Host properties

```ts
Object.assign(element, {
  config: JSON.stringify({
    apiBaseUrl: '/api',
    interfacesPath: '/interfaces-x', // Replace with your actual endpoint.
    topic: 'interface-communication-x',
  }),
  websocket: existingCommManager,
  normalizeMessage: yourNormalizer,
});
```

Only config is serialized. The other two values MUST be JavaScript properties.
With Vue bindings, use `.prop` if the generic host otherwise writes attributes.
Set all three properties before mounting. They are captured once per mount; remount
the element to load different config, a different manager or a different normalizer.

```ts
interface HostWebsocket {
  subscribe(topic: string, callback: (raw: unknown) => void): void;
  unsubscribe(topic: string): void;
}
type NormalizeMessage = (raw: unknown) => {
  id: number;
  connectionStatus: number | null;
} | null;
```

The normalizer is synchronous; null means ignore. It understands the client's raw
message structure and returns a value. The component applies that value itself.
REST returns `[{ id, connectionStatus, displayName, groupName, type }, ...]`.
IDs are safe integers; statuses are finite numbers or null. Unknown IDs are ignored.

Optional config: `credentials` (default same-origin),
`statusLabels` and `statusColors` maps. Unknown statuses display their number;
null displays Unknown. The endpoint and authentication integration are left for
your repo. Adapt the fetch call in externalInterfacesData.ts if a host HTTP client is required.

## Federation integration

Use Vite 7.3.1, federation/vite 1.18.2, enhanced 2.6.0, Vue 3.5.29 and Vuetify 4.0.7.
Vue and Vuetify root imports are shared singletons. Vuetify components are bundled.

| Setting | Value |
| --- | --- |
| Remote name / host remote key / entryGlobalName | `ExternalInterfaces` |
| Import prefix | `ExternalInterfaces/register` |
| Exposed module | `./register` |
| Custom element | `cust-external-interfaces` |
| Type / share scope | `var` / `default` |
| Host entry URL | `.../remoteEntry.var.js` |

`varFilename` generates the classic-script wrapper your host needs. It loads the
adjacent ESM entry; publish the ENTIRE dist directory. Set `MFE_PUBLIC_BASE` to the
production asset directory URL with a trailing slash before building.

Importing the exposed module registers the tag. It also exports a registration
function and constructor. Verify this convention against the private loader.
Use your existing generic-host registration, createRuntimeMfeRegistry helper and
injection key. Render one generic-host instance in the navbar, without a v-for.
The private package's exports, eventMap syntax and registry types cannot be verified
here; the host examples are integration sketches.

## Lifecycle and theme

The named loadInterfaces function coordinates subscription setup, metadata loading
and applying the result. externalInterfacesData.ts contains two plain functions:
fetchInterfaceMetadata fetches and validates REST metadata; subscribeToInterfaceStatuses
normalizes/validates messages and returns an unsubscribe function. The component
keeps the list, early-update buffer and lifecycle coordination.

onMounted validates and captures inputs once, then fetches and subscribes.
onBeforeUnmount unsubscribes and marks the component as unmounted. A pending REST
request continues, but its result or error is ignored. There is no custom request
timeout; loading waits for the request to succeed or fail. Functions and variables
sit directly in script setup, which already provides per-component state; there is
no watcher or enclosing load-session function.

Messages received before successful metadata loading are buffered so REST cannot
overwrite them. Cleanup ignores late responses/callbacks and never closes the host
connection. Subscribe failures never unsubscribe somebody else's topic. Only one
collection may own a given manager/topic.

A metadata failure keeps the existing topic subscription. Retry repeats only the
REST request using the original configuration; it does not add another subscription.
Buffered statuses survive the retry. If the subscription itself failed, Retry can
attempt to acquire it again. Config/service changes and membership refreshes require
remounting the MFE. Status messages do not create new rows.

Vue handles custom-element property upgrades and DOM disconnect/reconnect. The
remote installs its own Vuetify instance with theme generation disabled. Light DOM
inherits the navbar's active Vuetify CSS variables, including theme changes. Mount
beneath the host's theme ancestor; do not add a full-page VApp inside the navbar.

Native `componentClick`, `componentDoubleClick`, `componentRightClick` events carry
`{ interfaceId, connectionStatus }` in event.detail. `mfe-event` carries data-state
or diagnostic objects. The private host's federation READY means code loaded; the
remote's REST load has its own state. The read-only remote emits no update:config.

## Run

```sh
npm ci
npx playwright install chromium
npm run check
```

Use Node 20.19+ (Node 20) or 22.12+. To use installed Chromium, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`.
`check` runs type checking, unit tests, a production build and browser tests.
The browser tests exercise real federation loading, UI and cleanup on two origins.

For manual viewing: build with `npm run build` and `npm run build:harness`, then run
`npm run preview` and `npm run preview:harness` in two terminals. Open localhost:4174.
The harness provides mock data/CommManager. It is not the production host.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and [AGENT_HANDOFF.md](AGENT_HANDOFF.md).

Verified after simplification: typecheck, production build, 15 unit tests,
and 6 real-browser federation tests pass. The private generic-host integration still
needs verification inside your repo.

For another remote, follow [CREATE_ANOTHER_MFE.md](CREATE_ANOTHER_MFE.md).
It identifies reusable bootstrap files and feature-specific logic to replace.
