import { afterEach, expect, it, vi } from 'vitest';
import { configSchema, type MessageListener } from '../../src/contracts';
import { fetchInterfaceMetadata, subscribeToInterfaceStatuses } from '../../src/externalInterfacesData';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('rejects invalid metadata', async () => {
  const fetcher = vi.fn(async () => {
    const invalidResponse = new Response('{}');
    return invalidResponse;
  });
  vi.stubGlobal('fetch', fetcher);
  const configuration = configSchema.parse({ apiBaseUrl: '/api' });
  const pendingMetadata = fetchInterfaceMetadata(configuration);
  await expect(pendingMetadata).rejects.toThrow();
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
  const normalizeMessage = vi.fn(() => {
    const statusUpdate = { id: 1, connectionStatus: null };
    return statusUpdate;
  });
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
