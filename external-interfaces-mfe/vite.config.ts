import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { federation } from '@module-federation/vite';
import { EXPOSED_MODULE, REMOTE_NAME, SHARED_DEPENDENCIES, VAR_ENTRY_FILENAME } from './federation.constants';

export default defineConfig(({ mode }) => {
  const projectDirectory = process.cwd();
  const environmentVariables = loadEnv(mode, projectDirectory, '');
  const publicBaseUrl = environmentVariables.MFE_PUBLIC_BASE || 'http://127.0.0.1:4173/';
  const viteConfiguration = {
    // Set an absolute deployment URL including its trailing slash in production.
    base: publicBaseUrl,
    plugins: [
      vue(),
      federation({
        name: REMOTE_NAME,
        filename: 'remoteEntry.js', // ESM entry; do NOT use for a type: 'var' host.
        varFilename: VAR_ENTRY_FILENAME,
        exposes: { [EXPOSED_MODULE]: './src/register.ts' },
        shared: SHARED_DEPENDENCIES,
        shareScope: 'default',
        hostInitInjectLocation: 'html',
        manifest: true,
        dts: false,
      }),
    ],
    build: { target: 'es2022', sourcemap: true },
    server: { port: 4173, strictPort: true, cors: true, origin: 'http://127.0.0.1:4173' },
    preview: { port: 4173, strictPort: true, cors: true },
  };
  return viteConfiguration;
});
