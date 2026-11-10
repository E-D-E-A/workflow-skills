# Troubleshooting

Check these boundaries in order; change the smallest failing one.

| Symptom | Check |
| --- | --- |
| Host load fails / times out | Entry URL is remoteEntry.var.js; both entries and all chunks/CSS return JS/CSS, not an HTML fallback; CORS permits the host |
| Missing get/init | Container/global/key/import prefix all use ExternalInterfaces; load var entry as a classic script |
| Module not found | Expose is ./register, import is ExternalInterfaces/register |
| Tag not defined | Loader actually evaluates the expose; check customElements.get('cust-external-interfaces') |
| INVALID_PROPS | config is a JSON string; websocket has callable subscribe AND unsubscribe; normalizeMessage is a function |
| Methods/private fields break | Manager was serialized, cloned, deeply proxied or methods detached; pass original object as a JS property |
| SUBSCRIBE_FAILED | Another component already owns the topic; mount only one collection |
| METADATA_FAILED | Correct endpoint/auth, array response, numeric unique IDs and nullable numeric connectionStatus |
| NORMALIZER_FAILED | Host normalizer threw; inspect its client-specific input handling |
| INVALID_UPDATE | Return { id, connectionStatus } or null, synchronously; no string IDs or Promises |
| Status never updates | Exact topic, registered callback, normalizer output and matching metadata ID |
| Repeated fetch/subscription | Host recreates normalizer/manager references or changes config |
| Unsubscribe failure | Inspect UNSUBSCRIBE_FAILED diagnostic and host manager cleanup; never close the connection |
| Host READY but view errors | Code loading and metadata loading are separate stages |
| Wrong theme | Light DOM must sit beneath active host .v-theme--... ancestor; inspect inherited --v-theme-surface |
| Unstyled view | Serve exposed module's CSS and the whole dist directory |
| Events missing in generic host | First listen directly on the element, then check private eventMap forwarding |
| Dev-only federation stall | Reproduce with production build + preview before changing the container wiring |

Browser probes after loading:

```js
const el = document.querySelector('cust-external-interfaces');
customElements.get('cust-external-interfaces');
typeof el.config;                       // string
typeof el.websocket?.subscribe;         // function
typeof el.websocket?.unsubscribe;       // function
typeof el.normalizeMessage;             // function
el.addEventListener('mfe-event', e => console.log(e.detail));
```

Keep object/function props out of JSON. In Vue, explicit `.prop` bindings are useful
when the generic host bridge otherwise assigns attributes. A normalizer method
that uses this must be bound by the host.

The Vite plugin brings federation runtime 2.8.0; enhanced brings 2.6.0. Preserve the
requested pins and compare with the included harness before forcing dependency
overrides. A root shared key does not automatically share every Vuetify subpath.

The browser custom-element registry cannot replace a constructor already registered
under the same tag. Fully reload the host page after rebuilding the remote.

For the next agent, provide the failing boundary, error code, installed versions,
resolved entry URL, a fabricated metadata row and raw message plus normalized output.
The original repo does not need to be exported to diagnose those contracts.
