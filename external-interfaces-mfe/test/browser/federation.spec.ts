import { expect, test } from '@playwright/test';

const metadata = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: 'ERP', type: 'mock' },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: 'mock' },
];

test.beforeEach(async ({ page }) => {
  await page.route('**/api/interfaces-x', async route => {
    await route.fulfill({ json: metadata });
  });
  await page.addInitScript(() => {
    window.__socketCount = 0;
    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = class extends OriginalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        window.__socketCount++;
      }
    };
  });
});

test('loads the built var remote, renders all interfaces, receives updates and cleans up', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });
  let metadataRequestCount = 0;
  page.on('request', request => {
    const requestUrl = request.url();
    const isMetadataRequest = requestUrl.endsWith('/api/interfaces-x');
    if (isMetadataRequest) {
      metadataRequestCount++;
    }
  });

  await page.goto('/');
  const ordersRow = page.locator('[data-interface-id="1"]');
  const inventoryRow = page.locator('[data-interface-id="2"]');
  await expect(page.locator('#phase')).toHaveText('READY');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  await expect(ordersRow).toContainText('Status 0');
  await page.evaluate(() => {
    window.__harness.websocket.emit({ id: 1, communicationStatus: 7 });
  });
  await expect(ordersRow).toContainText('Status 7');
  await expect(inventoryRow).toContainText('Unknown');

  const connectionState = await page.evaluate(() => {
    const harness = window.__harness;
    const state = {
      usesOriginalManager: harness.identity(),
      subscriptions: harness.websocket.subscriptions,
      newConnections: window.__socketCount - harness.baselineSocketCount,
    };
    return state;
  });
  expect(connectionState).toEqual({ usesOriginalManager: true, subscriptions: 1, newConnections: 0 });
  expect(metadataRequestCount).toBe(1);

  await page.getByRole('button', { name: 'Orders: Status 7' }).click();
  const receivedClick = await page.evaluate(() => {
    const hasMatchingEvent = window.__harness.events.some(event => {
      const isOrdersClick = event.name === 'componentClick' && event.detail.interfaceId === 1;
      return isOrdersClick;
    });
    return hasMatchingEvent;
  });
  expect(receivedClick).toBe(true);

  await page.evaluate(async () => {
    await window.__harness.unmount();
  });
  const cleanupState = await page.evaluate(() => {
    const websocket = window.__harness.websocket;
    const state = {
      unsubscribed: websocket.unsubscriptions,
      listeners: websocket.handlers.size,
      closed: websocket.closes,
    };
    return state;
  });
  expect(cleanupState).toEqual({ unsubscribed: 1, listeners: 0, closed: 0 });

  await page.evaluate(async () => {
    await window.__harness.mount();
  });
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  const subscriptionCount = await page.evaluate(() => {
    const subscriptions = window.__harness.websocket.subscriptions;
    return subscriptions;
  });
  expect(subscriptionCount).toBe(2);
  expect(pageErrors).toEqual([]);
});

test('preserves functions and objects assigned before custom-element registration', async ({ page }) => {
  await page.goto('/?preupgrade=1');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  const connectionState = await page.evaluate(() => {
    const harness = window.__harness;
    const state = {
      usesOriginalManager: harness.identity(),
      subscriptions: harness.websocket.subscriptions,
    };
    return state;
  });
  expect(connectionState).toEqual({ usesOriginalManager: true, subscriptions: 1 });
});

test('supports another host envelope and rejects malformed normalizer output', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  await page.evaluate(async () => {
    await window.__harness.remountWithNormalizer(rawMessage => {
      const message = rawMessage as { channelId: number; state: number | null };
      const statusUpdate = { id: message.channelId, connectionStatus: message.state };
      return statusUpdate;
    });
  });
  await expect.poll(async () => {
    const subscriptionCount = await page.evaluate(() => {
      const subscriptions = window.__harness.websocket.subscriptions;
      return subscriptions;
    });
    return subscriptionCount;
  }).toBe(2);
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);

  const inventoryRow = page.locator('[data-interface-id="2"]');
  await page.evaluate(() => {
    window.__harness.websocket.emit({ channelId: 2, state: 9 });
  });
  await expect(inventoryRow).toContainText('Status 9');
  await page.evaluate(() => {
    window.__harness.websocket.emit({ channelId: '2', state: 99 });
  });
  await expect(inventoryRow).toContainText('Status 9');
  const receivedInvalidUpdate = await page.evaluate(() => {
    const hasDiagnostic = window.__harness.events.some(event => {
      const isInvalidUpdate = event.detail.code === 'INVALID_UPDATE';
      return isInvalidUpdate;
    });
    return hasDiagnostic;
  });
  expect(receivedInvalidUpdate).toBe(true);
});

test('inherits host theme variables and applies new configuration on remount', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  const remoteElement = page.locator('.external-interfaces');
  async function readSurfaceColor() {
    const surfaceColor = await remoteElement.evaluate(element => {
      const computedStyles = getComputedStyle(element);
      const surfaceVariable = computedStyles.getPropertyValue('--v-theme-surface');
      const trimmedColor = surfaceVariable.trim();
      return trimmedColor;
    });
    return surfaceColor;
  }
  const lightSurfaceColor = await readSurfaceColor();
  expect(lightSurfaceColor).not.toBe('');
  await page.evaluate(() => {
    window.__harness.theme('dark');
  });
  await expect.poll(async () => {
    const surfaceColor = await readSurfaceColor();
    return surfaceColor;
  }).not.toBe(lightSurfaceColor);

  await page.evaluate(async () => {
    await window.__harness.remountWithConfig({ apiBaseUrl: '' });
  });
  await expect(page.getByRole('alert')).toContainText('configuration is invalid');
  const listenerCount = await page.evaluate(() => {
    const listeners = window.__harness.websocket.handlers.size;
    return listeners;
  });
  expect(listenerCount).toBe(0);
  await page.evaluate(async () => {
    await window.__harness.remountWithConfig({ apiBaseUrl: '/api' });
  });
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
});

test('shows metadata failure independently of federation READY, and can retry', async ({ page }) => {
  await page.route('**/api/interfaces-x', async route => {
    await route.fulfill({ status: 503, body: 'unavailable' });
  });
  await page.goto('/');
  await expect(page.locator('#phase')).toHaveText('READY');
  await expect(page.getByRole('alert')).toContainText('Unable to load interfaces');
  const listenerCount = await page.evaluate(() => {
    const listeners = window.__harness.websocket.handlers.size;
    return listeners;
  });
  expect(listenerCount).toBe(1);

  await page.route('**/api/interfaces-x', async route => {
    await route.fulfill({ json: metadata });
  });
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  const subscriptionCount = await page.evaluate(() => {
    const subscriptions = window.__harness.websocket.subscriptions;
    return subscriptions;
  });
  expect(subscriptionCount).toBe(1);
});

test('reports a remote entry load failure', async ({ page }) => {
  await page.route('**/remoteEntry.var.js', async route => {
    await route.abort();
  });
  await page.goto('/');
  await expect(page.locator('#phase')).toHaveText('ERROR');
  const subscriptionCount = await page.evaluate(() => {
    const subscriptions = window.__harness.websocket.subscriptions;
    return subscriptions;
  });
  expect(subscriptionCount).toBe(0);
});
