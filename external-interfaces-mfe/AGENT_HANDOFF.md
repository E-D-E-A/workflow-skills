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
Vue's defineCustomElement owns the wrapper. onMounted captures the config, manager
and normalizer once; onBeforeUnmount aborts and unsubscribes. All helper functions
are directly in script setup. There is no watcher or enclosing startInterfacesLoad.
Metadata Retry reuses the initial inputs and existing subscription. Later prop
assignments do not reconfigure the mounted component; remount to load new inputs.
There is no separate reload() element API; remount to explicitly refresh membership.

Tests and the host harness are development-only. Do not copy their mock manager or
fixture API into production. The public federation boundary is tested; the private
host, real endpoint/auth and production deployment need verification in the repo.
See TROUBLESHOOTING.md for focused checks. No additional service architecture is needed.

## Readability and future remotes

Keep template, script, styles in that order. Use meaningful names, assign returned
expressions to named variables, and name logical conditions before testing them.
Avoid excessive chaining. Template rows have prepared labels, colors and conditions.
loadInterfaces coordinates small component-level functions. The component owns one
subscription for its mounted lifetime; an unmounted flag rejects late callbacks.
Keep the captured manager for cleanup even if the host later assigns a new prop.

register.ts stays limited to custom-element and Vuetify bootstrap. Follow
CREATE_ANOTHER_MFE.md to copy that pattern. The host socket/normalizer and interface
metadata are feature-specific, not requirements for every remote. Verify the private
host integration before treating this package as an organization-wide template.
