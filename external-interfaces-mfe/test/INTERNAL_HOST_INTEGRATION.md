# Integration test sketch for the private generic host

The executable tests in `test/browser/federation.spec.ts` verify the public runtime,
real built remote and DOM boundary. This additional sketch must be applied inside
the internal repository because `@gf/generic-module-federation-host` 1.0.1, its
actual injection key, registry helper and eventMap implementation are unavailable here.

## Fixture setup in the internal host

1. Use the host's real global registration for `generic-module-federation-host`.
2. Create a test CommManager with a Map from topic to one callback. `subscribe`
   throws if the topic is occupied; `unsubscribe` removes it. Spy on both methods
   and on connection construction/close. Inject this one manager through the same
   host path used in production.
3. Create the actual runtime registry using the host's helper and env resolver. The
   entry URL should point to the real built remote served from a separate origin.
   Use the default share scope and production Vue/Vuetify versions/singleton config.
4. In `toElementProps`, return the JSON config string plus the exact manager and
   normalizer references. Use the actual generic host's property/event forwarding.
5. Mount ONE generic-host component in a fixture navbar beneath an active Vuetify
   theme ancestor. Capture its loader state-change and forwarded component events.
6. Intercept the configured REST request and return at least two interfaces.

## Core browser scenario (adapt selectors/fixture API)

```ts
test('actual generic host loads and tears down the collection remote', async ({ page }) => {
  await page.route('**/YOUR_ACTUAL_INTERFACE_PATH', route => route.fulfill({
    json: [
      { id: 10, connectionStatus: 0, displayName: 'A', groupName: null, type: 'test' },
      { id: 20, connectionStatus: 0, displayName: 'B', groupName: null, type: 'test' },
    ],
  }));

  await page.goto('/YOUR_INTERNAL_TEST_FIXTURE');
  await expect(page.locator('cust-external-interfaces')).toHaveCount(1);
  await expect(page.locator('[data-interface-id]')).toHaveCount(2);

  // Through test-only fixture controls (not a production window debug API):
  // - assert host loader transitioned LOADING -> READY
  // - assert one REST request and one subscribe(topic, function)
  // - assert element.websocket === the fixture CommManager
  // - assert element.normalizeMessage === the fixture normalizer
  // - assert new connection count stayed at the host's baseline
  // - emit raw client-specific payload for id 20 through the registered callback

  await expect(page.locator('[data-interface-id="20"]')).toContainText('Status 7');
  await expect(page.locator('[data-interface-id="10"]')).toContainText('Status 0');

  // Click a row and assert the generic host forwards componentClick with id 20.
  // Toggle the host theme and assert inherited CSS values change.
  // Remove the generic host using the host framework's normal unmount path.
  // Assert unsubscribe(topic) happened exactly once; close() was never called.
  // Remount and assert one new subscription and a fresh GET, without stale state.
});
```

## Additional scenarios

| Scenario | Required outcome |
| --- | --- |
| Abort/404 the var entry or exposed JS chunk | Actual host error slot and loader ERROR; no remote subscription |
| Delay the entry past loading-timeout-duration | Host timeout path; ensure a late resolution does not attach an orphaned remote |
| Metadata 503 / invalid array | Host can be READY; remote shows its own error; no leftover topic subscription |
| Different raw envelope with a different normalizer | Same remote bundle updates the correct row |
| Invalid/throwing normalizer, null result, unknown ID | Diagnostic or ignore; existing valid rows remain intact |
| Deliver status during delayed metadata GET | Buffered status wins over REST for the matching row |
| Unmount while metadata request is pending | Request aborted; no late UI or subscription reattachment |
| Property assignment before tag definition | Values survive custom-element upgrade and remain the same references |
| Re-render host with identical dependencies | No additional GET/subscription |
| Deliberately mount a duplicate on the same manager/topic | Duplicate fails; the original owner's subscription remains |

Never simulate federation by importing `src/ExternalInterfaces.vue` directly for
the loading scenario. That bypasses the entry format, share scope, exposed-module
registration and property bridge this integration test is intended to verify.
