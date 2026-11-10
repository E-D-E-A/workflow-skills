# ExternalInterfaces MFE troubleshooting

This guide is self-contained. It describes the final agreed architecture and the
tested public tooling boundary so troubleshooting does not require exporting the
internal repository or revisiting the original conversation.

## Start from these facts

- One collection MFE, mounted once in the host navbar; its internal Vue component
  renders the loop. There is no `interfaceId` input.
- The host owns one existing CommManager. Its API is `subscribe(topic, callback)`
  and `unsubscribe(topic)`. A second subscription to the same topic is unsupported.
- The remote subscribes once, and releases that topic on unmount. It never creates,
  reconnects or closes a WebSocket. The navbar itself is not a subscriber.
- The host passes a synchronous normalizer. It returns
  `{ id: number, connectionStatus: number | null }` or `null` to ignore a message.
  The remote calls it and applies the returned value to its local state.
- `config` is a JSON string. `websocket` and `normalizeMessage` are live JS properties.
- Vite 7.3.1; federation/vite 1.18.2; enhanced 2.6.0; Vue 3.5.29; Vuetify 4.0.7;
  private generic host 1.0.1. Vue and Vuetify root packages are shared singletons.
- Container/key/global/import prefix: `ExternalInterfaces`; expose: `./register`;
  tag: `cust-external-interfaces`; entry: `remoteEntry.var.js`; share scope: `default`.
- The exact internal REST route and authentication integration are intentionally
  left for the receiving repository. `/api/interfaces-x` is a placeholder.

## Diagnose in order

1. Can the host request `remoteEntry.var.js`, the adjacent `remoteEntry.js`, and all
   referenced JS/CSS assets with successful responses and correct content types?
2. Does the host's federation runtime import `ExternalInterfaces/register`?
3. Is `customElements.get('cust-external-interfaces')` defined afterward?
4. Does the actual DOM element contain the expected property values and references?
5. Does the component validate config and subscribe exactly once?
6. Does the REST array validate and contain the expected numeric IDs?
7. Does the normalizer return the required shape, including numeric IDs/statuses?
8. Does unmount remove the callback without closing the host connection?

Stop at the first broken boundary. A REST or theme issue is not evidence that the
federation container name needs changing.

## Symptom reference

| Symptom | Likely boundary | Check / action |
| --- | --- | --- |
| Generic host stays LOADING or times out | Entry network / container loading | Check resolved env URL, CORS, assets, runtime console and the `var` wrapper |
| `Unexpected token export` / module syntax error | ESM entry loaded as a classic script | A `type: 'var'` host must load `remoteEntry.var.js`, not `remoteEntry.js` |
| Global container missing | Name mismatch or wrapper never executed | Inspect `window.ExternalInterfaces` after the host has loaded the classic wrapper |
| `get` / `init` missing | Wrong resource or incompatible entry type | The global must expose both functions; a 200 HTML fallback is not a container |
| Module `./register` not found | Expose mismatch | Check `exposes`, registry `exposedModule`, and import prefix together |
| Tag remains an unknown element | Expose was not evaluated / different loader convention | Confirm import-side-effect registration or adapt `src/register.ts` to the private loader |
| `already defined` custom element | Duplicate registration | Keep the registration guard; full-page reload to replace an already registered constructor |
| `INVALID_PROPS` diagnostic | Property/config bridge | Inspect element properties; check callable subscribe, unsubscribe and normalizer |
| `websocket` is `[object Object]` or missing | Attributes used instead of properties | Use `Object.assign` or explicit Vue `.prop` bindings |
| Methods lost or private field/`this` error | Object cloned, serialized, proxied or methods detached | Preserve original manager reference; call methods on that object |
| `SUBSCRIBE_FAILED` | Topic already owned / host manager error | Confirm only one collection element and inspect any existing owner; do not unsubscribe it to force a takeover |
| `METADATA_FAILED` / API 404 | Deferred endpoint, auth or response mismatch | Set actual base/path and inspect REST array, HTTP status and network credentials |
| API request goes to remote asset server | Incorrect absolute API base | Relative `/api` paths resolve at the host origin; set an explicit API origin if necessary |
| Rows load, statuses never change | Callback delivery, normalizer, IDs | Confirm topic spelling, callback payload, numeric ID equality and non-null normalizer output |
| `NORMALIZER_FAILED` | Host normalizer threw | Check client envelope handling and guard irrelevant payloads |
| `INVALID_UPDATE` | Normalizer return contract | Return `{ id, connectionStatus }` with numeric values or null; do not return raw messages or Promises |
| Other interfaces change too | Client normalizer or row keys | Check returned ID and stable `:key="item.id"`; only the matching known ID is updated |
| Early live value reverts after initial load | Race handling changed or controller bypassed | Keep subscribe-before-fetch and pending-update merge; see the race unit test |
| Repeated GET/subscription on host re-render | New prop references/config strings | Keep manager/normalizer references stable and avoid recreating equivalent config strings needlessly |
| Subscription survives unmount | Host never removed element / cleanup error | Check disconnectedCallback, delayed microtask cleanup and `UNSUBSCRIBE_FAILED` |
| Interface membership never changes | Status-only contract | Explicitly call `element.reload()` after relevant membership/reconnect events |
| Host READY but remote shows error/loading | Two different readiness stages | Host READY means code loaded; inspect remote data-state and REST separately |
| Vuetify injection errors | Plugin installation or sharing mismatch | Keep the local createVuetify/app.use calls; verify exact Vue/Vuetify versions and share scope |
| UI has wrong theme/colors | Missing inherited theme variables | Inspect active `.v-theme--...` ancestor and computed `--v-theme-*` variables |
| UI appears unstyled | Remote CSS asset failed | Inspect the exposed chunk's CSS preload; serve the whole dist directory |
| Navbar becomes page-height | Extra VApp/layout wrapper | Keep the compact Vuetify components and light DOM wrapper |
| Event handler never runs in generic host | Event bridge mapping | Native event names/detail are documented in GUIDE; adapt actual private eventMap schema |
| Remount fails but first mount works | Topic not released / stale references | Inspect unsubscribe count and manager callback map; test mount → unmount → mount |
| Dev-only intermittent shared-module loading | Dev transform/optimizer/runtime path | Reproduce with built remote AND built harness before changing production federation config |

## Browser probes

Run these against the host page after it attempts to load the remote. They inspect
shape/identity rather than logging payloads or connection objects.

```js
const el = document.querySelector('cust-external-interfaces');
({
  tagRegistered: Boolean(customElements.get('cust-external-interfaces')),
  elementPresent: Boolean(el),
  configType: typeof el?.config,
  subscribeType: typeof el?.websocket?.subscribe,
  unsubscribeType: typeof el?.websocket?.unsubscribe,
  normalizerType: typeof el?.normalizeMessage,
  containerGet: typeof window.ExternalInterfaces?.get,
  containerInit: typeof window.ExternalInterfaces?.init,
});
```

Expected: registered/present are true; config is `string`; remaining fields are
`function`. Before an entry is requested the global may legitimately be absent.
The WebSocket's functions should NOT appear in the parsed JSON config.

Listen directly at the remote boundary before debugging generic-host forwarding:

```js
el.addEventListener('mfe-event', event => console.log(event.detail));
el.addEventListener('componentClick', event => console.log(event.detail));
```

Diagnostics intentionally contain codes and concise messages, not raw socket
payloads, credentials, or whole manager objects. If direct events work but the
Vue host event binding does not, inspect the host's event map/detail unwrapping.

Check theme inheritance:

```js
const row = el.querySelector('.external-interfaces');
getComputedStyle(row).getPropertyValue('--v-theme-surface');
getComputedStyle(row).getPropertyValue('--v-theme-on-surface');
```

These variables must be provided by the host's active theme ancestor. The remote's
own Vuetify instance uses `theme: false` to avoid overriding that CSS.

## Package / build probes

```sh
node --version
npm ls vite @module-federation/vite @module-federation/enhanced vue vuetify
npm ls @module-federation/runtime @module-federation/runtime-core --depth=4
npm run typecheck
npm test
npm run build
npm run test:browser
```

Expect both runtime 2.8.0 (from the Vite plugin) and 2.6.0 (from enhanced). This is the
declared dependency graph of the requested pins. Do not force-dedupe these packages
as a first troubleshooting step. Compare the failing host with the included
production harness and record any host runtime plugins or package overrides.

Inspect `dist/remoteEntry.var.js`: it declares `var ExternalInterfaces`, calculates
the adjacent ESM entry URL from its script URL and delegates `get`/`init`. It must be
loaded as a classic script by the host runtime. Manually importing the var wrapper
as an ES module will not install the expected global.

Inspect `dist/mf-manifest.json`: `metaData.remoteEntry` describes the ESM entry, while
`metaData.varRemoteEntry` describes the var wrapper. The supplied registry points
directly at the var wrapper; substituting the manifest URL may change entry selection
and must be verified against the actual host loader.

The built preview harness is the reference smoke test. `npm run test:browser` builds
the harness itself, but assumes the remote was already built. `npm run check` handles
both in order. If Playwright has no browser, install Chromium using its documented
installer or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to an existing executable.

## Subscription rules when changing this code

Do not put `subscribe` in the item component, a `v-for`, or a watcher for each row.
Do not add a second collection instance for the same manager/topic. Do not add
subscriber IDs or a routing service unless the user explicitly changes the agreed
architecture. The one-callback manager is sufficient for this collection MFE.

The return value of `subscribe` is unused because the supplied API returns void.
Cleanup calls `unsubscribe(topic)` on the exact manager that was subscribed. The
controller tracks whether it successfully acquired the topic; if subscribe throws,
cleanup must not delete another consumer's subscription.

Changes to props are deliberate restarts. The old controller is stopped before the
new one is mounted, and any old queued callbacks or REST completion are ignored.
The remote never calls `websocket.close`, `connect`, `disconnect`, or `new WebSocket`.

## Small evidence bundle for the next agent

Provide this guide and AGENT_HANDOFF with:

- The first failing step in the diagnostic sequence and exact console error/code.
- Exact installed dependency versions, including both federation runtime branches.
- A sanitized registry entry and the resolved entry URL/path (omit secret values).
- Whether the loaded entry was var or ESM, and the HTTP status/MIME of failed assets.
- The type/boolean results from the browser probe above.
- A fabricated raw-message example and the normalizer's returned value.
- A fabricated metadata row including ID/status types.
- Whether the standalone production harness passes, and whether the issue appears
  only during development, after remount, after config replacement, or after deployment.

Do not request a repository export just to inspect these boundaries. A local agent
with repo access can follow the integration points listed in AGENT_HANDOFF.
