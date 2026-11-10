import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { federation } from '@module-federation/vite';
import vue from '@vitejs/plugin-vue';
import { SHARED_DEPENDENCIES } from '../../federation.constants';

const hostDirectoryUrl = new URL('.', import.meta.url);
const hostDirectory = fileURLToPath(hostDirectoryUrl);
const buildDirectoryUrl = new URL('../../dist-host', import.meta.url);
const buildDirectory = fileURLToPath(buildDirectoryUrl);

export default defineConfig({
  root: hostDirectory,
  base: 'http://127.0.0.1:4174/',
  build: { outDir: buildDirectory, emptyOutDir: true, target: 'es2022' },
  plugins: [
    vue(),
    federation({
      name: 'HostVueVite',
      shared: SHARED_DEPENDENCIES,
      hostInitInjectLocation: 'html',
      dts: false,
    }),
  ],
  server: { port: 4174, strictPort: true, hmr: false },
  preview: { port: 4174, strictPort: true },
});
