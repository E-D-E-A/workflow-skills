# Receiving agent: start here

Integrate this standalone remote into the internal host. Read README.md, then
src/ExternalInterfaces.vue and src/register.ts. Keep it simple.

## Final decisions

- ONE collection MFE in the navbar; the loop is inside the component.
- One existing host CommManager passed by property. Its API is
  subscribe(topic, callback) and unsubscribe(topic), one consumer per topic.
- Host passes a synchronous normalizer returning { id, connectionStatus } or null.
  It is not a handler factory. The component applies the returned value.
- Config is JSON; manager and normalizer are live JS properties.
- Local component state only. No router, store, per-row subscriptions or new socket.
- Remote creates its own Vuetify instance. Light DOM inherits host theme variables.
- Keep Zod validation, exact manager identity, early-message buffering, abort and
  unsubscribe cleanup. These guards prevent specific lifecycle bugs.

## Integration points

1. Keep host versions: Vite 7.3.1, federation/vite 1.18.2, enhanced 2.6.0,
   generic-module-federation-host 1.0.1, Vue 3.5.29, Vuetify 4.0.7.
2. Remote name, host key, entryGlobalName and import prefix must be ExternalInterfaces.
   Expose ./register; tag cust-external-interfaces; type var; share scope default.
   Use remoteEntry.var.js and publish the full dist directory.
3. Use the existing global generic-module-federation-host registration and
   createRuntimeMfeRegistry(MfeRegistry, envResolver) setup. Match actual local types;
   names were supplied by hand. examples/host/ contains sketches, not verified private APIs.
4. Ensure toElementProps forwards config, websocket and normalizeMessage as properties.
   Verify import-time registration matches the loader's expose convention.
5. Replace the navbar list with ONE host definition. The navbar itself is not a subscriber.
6. Set the real endpoint/auth in config or adapt the component's fetch call. The user
   deferred the exact route. /api/interfaces-x is only a placeholder.
7. Use actual business status labels/colors; numeric codes have no invented meaning.
8. Run npm run check, then the private-host integration checks in test/INTERNAL_HOST_INTEGRATION.md.

## Structure and limits

The earlier controller, API abstraction and custom HTMLElement class were removed.
Vue's defineCustomElement owns the wrapper; a watcher owns the component lifecycle.
Retry increments a local counter. Prop changes clean up and restart the collection.
There is no separate reload() element API; remount to explicitly refresh membership.

Tests and the host harness are development-only. Do not copy their mock manager or
fixture API into production. The public federation boundary is tested; the private
host, real endpoint/auth and production deployment need verification in the repo.
See TROUBLESHOOTING.md for focused checks. No additional service architecture is needed.
