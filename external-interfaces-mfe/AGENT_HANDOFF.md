# Instructions and context for the receiving agent

## Goal and latest decisions

Integrate this package as a Module Federation remote in an existing private Vue
host. The user cannot export the private repo. Use these files plus local access to
that repo to finish wiring it. Focus on federation and lifecycle correctness.

The FINAL design is ONE `ExternalInterfaces` MFE representing the whole collection.
The host navbar renders it once. The loop is inside `src/ExternalInterfaces.vue`.
Earlier discussions of one MFE per interface, subscriber IDs, a topic router and
host-supplied handler factories have been superseded. Do not reintroduce them.

The host passes its actual CommManager plus a normalizer function. The normalizer
returns a value; the remote applies it to local state. It is not a callback factory
and does not directly set state. The manager exposes subscribe(topic, callback) and
unsubscribe(topic), allowing ONE callback per topic. The navbar is not a subscriber.

The remote creates its own Vuetify plugin instance. It receives no Vuetify prop.
It uses light DOM and inherited host theme CSS variables, with remote theme
generation disabled. Both apps share the Vue and Vuetify root packages as singletons.

## Fixed contracts

- Container/key/global/import prefix: `ExternalInterfaces` (case-sensitive).
- Expose key: `./register`; load prefix: `ExternalInterfaces/register`.
- Tag: `cust-external-interfaces`; federation type: `var`; share scope: `default`.
- Host entry URL ends in `remoteEntry.var.js`; this imports the adjacent ESM entry.
- Config is JSON string; live JS properties are `websocket` and `normalizeMessage`.
- Normalizer return: `{ id: safe integer, connectionStatus: finite number | null }`
  or `null` to ignore. Synchronous. Numeric domain codes are opaque.
- REST: array of `{ id, connectionStatus, displayName, groupName, type }`.
- Default topic: `interface-communication-x`.
- One fetch and one subscription per mounted collection; state is local.
- Preserve the original manager identity and method receiver (`this`).
- Unmount aborts the GET, releases the topic, and stops local Vue/Vuetify resources.
  It never closes the connection. Initial buffered WS updates override REST values.

## Versions to preserve

Vite 7.3.1; `@module-federation/vite` 1.18.2;
`@module-federation/enhanced` 2.6.0;
`@gf/generic-module-federation-host` 1.0.1;
Vue 3.5.29; Vuetify 4.0.7.

The Vite plugin brings runtime 2.8.0; enhanced brings runtime 2.6.0. This is expected
for the requested package versions and is exercised in the harness. Do not upgrade,
override or replace these packages as a speculative first fix. See VALIDATION.

## Host facts supplied by the user

The generic host is registered globally as `generic-module-federation-host`.
The host builds/provides a registry using
`createRuntimeMfeRegistry(MfeRegistry, envResolver)`.

The communicated registry entry schema is:

```ts
{
  federation: {
    type: 'var',
    name,
    entryEnvKey,
    entryGlobalName,
    shareScope?,
    exposedModule,
    wrapperElementName,
  },
  runtime: {
    dataServerUrlEnvKey?,
    defaultConfig?,
    eventMap?,
    toElementProps(config): Record<string, unknown>,
  },
}
```

Names were typed manually and the user asked for typos to be corrected. Verify
these against the actual internal types; do not claim a mismatching field is valid
because it appears in an example. The existing host name was transcribed as
HostVueVite with later typing errors; keep the repo's existing host name.

Host federation initialization is injected in HTML. The compiler recognizes
`cust-*` tags and registry wrapper names as custom elements. The generic host itself
is a Vue component and accepts `definition` and `loading-timeout-duration`, with
loading/error slots, componentClick/Double/RightClick, mfe-event, update:config and
state-change support. Exact eventMap and exported registration API shapes were not
provided. Keep the repo's working patterns for these.

## Locate these integration points in the internal repo

Use search rather than inventing package exports:

```sh
rg 'generic-module-federation-host|createRuntimeMfeRegistry|toElementProps|wrapperElementName'
rg 'hostInitInjectLocation|entryGlobalName|exposedModule|exposeModule' --glob '*.{ts,js,vue}'
rg 'interface-communication-x|communicationStatus|connectionStatus' --glob '*.{ts,js,vue}'
rg 'createVuetify|isCustomElement' --glob '*.{ts,js,vue}'
```

1. Find the existing manager and normalizer integration. Pass the original object
   and stable function by element property. Do not JSON-serialize or deep-clone them.
2. Find how the generic host loads an expose. This package self-registers on import
   and offers an explicit registration function/default constructor. Adapt only the
   expose boundary if the host expects another shape.
3. Find the generic host's property assignment. Verify it supports arbitrary JS
   properties from `toElementProps`; add property assignment there if it currently
   only serializes attributes. Confirm pre-upgrade properties are handled.
4. Add the registry entry and entry env variable; align the generated Vite mapping.
   Keep existing global component registration and provide/inject keys.
5. Replace the old navbar list with ONE generic-host instance. Do not add a v-for
   around it. Remove obsolete data/subscription code only if it actually exists in
   the migrated component; the user clarified that the navbar is not a subscriber.
6. Set the exact REST path and API integration. The user explicitly deferred this
   to the receiving repo. There is no verified `/Confitour` route in this package.
7. Supply status labels/colors from actual domain definitions, without inventing
   connected/disconnected meanings for numeric codes.
8. Apply the test sketch in `test/INTERNAL_HOST_INTEGRATION.md` using the private host.

## Tests and acceptance

Run `npm ci`, install a Playwright browser if needed, and run `npm run check`.
See VALIDATION for completed checks. This package's controller tests exercise the
logic used by the actual Vue component. Browser tests load the real built var remote
through enhanced/runtime and include actual Vue/Vuetify rendering.

Acceptance in the internal repo additionally requires the real generic-host bridge,
real env resolver, actual API/auth, actual normalizer, and navbar theme. Verify one
subscription and one GET, updates to the correct rows, no new socket, correct cleanup,
and successful remount. Host loading failure and remote REST failure are separate.

If a failure occurs, follow TROUBLESHOOTING in order. Change the smallest failing
boundary and rerun its relevant checks. Do not solve an attribute/property problem
by putting a manager in a global singleton store, or a REST failure by changing the
remote's container name.

## Deliberate limits

There is no backend, deployment integration, automatic reconnect protocol, row
membership stream, batching API, business status enum or private package source in
this archive. The host remains the connection owner. The remote can reload metadata
explicitly. Sequence-aware reconciliation needs a future server contract.
The package is a runnable scaffold, with internal integration examples clearly
marked as examples. It was not installed into or tested against the private repo.
