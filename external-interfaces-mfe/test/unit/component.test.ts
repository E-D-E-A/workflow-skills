import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import '../../src/register';
import { parseInputs, type MessageListener } from '../../src/contracts';
import type { ExternalInterfacesElement } from '../../src/register';

const metadata = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: null, type: null },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: null },
];
const response = (data: unknown = metadata) => new Response(JSON.stringify(data));
const flush = async () => { await new Promise(resolve => setTimeout(resolve, 0)); await nextTick(); };
function mount(fetcher = vi.fn(async () => response()), subscribeFails = false) {
  vi.stubGlobal('fetch', fetcher);
  let callback: MessageListener = () => {};
  const websocket = {
    subscribe: vi.fn((_topic: string, listener: MessageListener) => { callback = listener; }),
    unsubscribe: vi.fn(),
  };
  const el = document.createElement('cust-external-interfaces') as ExternalInterfacesElement;
  Object.assign(el, { config: JSON.stringify({ apiBaseUrl: '/api' }), websocket,
    normalizeMessage: (raw: unknown) => raw });
  if (subscribeFails) websocket.subscribe.mockImplementation(() => { throw new Error('occupied'); });
  document.body.append(el);
  return { el, websocket, fetcher, emit: (raw: unknown) => callback(raw) };
}
afterEach(async () => { document.body.replaceChildren(); await flush(); vi.unstubAllGlobals(); });

describe('collection component', () => {
  it('fetches and subscribes once, normalizes and updates only the matching row', async () => {
    const f = mount(); await flush();
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    expect(f.websocket.subscribe).toHaveBeenCalledTimes(1);
    f.emit({ id: 1, connectionStatus: 7 }); await flush();
    expect(f.el.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
    expect(f.el.querySelector('[data-interface-id="2"]')?.textContent).toContain('Unknown');
    f.emit({ id: '1', connectionStatus: 9 }); f.emit(null); f.emit({ id: 999, connectionStatus: 9 });
    await flush();
    expect(f.el.querySelector('[data-interface-id="1"]')?.textContent).toContain('Status 7');
  });
  it('preserves early live updates, including null, over the REST snapshot', async () => {
    let resolve!: (response: Response) => void;
    const f = mount(vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    await flush(); f.emit({ id: 1, connectionStatus: 7 }); f.emit({ id: 1, connectionStatus: null });
    resolve(response()); await flush();
    expect(f.el.querySelector('[data-interface-id="1"]')?.textContent).toContain('Unknown');
  });
  it('aborts on unmount, unsubscribes once, and ignores late requests/callbacks', async () => {
    let resolve!: (response: Response) => void;
    const f = mount(vi.fn(() => new Promise<Response>(done => { resolve = done; })));
    await flush();
    const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal!;
    f.el.remove(); await flush();
    expect(signal.aborted).toBe(true);
    expect(f.websocket.unsubscribe).toHaveBeenCalledExactlyOnceWith('interface-communication-x');
    resolve(response()); f.emit({ id: 1, connectionStatus: 5 }); await flush();
    expect(f.el.querySelector('[data-interface-id]')).toBeNull();
  });
  it('does not unsubscribe another owner when subscribing fails', async () => {
    const f = mount(undefined, true);
    await flush();
    expect(f.el.textContent).toContain('Unable to subscribe');
    expect(f.fetcher).not.toHaveBeenCalled();
    f.el.remove(); await flush();
    expect(f.websocket.unsubscribe).not.toHaveBeenCalled();
  });
  it('cleans up after invalid metadata and retries with one new subscription', async () => {
    const f = mount(vi.fn().mockResolvedValueOnce(response({ invalid: true })).mockResolvedValue(response()));
    await flush();
    expect(f.el.textContent).toContain('Unable to load');
    expect(f.websocket.unsubscribe).toHaveBeenCalledTimes(1);
    (f.el.querySelector('.v-btn') as HTMLButtonElement).click(); await flush();
    expect(f.el.querySelectorAll('[data-interface-id]')).toHaveLength(2);
    expect(f.websocket.subscribe).toHaveBeenCalledTimes(2);
  });
});

describe('input contract', () => {
  it('preserves a class instance and its private-field method receiver', () => {
    class Manager {
      #calls = 0;
      subscribe() { return ++this.#calls; }
      unsubscribe() {}
    }
    const ws = new Manager();
    const parsed = parseInputs('{"apiBaseUrl":"/api"}', ws, () => null);
    expect(parsed.websocket).toBe(ws);
    expect(parsed.websocket.subscribe('topic', () => {})).toBe(1);
  });
  it.each([{}, { subscribe() {} }, { subscribe: 1, unsubscribe() {} }])('requires both callable methods', ws => {
    expect(() => parseInputs('{"apiBaseUrl":"/api"}', ws, () => null)).toThrow();
  });
  it('requires JSON config and a normalizer function', () => {
    const ws = { subscribe() {}, unsubscribe() {} };
    expect(() => parseInputs('{', ws, () => null)).toThrow();
    expect(() => parseInputs('{"apiBaseUrl":"/api"}', ws, 'serialized function')).toThrow();
  });
});
