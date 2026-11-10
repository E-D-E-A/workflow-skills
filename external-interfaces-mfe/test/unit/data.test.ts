import { afterEach, expect, it, vi } from 'vitest';
import { configSchema, type MessageListener } from '../../src/contracts';
import { fetchInterfaceMetadata, subscribeToInterfaceStatuses } from '../../src/externalInterfacesData';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('rejects a late REST response after timeout and clears the timer', async () => {
  vi.useFakeTimers();
  let resolveRequest!: (response: Response) => void;
  const pendingResponse = new Promise<Response>(resolve => { resolveRequest = resolve; });
  vi.stubGlobal('fetch', vi.fn(() => pendingResponse));
  const configuration = configSchema.parse({ apiBaseUrl: '/api', requestTimeoutMs: 10 });
  const requestController = new AbortController();
  const pendingMetadata = fetchInterfaceMetadata(configuration, requestController);
  const rejectionAssertion = expect(pendingMetadata).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(10);
  expect(requestController.signal.aborted).toBe(true);
  resolveRequest(new Response('[]'));
  await rejectionAssertion;
  expect(vi.getTimerCount()).toBe(0);
});

it('clears the request timer when metadata validation fails', async () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
  const configuration = configSchema.parse({ apiBaseUrl: '/api' });
  const requestController = new AbortController();
  const pendingMetadata = fetchInterfaceMetadata(configuration, requestController);
  await expect(pendingMetadata).rejects.toThrow();
  expect(vi.getTimerCount()).toBe(0);
  expect(requestController.signal.aborted).toBe(false);
});

it('preserves the manager receiver and ignores callbacks after cleanup', () => {
  let listener: MessageListener = () => {};
  class Manager {
    #topic: string | undefined;
    subscribe(topic: string, callback: MessageListener) {
      this.#topic = topic;
      listener = callback;
    }
    unsubscribe(topic: string) {
      expect(topic).toBe(this.#topic);
      this.#topic = undefined;
    }
  }
  const websocket = new Manager();
  const unsubscribeSpy = vi.spyOn(websocket, 'unsubscribe');
  const normalizeMessage = vi.fn(() => ({ id: 1, connectionStatus: null }));
  const onStatusUpdate = vi.fn();
  const subscriptionOptions = {
    websocket, topic: 'status', normalizeMessage, onStatusUpdate, onDiagnostic: vi.fn(),
  };
  const stopSubscription = subscribeToInterfaceStatuses(subscriptionOptions);
  listener({});
  stopSubscription();
  stopSubscription();
  listener({});
  expect(onStatusUpdate).toHaveBeenCalledExactlyOnceWith({ id: 1, connectionStatus: null });
  expect(normalizeMessage).toHaveBeenCalledTimes(1);
  expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
});
