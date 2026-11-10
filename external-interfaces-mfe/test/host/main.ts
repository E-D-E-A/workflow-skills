import * as Vue from 'vue';
import * as Vuetify from 'vuetify';
import { createInstance } from '@module-federation/enhanced/runtime';
import type { HostWebsocket, MessageListener, NormalizeMessage } from '../../src/contracts';
import type { ExternalInterfacesElement } from '../../src/register';
import { normalizeMessage } from '../../examples/host/normalizer';

class MockCommManager implements HostWebsocket {
  handlers = new Map<string, MessageListener>();
  subscriptions = 0;
  unsubscriptions = 0;
  closes = 0;
  subscribe(topic: string, listener: MessageListener) {
    if (this.handlers.has(topic)) throw new Error('Only one consumer per topic');
    this.handlers.set(topic, listener);
    this.subscriptions++;
  }
  unsubscribe(topic: string) { this.handlers.delete(topic); this.unsubscriptions++; }
  close() { this.closes++; }
  emit(raw: unknown) { this.handlers.get('interface-communication-x')?.(raw); }
}
const websocket = new MockCommManager();
const events: { name: string; detail: any }[] = [];
const hostVuetify = Vuetify.createVuetify();
Vue.createApp({ render: () => Vue.h('div', {
  class: ['host-navbar', `v-theme--${hostVuetify.theme.global.name.value}`],
}, [Vue.h('div', { id: 'remote-slot' })]) }).use(hostVuetify).mount('#app');

// This directly exercises the same enhanced/runtime 2.6.0 family as the private
// generic host. It cannot verify that inaccessible package's own prop/event bridge.
const runtime = createInstance({
  name: 'GenericHostRuntimeHarness',
  remotes: [{ name: 'ExternalInterfaces', entry: 'http://127.0.0.1:4173/remoteEntry.var.js',
    type: 'var', entryGlobalName: 'ExternalInterfaces', shareScope: 'default' }],
  shared: {
    vue: { version: Vue.version, lib: () => Vue, shareConfig: { singleton: true, requiredVersion: '3.5.29' } },
    vuetify: { version: Vuetify.version, lib: () => Vuetify, shareConfig: { singleton: true, requiredVersion: '4.0.7' } },
  },
});

let element: ExternalInterfacesElement | undefined;
const baseConfig = { apiBaseUrl: '/api', interfacesPath: '/interfaces-x' };
let currentConfig = baseConfig;
let currentNormalizer = normalizeMessage;
function phase(value: string) { document.querySelector('#phase')!.textContent = value; }
async function mount(options: { beforeDefinition?: boolean } = {}) {
  phase('LOADING');
  try {
    const make = () => {
      element = document.createElement('cust-external-interfaces') as ExternalInterfacesElement;
      Object.assign(element, { config: JSON.stringify(currentConfig), websocket, normalizeMessage: currentNormalizer });
      for (const name of ['mfe-event', 'componentClick', 'componentDoubleClick', 'componentRightClick']) {
        element.addEventListener(name, event => events.push({ name, detail: (event as CustomEvent).detail }));
      }
      document.querySelector('#remote-slot')!.replaceChildren(element);
    };
    if (options.beforeDefinition) make();
    await runtime.loadRemote('ExternalInterfaces/register');
    await customElements.whenDefined('cust-external-interfaces');
    if (!options.beforeDefinition) make();
    phase('READY');
  } catch (error) {
    phase('ERROR');
    events.push({ name: 'loader-error', detail: String(error) });
  }
}
async function unmount() {
  element?.remove(); element = undefined;
  await Promise.resolve();
}
async function remountWithConfig(value: Record<string, unknown>) {
  await unmount();
  currentConfig = { ...baseConfig, ...value };
  await mount();
}
async function remountWithNormalizer(normalizer: NormalizeMessage) {
  await unmount();
  currentNormalizer = normalizer;
  await mount();
}
function theme(name: 'light' | 'dark') { hostVuetify.theme.change(name); }
window.__harness = { websocket, events, mount, unmount, remountWithConfig, remountWithNormalizer, theme,
  baselineSocketCount: window.__socketCount,
  identity: () => element?.websocket === websocket };
document.querySelector('#emit')!.addEventListener('click', () => websocket.emit({ id: 1, communicationStatus: 7 }));
document.querySelector('#unmount')!.addEventListener('click', () => { void unmount(); });
document.querySelector('#mount')!.addEventListener('click', () => { void mount(); });
document.querySelector('#theme')!.addEventListener('click', () => {
  theme(hostVuetify.theme.global.name.value === 'light' ? 'dark' : 'light');
});
void mount({ beforeDefinition: new URLSearchParams(location.search).has('preupgrade') });

declare global {
  interface Window {
    __harness: { websocket: MockCommManager; events: typeof events; mount: typeof mount;
      unmount: typeof unmount; remountWithConfig: typeof remountWithConfig; remountWithNormalizer: typeof remountWithNormalizer;
      theme: typeof theme; identity: () => boolean; baselineSocketCount: number };
    __socketCount: number;
  }
}
