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
    const topicIsOccupied = this.handlers.has(topic);
    if (topicIsOccupied) {
      const subscriptionError = new Error('Only one consumer per topic');
      throw subscriptionError;
    }
    this.handlers.set(topic, listener);
    this.subscriptions++;
  }

  unsubscribe(topic: string) {
    this.handlers.delete(topic);
    this.unsubscriptions++;
  }

  close() {
    this.closes++;
  }

  emit(rawMessage: unknown) {
    const listener = this.handlers.get('interface-communication-x');
    listener?.(rawMessage);
  }
}

const websocket = new MockCommManager();
const events: { name: string; detail: any }[] = [];
const hostVuetify = Vuetify.createVuetify();
const hostApplication = Vue.createApp({
  render() {
    const themeName = hostVuetify.theme.global.name.value;
    const navbarClasses = ['host-navbar', `v-theme--${themeName}`];
    const remoteSlot = Vue.h('div', { id: 'remote-slot' });
    const navbar = Vue.h('div', { class: navbarClasses }, [remoteSlot]);
    return navbar;
  },
});
hostApplication.use(hostVuetify);
hostApplication.mount('#app');

// This exercises enhanced/runtime 2.6.0. The private generic host's own
// property/event bridge still needs verification inside the internal repo.
const runtime = createInstance({
  name: 'GenericHostRuntimeHarness',
  remotes: [{
    name: 'ExternalInterfaces',
    entry: 'http://127.0.0.1:4173/remoteEntry.var.js',
    type: 'var',
    entryGlobalName: 'ExternalInterfaces',
    shareScope: 'default',
  }],
  shared: {
    vue: {
      version: Vue.version,
      lib: () => {
        return Vue;
      },
      shareConfig: { singleton: true, requiredVersion: '3.5.29' },
    },
    vuetify: {
      version: Vuetify.version,
      lib: () => {
        return Vuetify;
      },
      shareConfig: { singleton: true, requiredVersion: '4.0.7' },
    },
  },
});

let element: ExternalInterfacesElement | undefined;
const baseConfig = { apiBaseUrl: '/api', interfacesPath: '/interfaces-x' };
let currentConfig = baseConfig;
let currentNormalizer = normalizeMessage;

function setLoadingPhase(phase: string) {
  const phaseElement = document.querySelector('#phase')!;
  phaseElement.textContent = phase;
}

function mountRemoteElement() {
  element = document.createElement('cust-external-interfaces') as ExternalInterfacesElement;
  const serializedConfig = JSON.stringify(currentConfig);
  const elementProperties = { config: serializedConfig, websocket, normalizeMessage: currentNormalizer };
  Object.assign(element, elementProperties);

  const eventNames = ['mfe-event', 'componentClick', 'componentDoubleClick', 'componentRightClick'];
  for (const eventName of eventNames) {
    element.addEventListener(eventName, event => {
      const eventDetail = (event as CustomEvent).detail;
      const recordedEvent = { name: eventName, detail: eventDetail };
      events.push(recordedEvent);
    });
  }
  const remoteSlot = document.querySelector('#remote-slot')!;
  remoteSlot.replaceChildren(element);
}

async function mount(options: { beforeDefinition?: boolean } = {}) {
  setLoadingPhase('LOADING');
  const mountBeforeDefinition = options.beforeDefinition === true;
  try {
    if (mountBeforeDefinition) {
      mountRemoteElement();
    }
    await runtime.loadRemote('ExternalInterfaces/register');
    await customElements.whenDefined('cust-external-interfaces');
    const mountAfterDefinition = mountBeforeDefinition === false;
    if (mountAfterDefinition) {
      mountRemoteElement();
    }
    setLoadingPhase('READY');
  } catch (error) {
    setLoadingPhase('ERROR');
    const errorMessage = String(error);
    const loaderError = { name: 'loader-error', detail: errorMessage };
    events.push(loaderError);
  }
}

async function unmount() {
  element?.remove();
  element = undefined;
  await Promise.resolve();
}

async function remountWithConfig(configuration: Record<string, unknown>) {
  await unmount();
  currentConfig = { ...baseConfig, ...configuration };
  await mount();
}

async function remountWithNormalizer(normalizer: NormalizeMessage) {
  await unmount();
  currentNormalizer = normalizer;
  await mount();
}

function theme(themeName: 'light' | 'dark') {
  hostVuetify.theme.change(themeName);
}

function identity() {
  const usesOriginalManager = element?.websocket === websocket;
  return usesOriginalManager;
}

window.__harness = {
  websocket,
  events,
  mount,
  unmount,
  remountWithConfig,
  remountWithNormalizer,
  theme,
  identity,
  baselineSocketCount: window.__socketCount,
};

const emitButton = document.querySelector('#emit')!;
emitButton.addEventListener('click', () => {
  const statusMessage = { id: 1, communicationStatus: 7 };
  websocket.emit(statusMessage);
});
const unmountButton = document.querySelector('#unmount')!;
unmountButton.addEventListener('click', () => {
  void unmount();
});
const mountButton = document.querySelector('#mount')!;
mountButton.addEventListener('click', () => {
  void mount();
});
const themeButton = document.querySelector('#theme')!;
themeButton.addEventListener('click', () => {
  const isLightTheme = hostVuetify.theme.global.name.value === 'light';
  const nextTheme = isLightTheme ? 'dark' : 'light';
  theme(nextTheme);
});

const searchParameters = new URLSearchParams(location.search);
const beforeDefinition = searchParameters.has('preupgrade');
void mount({ beforeDefinition });

declare global {
  interface Window {
    __harness: {
      websocket: MockCommManager;
      events: typeof events;
      mount: typeof mount;
      unmount: typeof unmount;
      remountWithConfig: typeof remountWithConfig;
      remountWithNormalizer: typeof remountWithNormalizer;
      theme: typeof theme;
      identity: typeof identity;
      baselineSocketCount: number;
    };
    __socketCount: number;
  }
}
