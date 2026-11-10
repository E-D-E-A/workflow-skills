import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import '../../src/register';
import { parseInputs, type MessageListener } from '../../src/contracts';
import type { ExternalInterfacesElement } from '../../src/register';

const metadata = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: null, type: null },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: null },
];
function response(data: unknown = metadata) {
  const serializedData = JSON.stringify(data);
  const metadataResponse = new Response(serializedData);
  return metadataResponse;
}
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
function mount(fetcher = vi.fn(async () => response()), subscribeFails = false) {
  vi.stubGlobal('fetch', fetcher);
  let callback: MessageListener = () => {};
  const websocket = {
    subscribe: vi.fn((_topic: string, listener: MessageListener) => { callback = listener; }),
    unsubscribe: vi.fn(),
  };
  const element = document.createElement('cust-external-interfaces') as ExternalInterfacesElement;
  Object.assign(element, { config: JSON.stringify({ apiBaseUrl: '/api' }), websocket,
    normalizeMessage: (rawMessage: unknown) => rawMessage });
  if (subscribeFails) websocket.subscribe.mockImplementation(() => { throw new Error('occupied'); });
  document.body.append(element);
  const fixture = { element, websocket, fetcher, emit: (rawMessage: unknown) => { callback(rawMessage); } };
  return fixture;
}
afterEach(async () => { document.body.replaceChildren(); await flush(); vi.unstubAllGlobals(); });

describe('collection component', () => {
  it('discards the old response after configuration changes while a new request is pending', async () => {
    const requestResolvers: Array<(response: Response) => void> = [];
    const fetcher = vi.fn(() => {
      const pendingRequest = new Promise<Response>(resolveRequest => {
        requestResolvers.push(resolveRequest);
      });
      return pendingRequest;
    });
    const fixture = mount(fetcher);
    await flush();
    const nextConfiguration = JSON.stringify({ apiBaseUrl: '/replacement-api' });
    fixture.element.config = nextConfiguration;
    await flush();

    const staleResponse = response();
    requestResolvers[0](staleResponse);
    await flush();
    expect(fixture.element.textContent).toContain('Loading interfaces');
    expect(fixture.element.querySelector('[data-interface-id]')).toBeNull();

    const freshMetadata = [{ ...metadata[0], connectionStatus: 7 }];
    const freshResponse = response(freshMetadata);
    requestResolvers[1](freshResponse);
    await flush();
    expect(fixture.element.textContent).toContain('Status 7');
    expect(fixture.websocket.unsubscribe).toHaveBeenCalledTimes(1);
    expect(fixture.websocket.subscribe).toHaveBeenCalledTimes(2);
  });

  it('continues receiving updates after a normalizer throws', async () => {
    const fixture = mount();
    await flush();
    const normalizer = vi.fn();
    normalizer.mockImplementationOnce(() => { throw new Error('Invalid client envelope'); });
    normalizer.mockReturnValue({ id: 1, connectionStatus: 8 });
    fixture.element.normalizeMessage = normalizer;
    await flush();
    fixture.emit({});
    fixture.emit({});
    await flush();
    expect(fixture.element.textContent).toContain('Status 8');
    expect(normalizer).toHaveBeenCalledTimes(2);
  });

  it('fetches and subscribes once, normalizes and updates only the matching row', async () => {
    const fixture = mount(); await flush();
    expect(fixture.fetcher).toHaveBeenCalledTimes(1);
    expect(fixture.websocket.subscribe).toHaveBeenCalledTimes(1);
    fixture.emit({ id: 1, connectionStatus: 7 }); await flush();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
    expect(fixture.element.querySelector('[data-interface-id="2"]')?.textContent).toContain('Unknown');
    fixture.emit({ id: '1', connectionStatus: 9 }); fixture.emit(null); fixture.emit({ id: 999, connectionStatus: 9 });
    await flush();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
  });
  it('preserves early live updates, including null, over the REST snapshot', async () => {
    let resolve!: (response: Response) => void;
    const fixture = mount(vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    await flush(); fixture.emit({ id: 1, connectionStatus: 7 }); fixture.emit({ id: 1, connectionStatus: null });
    resolve(response()); await flush();
    expect(fixture.element.querySelector('[data-interface-id="1"]')?.textContent).toContain('Unknown');
  });
  it('aborts on unmount, unsubscribes once, and ignores late requests/callbacks', async () => {
    let resolve!: (response: Response) => void;
    const fixture = mount(vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    await flush();
    const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal!;
    fixture.element.remove(); await flush();
    expect(signal.aborted).toBe(true);
    expect(fixture.websocket.unsubscribe).toHaveBeenCalledExactlyOnceWith('interface-communication-x');
    resolve(response()); fixture.emit({ id: 1, connectionStatus: 5 }); await flush();
    expect(fixture.element.querySelector('[data-interface-id]')).toBeNull();
  });
  it('does not unsubscribe another owner when subscribing fails', async () => {
    const fixture = mount(undefined, true);
    await flush();
    expect(fixture.element.textContent).toContain('Unable to subscribe');
    expect(fixture.fetcher).not.toHaveBeenCalled();
    fixture.element.remove(); await flush();
    expect(fixture.websocket.unsubscribe).not.toHaveBeenCalled();
  });
  it('cleans up after invalid metadata and retries with one new subscription', async () => {
    const fixture = mount(vi.fn().mockResolvedValueOnce(response({ invalid: true })).mockResolvedValue(response()));
    await flush();
    expect(fixture.element.textContent).toContain('Unable to load');
    expect(fixture.websocket.unsubscribe).toHaveBeenCalledTimes(1);
    (fixture.element.querySelector('.v-btn') as HTMLButtonElement).click(); await flush();
    expect(fixture.element.querySelectorAll('[data-interface-id]')).toHaveLength(2);
    expect(fixture.websocket.subscribe).toHaveBeenCalledTimes(2);
  });
});

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
    const validatedInputs = parseInputs('{"apiBaseUrl":"/api"}', websocket, () => null);
    expect(validatedInputs.websocket).toBe(websocket);
    expect(validatedInputs.websocket.subscribe('topic', () => {})).toBe(1);
  });
  it.each([{}, { subscribe() {} }, { subscribe: 1, unsubscribe() {} }])('requires both callable methods', websocket => {
    expect(() => parseInputs('{"apiBaseUrl":"/api"}', websocket, () => null)).toThrow();
  });
  it('requires JSON config and a normalizer function', () => {
    const websocket = { subscribe() {}, unsubscribe() {} };
    expect(() => parseInputs('{', websocket, () => null)).toThrow();
    expect(() => parseInputs('{"apiBaseUrl":"/api"}', websocket, 'serialized function')).toThrow();
  });
});
