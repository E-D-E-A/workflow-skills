// Golden rule: remote name = host remote key = entryGlobalName = import prefix.
export const REMOTE_NAME = 'ExternalInterfaces';
export const EXPOSED_MODULE = './register';
export const WRAPPER_ELEMENT_NAME = 'cust-external-interfaces';
export const VAR_ENTRY_FILENAME = 'remoteEntry.var.js';
export const SHARED_DEPENDENCIES = {
  vue: { singleton: true, requiredVersion: '3.5.29', strictVersion: true },
  vuetify: { singleton: true, requiredVersion: '4.0.7', strictVersion: true },
};
