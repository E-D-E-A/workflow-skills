import type { HostWebsocket, NormalizeMessage, RemoteConfigInput } from '../../src/contracts';

/** Structural example from the supplied schema, NOT verified private-package types.
 * Copy into the host and check against its actual exported registry type.
 * Capture the original CommManager once; never put it in serializable config.
 */
export function createMfeRegistry(websocket: HostWebsocket, normalizeMessage: NormalizeMessage) {
  const registry = {
    ExternalInterfaces: {
      federation: {
        type: 'var' as const,
        name: 'ExternalInterfaces',
        entryEnvKey: 'VITE_EXTERNAL_INTERFACES_ENTRY_URL',
        entryGlobalName: 'ExternalInterfaces',
        shareScope: 'default',
        exposedModule: './register',
        wrapperElementName: 'cust-external-interfaces',
      },
      runtime: {
        // apiBaseUrl is explicit below because the private helper's mapping of
        // dataServerUrlEnvKey to config fields was not supplied. Add that optional
        // field only after confirming whether it produces dataServerUrl or apiBaseUrl.
        defaultConfig: {
          apiBaseUrl: '/api',
          interfacesPath: '/interfaces-x', // TODO: exact internal endpoint
          topic: 'interface-communication-x',
          credentials: 'same-origin',
        } satisfies RemoteConfigInput,
        // eventMap is intentionally omitted: its mapping syntax is internal.
        toElementProps(config: Record<string, unknown>) {
          const serializedConfig = JSON.stringify(config);
          const elementProperties = {
            config: serializedConfig,
            websocket,        // JavaScript property, same original object
            normalizeMessage, // JavaScript property, function reference
          };
          return elementProperties;
        },
      },
    },
  };
  return registry;
}
