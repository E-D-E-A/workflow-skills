# Create another Vue/Vuetify MFE for this host

Use this project as a small template. The reusable part is the federation and
custom-element bootstrap; the interfaces collection is one feature built on it.
First verify the initial remote through your actual private generic host. The
included harness tests the public runtime, not that package's property/event bridge.

## What to copy

| Files | What to do |
| --- | --- |
| `vite.config.ts`, `federation.constants.ts` | Copy, then change the remote identity, ports and public asset URL |
| `src/register.ts` | Copy; replace the component import and exported constructor/registration names |
| `src/entry.ts`, `index.html` | Keep the async bootstrap; update the page title |
| `package.json`, lockfile, `tsconfig.json` | Keep host-compatible versions; change the package name |
| `examples/host/registry.ts` and host Vite example | Adapt the entry key, URL, tag and feature properties |
| Component, `src/contracts.ts`, `src/externalInterfacesData.ts` | Replace with the new feature's UI, inputs and validation |

Do not copy the interface REST request, status buffer, normalizer or WebSocket
dependency into a feature that does not need them. Do not import this remote into
the next remote just to reuse its bootstrap. There is no shared runtime helper to
install. Introduce one only after real remotes demonstrate a useful common contract.

## Choose names once

For an example `TaskSummary` remote:

| Setting | Example |
| --- | --- |
| Federation `name` in constants | `TaskSummary` |
| Host Vite remote key and registry federation name | `TaskSummary` |
| `entryGlobalName` | `TaskSummary` |
| Import / loadRemote request | `TaskSummary/register` |
| Expose key / registry `exposedModule` | `./register` |
| Custom element / `wrapperElementName` | `cust-task-summary` |
| Entry environment variable | `VITE_TASK_SUMMARY_ENTRY_URL` |

The first four rows must use the same container name, including case. The tag must
be unique and contain a hyphen. Keep the host application's existing federation
name; it is independent of remote names.

## Keep the bootstrap narrow

`register.ts` does only three things:

1. Wrap the feature component with Vue's `defineCustomElement`.
2. Install and dispose the local Vuetify instance.
3. Register the tag once, exporting a constructor and registration function.

Keep fetching, subscriptions, business validation and local state in the feature.
For navbar-like placements, light DOM plus `createVuetify({ theme: false })` inherits
the surrounding host theme. A remote that needs isolated styling or an independent
theme should choose that deliberately; this setup is specific to this Vue/Vuetify host.

## Define feature properties

Keep serializable configuration in the JSON `config` property. Pass any live host
services/functions as separate JavaScript properties. Validate only the capabilities
the feature actually needs. This feature captures config and live properties once in onMounted. Supply them
before mounting; remount to change them. Another feature that needs live config
updates can deliberately implement that behavior. The current `websocket` and
`normalizeMessage` properties
are external-interfaces requirements, not mandatory MFE inputs.

Use the host's existing registry and `toElementProps` convention. Preserve service
identity; avoid putting instances into JSON or deep reactive config. Keep component
input names, schema names and property names in the registry aligned.

## Build and load

- Keep Vue/Vuetify root imports shared as compatible singletons in the same scope.
- Keep `varFilename` and point the host's `type: 'var'` entry at `remoteEntry.var.js`.
- Set `MFE_PUBLIC_BASE` to the new remote's asset directory, with a trailing slash.
- Publish the entire `dist` directory; the var wrapper imports the ESM entry and chunks.
- Add the unique tag to the host compiler's custom-element rules if needed.
- Importing `./register` defines the tag. Match this convention to the real private loader.

## Code conventions

- Vue file order: template, script, styles.
- Give the template named display values and conditions.
- Use descriptive names and intermediate variables for function results and logical
  expressions before returning them or testing them in conditions.
- Split loading into named operations that each have one responsibility. Keep the
  coordinating function short and cleanup beside the resources it owns.
- Use explicit callback bodies for array operations and lifecycle hooks. For example:

  ```ts
  const displayRows = interfaces.value.map(externalInterface => {
    const displayRow = createInterfaceRow(externalInterface);
    return displayRow;
  });
  ```

- Keep the original live normalizer/manager references when passing host properties.
- Avoid nested calls and long operation chains. Fluent schema declarations and test
  assertions can retain their normal API syntax.
- Extract a plain helper when it improves navigation or is reused. A new service,
  controller or composable is not required for every remote.

## Minimum verification for the next feature

Adapt the harness so it no longer imports the interfaces normalizer, manager, API
fixtures or row selectors. Keep a test that loads the real built var entry through
the host runtime, passes properties, renders the feature, unmounts and remounts it.
Test failed entry loading, any feature-specific async cleanup, and inherited theme.
Run the same scenario through the actual generic host before standardizing the template.

The full browser harness is development-only. It does not belong in deployed feature
code and its test globals must not be added to the production host.
