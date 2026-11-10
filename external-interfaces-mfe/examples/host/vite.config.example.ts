// Merge these options into the EXISTING host config; do not create a second plugin.
// This file is illustrative and excluded from the runnable harness.
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    vue({ template: { compilerOptions: {
      isCustomElement: tag => tag.startsWith('cust-') || ['cust-external-interfaces'].includes(tag),
    } } }),
    federation({
      name: 'HostVueVite', // Keep your EXISTING host name if it differs.
      hostInitInjectLocation: 'html',
      shared: {
        vue: { singleton: true, requiredVersion: '3.5.29', strictVersion: true },
        vuetify: { singleton: true, requiredVersion: '4.0.7', strictVersion: true },
      },
      remotes: {
        ExternalInterfaces: {
          type: 'var',
          name: 'ExternalInterfaces',
          entry: 'http://127.0.0.1:4173/remoteEntry.var.js', // Resolve via your envResolver.
          entryGlobalName: 'ExternalInterfaces',
          shareScope: 'default',
        },
      },
    }),
  ],
});
