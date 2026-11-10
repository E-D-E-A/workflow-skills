# Private host integration sketch

The executable browser suite loads the built remote through enhanced/runtime.
Inside the internal repo, repeat the following with the actual generic host:

1. Register its real Vue component, runtime registry and injection key.
2. Supply a fake CommManager that permits only one callback per topic, through the
   production property bridge. Spy on subscribe, unsubscribe and connection creation.
3. Serve the built remote from a separate origin and mock the real REST path with two rows.
4. Mount one generic host. Assert loader LOADING -> READY, two rows, one GET, one
   subscription, original manager/function identities, and no new connection.
5. Deliver a raw message through that callback. Assert the normalizer runs and only
   the matching row changes. Also send a message during a delayed GET.
6. Verify click forwarding and theme inheritance through the actual navbar.
7. Unmount during a pending GET: unsubscribe occurs once, no socket closes. The GET
   continues; resolving or rejecting it must not update UI or emit data-state events.
   Remount successfully with a fresh request and subscription.
8. Block the remote entry to test host error/timeout slots. Return REST 503 to test
   the separate remote error and Retry behavior: Retry reuses the subscription.
9. Assign new config/services after mount and verify no reload or subscription
   change. Remount with those inputs and verify they apply to the new instance.

Use the real built remote, not a direct import of the Vue component. The private
loader's eventMap schema and export convention must be checked against local code.
