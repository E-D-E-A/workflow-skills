import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import '../../src/register';
import { parseInputs, type MessageListener } from '../../src/contracts';
import type { ExternalInterfacesElement } from '../../src/register';

const metadata = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: null, type: null },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: null },
];
function createMetadataResponse(data: unknown = metadata) {
  const serializedData = JSON.stringify(data);
  const metadataResponse = new Response(serializedData);
  return metadataResponse;
}

async function flushUpdates() {
  const nextTask = new Promise<void>(resolve => {
    setTimeout(() => { resolve(); }, 0);
  });
  await nextTask;
  await nextTick();
}

function mount(options: {
  fetcher?: () => Promise<Response>;
  subscribeFails?: boolean;
  normalizeMessage?: (rawMessage: unknown) => unknown;
} = {}) {
  const defaultFetcher = async () => {
    const metadataResponse = createMetadataResponse();
    return metadataResponse;
  };
  const fetcher = vi.fn(options.fetcher ?? defaultFetcher);
  vi.stubGlobal('fetch', fetcher);

  let messageListener: MessageListener = () => {};
  const websocket = {
    subscribe: vi.fn((_topic: string, listener: MessageListener) => {
      messageListener = listener;
    }),
    unsubscribe: vi.fn(),
  };
  const subscribeFails = options.subscribeFails === true;
  if (subscribeFails) {
    websocket.subscribe.mockImplementation(() => {
      const subscriptionError = new Error('Topic is occupied');
      throw subscriptionError;
    });
  }

  const defaultNormalizer = (rawMessage: unknown) => {
    return rawMessage;
  };
  const normalizeMessage = options.normalizeMessage ?? defaultNormalizer;
  const element = document.createElement('cust-external-interfaces') as ExternalInterfacesElement;
  const serializedConfig = JSON.stringify({ apiBaseUrl: '/api' });
  const elementProperties = { config: serializedConfig, websocket, normalizeMessage };
  Object.assign(element, elementProperties);
  document.body.append(element);

  const fixture = {
    element,
    websocket,
    fetcher,
    emit(rawMessage: unknown) {
      messageListener(rawMessage);
    },
  };
  return fixture;
}

afterEach(async () => {
  document.body.replaceChildren();
  await flushUpdates();
  vi.unstubAllGlobals();
});

describe('collection component', () => {
  it('captures inputs once and ignores later property assignments', async () => {
    let resolveRequest!: (response: Response) => void;
    const fetcher = vi.fn(() => {
      const pendingRequest = new Promise<Response>(resolve => { resolveRequest = resolve; });
      return pendingRequest;
    });
    const fixture = mount({ fetcher });
    await flushUpdates();
    const replacementWebsocket = { subscribe: vi.fn(), unsubscribe: vi.fn() };
    fixture.element.config = JSON.stringify({ apiBaseUrl: '/replacement-api' });
    fixture.element.websocket = replacementWebsocket;
    fixture.element.normalizeMessage = () => {
      const ignoredMessage = null;
      return ignoredMessage;
    };
    await flushUpdates();
    fixture.emit({ id: 1, connectionStatus: 7 });
    const metadataResponse = createMetadataResponse();
    resolveRequest(metadataResponse);
    await flushUpdates();
    expect(fixture.element.textContent).toContain('Status 7');
    expect(fixture.fetcher).toHaveBeenCalledTimes(1);
    expect(replacementWebsocket.subscribe).not.toHaveBeenCalled();
    fixture.element.remove();
    await flushUpdates();
    expect(fixture.websocket.unsubscribe).toHaveBeenCalledTimes(1);
    expect(replacementWebsocket.unsubscribe).not.toHaveBeenCalled();
  });

  it('continues receiving updates after a normalizer throws', async () => {
    const normalizer = vi.fn();
    normalizer.mockImplementationOnce(() => {
      const normalizerError = new Error('Invalid client envelope');
      throw normalizerError;
    });
    normalizer.mockReturnValue({ id: 1, connectionStatus: 8 });
    const fixture = mount({ normalizeMessage: normalizer });
    await flushUpdates();
    fixture.emit({});
    fixture.emit({});
    await flushUpdates();
    expect(fixture.element.textContent).toContain('Status 8');
    expect(normalizer).toHaveBeenCalledTimes(2);
  });

  it('fetches and subscribes once, normalizes and updates only the matching row', async () => {
    const fixture = mount();
    await flushUpdates();
    expect(fixture.fetcher).toHaveBeenCalledTimes(1);
    expect(fixture.websocket.subscribe).toHaveBeenCalledTimes(1);
    fixture.emit({ id: 1, connectionStatus: 7 });
    await flushUpdates();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
    expect(fixture.element.querySelector('[data-interface-id="2"]')?.textContent).toContain('Unknown');
    fixture.emit({ id: '1', connectionStatus: 9 });
    fixture.emit(null);
    fixture.emit({ id: 999, connectionStatus: 9 });
    await flushUpdates();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
  });

  it('preserves early live updates, including null, over the REST snapshot', async () => {
    let resolveRequest!: (response: Response) => void;
    const pendingResponse = new Promise<Response>(resolve => { resolveRequest = resolve; });
    const fetcher = () => {
      return pendingResponse;
    };
    const fixture = mount({ fetcher });
    await flushUpdates();
    fixture.emit({ id: 1, connectionStatus: 7 });
    fixture.emit({ id: 1, connectionStatus: null });
    const metadataResponse = createMetadataResponse();
    resolveRequest(metadataResponse);
    await flushUpdates();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Unknown');
  });

  it.each(['success', 'failure'])('unsubscribes once and ignores late request %s and callbacks', async outcome => {
    let resolveRequest!: (response: Response) => void;
    let rejectRequest!: (error: Error) => void;
    const pendingResponse = new Promise<Response>((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    const fetcher = () => {
      return pendingResponse;
    };
    const fixture = mount({ fetcher });
    await flushUpdates();
    const onMfeEvent = vi.fn();
    fixture.element.addEventListener('mfe-event', onMfeEvent);
    fixture.element.remove();
    await flushUpdates();
    expect(fixture.websocket.unsubscribe).toHaveBeenCalledExactlyOnceWith('interface-communication-x');
    const requestSucceeded = outcome === 'success';
    if (requestSucceeded) {
      const metadataResponse = createMetadataResponse();
      resolveRequest(metadataResponse);
    } else {
      const requestError = new Error('Network failure');
      rejectRequest(requestError);
    }
    fixture.emit({ id: 1, connectionStatus: 5 });
    await flushUpdates();
    expect(onMfeEvent).not.toHaveBeenCalled();
    expect(fixture.element.querySelector('[data-interface-id]')).toBeNull();
  });

  it('does not unsubscribe another owner when subscribing fails', async () => {
    const fixture = mount({ subscribeFails: true });
    await flushUpdates();
    expect(fixture.element.textContent).toContain('Unable to subscribe');
    expect(fixture.fetcher).not.toHaveBeenCalled();
    fixture.element.remove();
    await flushUpdates();
    expect(fixture.websocket.unsubscribe).not.toHaveBeenCalled();
  });

  it('retries invalid metadata using the existing subscription', async () => {
    const invalidResponse = createMetadataResponse({ invalid: true });
    const validResponse = createMetadataResponse();
    const fetcher = vi.fn();
    fetcher.mockResolvedValueOnce(invalidResponse);
    fetcher.mockResolvedValue(validResponse);
    const fixture = mount({ fetcher });
    await flushUpdates();
    expect(fixture.element.textContent).toContain('Unable to load');
    expect(fixture.websocket.unsubscribe).not.toHaveBeenCalled();
    fixture.emit({ id: 1, connectionStatus: 9 });
    const retryButton = fixture.element.querySelector('.v-btn') as HTMLButtonElement;
    retryButton.click();
    await flushUpdates();
    expect(fixture.element.querySelectorAll('[data-interface-id]')).toHaveLength(2);
    expect(fixture.websocket.subscribe).toHaveBeenCalledTimes(1);
    expect(fixture.element.textContent).toContain('Status 9');
  });
});

function ignoreMessage() {
  const ignoredMessage = null;
  return ignoredMessage;
}

describe('input contract', () => {
  it('preserves a class instance and its private-field method receiver', () => {
    class Manager {
      #calls = 0;
      subscribe() {
        this.#calls += 1;
        const subscriptionCount = this.#calls;
        return subscriptionCount;
      }
      unsubscribe() {}
    }
    const websocket = new Manager();
    const validatedInputs = parseInputs('{"apiBaseUrl":"/api"}', websocket, ignoreMessage);
    expect(validatedInputs.websocket).toBe(websocket);
    expect(validatedInputs.websocket.subscribe('topic', () => {})).toBe(1);
  });

  it.each([{}, { subscribe() {} }, { subscribe: 1, unsubscribe() {} }])('requires both callable methods', websocket => {
    expect(() => {
      parseInputs('{"apiBaseUrl":"/api"}', websocket, ignoreMessage);
    }).toThrow();
  });

  it('requires JSON config and a normalizer function', () => {
    const websocket = { subscribe() {}, unsubscribe() {} };
    expect(() => {
      parseInputs('{', websocket, ignoreMessage);
    }).toThrow();
    expect(() => {
      parseInputs('{"apiBaseUrl":"/api"}', websocket, 'serialized function');
    }).toThrow();
  });
});
