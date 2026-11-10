import { describe, expect, it, vi } from 'vitest';
import { configSchema, parseInputs, type HostWebsocket, type MessageListener,
  type NormalizeMessage, type Snapshot } from '../../src/contracts';
import { createInterfacesController } from '../../src/controller';
import { metadataUrl } from '../../src/api';

const rows = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: 'ERP', type: 'example' },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: null },
];
function response(data: unknown = rows, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function fixture(overrides: { normalizeMessage?: NormalizeMessage; fetcher?: ReturnType<typeof vi.fn>; websocket?: HostWebsocket } = {}) {
  let callback: MessageListener = () => {};
  const websocket = overrides.websocket ?? {
    subscribe: vi.fn((_topic: string, handler: MessageListener) => { callback = handler; }),
    unsubscribe: vi.fn(),
  };
  const normalizeMessage = overrides.normalizeMessage ?? vi.fn(raw => raw as ReturnType<NormalizeMessage>);
  const snapshots: Snapshot[] = [];
  const onDiagnostic = vi.fn();
  const fetcher = overrides.fetcher ?? vi.fn(async () => response());
  const config = configSchema.parse({ apiBaseUrl: '/api' });
  const controller = createInterfacesController({ config, websocket, normalizeMessage, fetcher,
    onSnapshot: snapshot => snapshots.push(snapshot), onDiagnostic });
  return { ...controller, websocket, normalizeMessage, fetcher, snapshots, onDiagnostic,
    emit: (message: unknown) => callback(message), latest: () => snapshots.at(-1)! };
}

describe('collection controller', () => {
  it('fetches the collection once, subscribes once, and updates only the matching row', async () => {
    const f = fixture();
    await f.start(); await f.start();
    const untouched = f.latest().interfaces[1];
    f.emit({ id: 1, connectionStatus: 7 });
    expect(f.latest().interfaces[0].connectionStatus).toBe(7);
    expect(f.latest().interfaces[1]).toBe(untouched);
    expect(f.websocket.subscribe).toHaveBeenCalledTimes(1);
    expect(f.fetcher).toHaveBeenCalledTimes(1);
    expect(f.fetcher).toHaveBeenCalledWith('/api/interfaces-x', expect.objectContaining({ method: 'GET', credentials: 'same-origin' }));
    expect(f.normalizeMessage).toHaveBeenCalledTimes(1);
    f.stop();
  });
  it('uses a completely different host message shape through the normalizer', async () => {
    const f = fixture({ normalizeMessage: raw => {
      const message = raw as { payload: { key: number; state: number } };
      return { id: message.payload.key, connectionStatus: message.payload.state };
    } });
    await f.start(); f.emit({ payload: { key: 2, state: 8 } });
    expect(f.latest().interfaces[1].connectionStatus).toBe(8);
    f.stop();
  });
  it('keeps the latest early websocket value, including null, over stale REST data', async () => {
    const request = deferred<Response>();
    const f = fixture({ fetcher: vi.fn(() => request.promise) });
    const started = f.start();
    f.emit({ id: 1, connectionStatus: 8 });
    f.emit({ id: 1, connectionStatus: null });
    f.emit({ id: 999, connectionStatus: 4 });
    request.resolve(response()); await started;
    expect(f.latest().interfaces.map(item => item.id)).toEqual([1, 2]);
    expect(f.latest().interfaces[0].connectionStatus).toBeNull();
    f.stop();
  });
  it('ignores unknown IDs and null normalizer results without publishing', async () => {
    const f = fixture(); await f.start();
    const count = f.snapshots.length;
    f.emit(null); f.emit({ id: 900, connectionStatus: 8 });
    expect(f.snapshots).toHaveLength(count);
    f.stop();
  });
  it('rejects invalid normalized output while preserving valid UI state', async () => {
    const f = fixture(); await f.start();
    f.emit({ id: '1', connectionStatus: 9 });
    f.emit({ id: 1, connectionStatus: 'online' });
    f.emit(undefined);
    expect(f.latest().interfaces[0].connectionStatus).toBe(0);
    expect(f.onDiagnostic).toHaveBeenCalledTimes(3);
    expect(f.onDiagnostic).toHaveBeenLastCalledWith(expect.objectContaining({ code: 'INVALID_UPDATE' }));
    f.stop();
  });
  it('contains a throwing normalizer and continues receiving later messages', async () => {
    const normalizer = vi.fn().mockImplementationOnce(() => { throw new Error('bad message'); })
      .mockReturnValue({ id: 1, connectionStatus: 3 });
    const f = fixture({ normalizeMessage: normalizer }); await f.start();
    f.emit({}); f.emit({});
    expect(f.onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'NORMALIZER_FAILED' }));
    expect(f.latest().interfaces[0].connectionStatus).toBe(3);
    f.stop();
  });
  it('aborts and unsubscribes once; late REST and queued messages cannot publish', async () => {
    const request = deferred<Response>();
    const f = fixture({ fetcher: vi.fn(() => request.promise) });
    const started = f.start();
    const signal = f.fetcher.mock.calls[0][1].signal as AbortSignal;
    f.stop(); f.stop();
    expect(signal.aborted).toBe(true);
    expect(f.websocket.unsubscribe).toHaveBeenCalledExactlyOnceWith('interface-communication-x');
    const count = f.snapshots.length;
    f.emit({ id: 1, connectionStatus: 8 });
    request.resolve(response()); await started;
    expect(f.snapshots).toHaveLength(count);
    expect(f.normalizeMessage).not.toHaveBeenCalled();
  });
  it('uses the original manager as this and leaves connection ownership to the host', async () => {
    class Manager implements HostWebsocket {
      #subscribed = false;
      subscribe() { this.#subscribed = true; }
      unsubscribe() { this.#subscribed = false; }
      close = vi.fn();
      get subscribed() { return this.#subscribed; }
    }
    const ws = new Manager(); const f = fixture({ websocket: ws });
    await f.start(); expect(ws.subscribed).toBe(true);
    f.stop(); expect(ws.subscribed).toBe(false); expect(ws.close).not.toHaveBeenCalled();
  });
  it('does not unsubscribe another owner when subscribe fails', async () => {
    const ws = { subscribe: vi.fn(() => { throw new Error('already registered'); }), unsubscribe: vi.fn() };
    const f = fixture({ websocket: ws }); await f.start(); f.stop();
    expect(f.latest().phase).toBe('ERROR');
    expect(f.fetcher).not.toHaveBeenCalled();
    expect(ws.unsubscribe).not.toHaveBeenCalled();
  });
  it.each([
    ['HTTP error', () => response({}, 503)],
    ['invalid response', () => response({ items: rows })],
    ['duplicate IDs', () => response([rows[0], rows[0]])],
  ])('reports %s and releases the subscription', async (_name, result) => {
    const f = fixture({ fetcher: vi.fn(async () => result()) });
    await f.start(); f.stop();
    expect(f.latest().phase).toBe('ERROR');
    expect(f.websocket.unsubscribe).toHaveBeenCalledTimes(1);
    expect(f.onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'METADATA_FAILED' }));
  });
  it('reports an unsubscribe failure without letting cleanup throw', async () => {
    const ws = { subscribe: vi.fn(), unsubscribe: vi.fn(() => { throw new Error('gone'); }) };
    const f = fixture({ websocket: ws }); await f.start();
    expect(() => f.stop()).not.toThrow();
    expect(f.onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNSUBSCRIBE_FAILED' }));
  });
  it('times out a stalled fetch and releases its topic', async () => {
    vi.useFakeTimers();
    try {
      const f = fixture({ fetcher: vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })) });
      const started = f.start();
      await vi.advanceTimersByTimeAsync(15000); await started;
      expect(f.latest().error).toContain('timed out');
      expect(f.websocket.unsubscribe).toHaveBeenCalledTimes(1);
      f.stop();
    } finally { vi.useRealTimers(); }
  });
});

describe('boundary validation', () => {
  const ws = { subscribe() {}, unsubscribe() {} };
  const normalizeMessage: NormalizeMessage = () => null;
  const config = JSON.stringify({ apiBaseUrl: '/api' });
  it('preserves service identities through Zod parsing', () => {
    const parsed = parseInputs(config, ws, normalizeMessage);
    expect(parsed.websocket).toBe(ws);
    expect(parsed.normalizeMessage).toBe(normalizeMessage);
  });
  it.each([{}, { subscribe: 'wrong', unsubscribe() {} }, { subscribe() {} }, null])('requires both callable WS methods: %s', invalid => {
    expect(() => parseInputs(config, invalid, normalizeMessage)).toThrow();
  });
  it('rejects broken JSON, missing apiBaseUrl, and serialized function props', () => {
    expect(() => parseInputs('{', ws, normalizeMessage)).toThrow();
    expect(() => parseInputs('{}', ws, normalizeMessage)).toThrow();
    expect(() => parseInputs(config, ws, '() => null')).toThrow();
  });
  it('preserves a base path when building the REST URL', () => {
    expect(metadataUrl(configSchema.parse({ apiBaseUrl: 'https://api.example.test/prefix/', interfacesPath: '/interfaces-x' })))
      .toBe('https://api.example.test/prefix/interfaces-x');
  });
});
