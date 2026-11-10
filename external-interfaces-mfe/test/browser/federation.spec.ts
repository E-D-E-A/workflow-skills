import { expect, test } from '@playwright/test';

const metadata = [
  { id: 1, connectionStatus: 0, displayName: 'Orders', groupName: 'ERP', type: 'mock' },
  { id: 2, connectionStatus: null, displayName: 'Inventory', groupName: null, type: 'mock' },
];
test.beforeEach(async ({ page }) => {
  await page.route('**/api/interfaces-x', route => route.fulfill({ json: metadata }));
  await page.addInitScript(() => {
    window.__socketCount = 0;
    const Original = window.WebSocket;
    window.WebSocket = class extends Original {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols); window.__socketCount++;
      }
    };
  });
});

test('loads the built var remote, renders all interfaces, receives updates and cleans up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let requests = 0;
  page.on('request', request => { if (request.url().endsWith('/api/interfaces-x')) requests++; });
  await page.goto('/');
  await expect(page.locator('#phase')).toHaveText('READY');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  await expect(page.locator('[data-interface-id="1"]')).toContainText('Status 0');
  await page.evaluate(() => window.__harness.websocket.emit({ id: 1, communicationStatus: 7 }));
  await expect(page.locator('[data-interface-id="1"]')).toContainText('Status 7');
  await expect(page.locator('[data-interface-id="2"]')).toContainText('Unknown');
  expect(await page.evaluate(() => window.__harness.identity())).toBe(true);
  expect(await page.evaluate(() => window.__harness.websocket.subscriptions)).toBe(1);
  // The Vite development host itself can open a tooling socket. The built remote
  // must add zero connections after the host has initialized.
  expect(await page.evaluate(() => window.__socketCount - window.__harness.baselineSocketCount)).toBe(0);
  expect(requests).toBe(1);
  await page.getByRole('button', { name: 'Orders: Status 7' }).click();
  expect(await page.evaluate(() => window.__harness.events.some(e => e.name === 'componentClick' && e.detail.interfaceId === 1))).toBe(true);
  await page.evaluate(() => window.__harness.unmount());
  expect(await page.evaluate(() => ({ unsubscribed: window.__harness.websocket.unsubscriptions,
    listeners: window.__harness.websocket.handlers.size, closed: window.__harness.websocket.closes })))
    .toEqual({ unsubscribed: 1, listeners: 0, closed: 0 });
  await page.evaluate(() => window.__harness.mount());
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  expect(await page.evaluate(() => window.__harness.websocket.subscriptions)).toBe(2);
  expect(errors).toEqual([]);
});

test('preserves functions and objects assigned before custom-element registration', async ({ page }) => {
  await page.goto('/?preupgrade=1');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  expect(await page.evaluate(() => window.__harness.identity())).toBe(true);
  expect(await page.evaluate(() => window.__harness.websocket.subscriptions)).toBe(1);
});

test('supports another host envelope and rejects malformed normalizer output', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  await page.evaluate(() => window.__harness.setNormalizer(raw => {
    const message = raw as { channelId: number; state: number | null };
    return { id: message.channelId, connectionStatus: message.state };
  }));
  await expect.poll(() => page.evaluate(() => window.__harness.websocket.subscriptions)).toBe(2);
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  await page.evaluate(() => window.__harness.websocket.emit({ channelId: 2, state: 9 }));
  await expect(page.locator('[data-interface-id="2"]')).toContainText('Status 9');
  await page.evaluate(() => window.__harness.websocket.emit({ channelId: '2', state: 99 }));
  await expect(page.locator('[data-interface-id="2"]')).toContainText('Status 9');
  expect(await page.evaluate(() => window.__harness.events.some(e => e.detail.code === 'INVALID_UPDATE'))).toBe(true);
});

test('inherits host theme variables and cleans up after configuration errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
  const color = () => page.locator('.external-interfaces').evaluate(el => getComputedStyle(el).getPropertyValue('--v-theme-surface').trim());
  const light = await color();
  expect(light).not.toBe('');
  await page.evaluate(() => window.__harness.theme('dark'));
  await expect.poll(color).not.toBe(light);
  await page.evaluate(() => window.__harness.setConfig({ apiBaseUrl: '' }));
  await expect(page.getByRole('alert')).toContainText('configuration is invalid');
  expect(await page.evaluate(() => window.__harness.websocket.handlers.size)).toBe(0);
  await page.evaluate(() => window.__harness.setConfig({ apiBaseUrl: '/api' }));
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
});

test('shows metadata failure independently of federation READY, and can retry', async ({ page }) => {
  await page.route('**/api/interfaces-x', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto('/');
  await expect(page.locator('#phase')).toHaveText('READY');
  await expect(page.getByRole('alert')).toContainText('Unable to load interfaces');
  expect(await page.evaluate(() => window.__harness.websocket.handlers.size)).toBe(0);
  await page.route('**/api/interfaces-x', route => route.fulfill({ json: metadata }));
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);
});

test('reports a remote entry load failure', async ({ page }) => {
  await page.route('**/remoteEntry.var.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#phase')).toHaveText('ERROR');
  expect(await page.evaluate(() => window.__harness.websocket.subscriptions)).toBe(0);
});
