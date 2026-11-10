import { fetchInterfaces, type FetchLike } from './api';
import { normalizedUpdateSchema, type Diagnostic, type HostWebsocket, type NormalizeMessage,
  type RemoteConfig, type Snapshot, type Status } from './contracts';

interface Options {
  config: RemoteConfig;
  websocket: HostWebsocket;
  normalizeMessage: NormalizeMessage;
  onSnapshot(snapshot: Snapshot): void;
  onDiagnostic(diagnostic: Diagnostic): void;
  fetcher?: FetchLike;
}

/** One controller per mounted collection. No data store, router, or socket creation. */
export function createInterfacesController(options: Options) {
  const { config, websocket, normalizeMessage, onSnapshot, onDiagnostic } = options;
  let active = false;
  let started = false;
  let subscribed = false;
  let metadataLoaded = false;
  let snapshot: Snapshot = { phase: 'LOADING', interfaces: [], error: null };
  const pending = new Map<number, Status>();
  const abort = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const publish = () => { if (active) onSnapshot(snapshot); };
  const report = (code: Diagnostic['code'], message: string) => onDiagnostic({ code, message });

  function onMessage(raw: unknown) {
    if (!active) return; // Guard queued callbacks after disconnect/reconfiguration.
    let result: unknown;
    try { result = normalizeMessage(raw); }
    catch { report('NORMALIZER_FAILED', 'The host message normalizer threw an error.'); return; }
    if (result === null) return;
    const update = normalizedUpdateSchema.safeParse(result);
    if (!update.success) {
      report('INVALID_UPDATE', 'Expected { id: integer, connectionStatus: number | null } or null.');
      return;
    }
    const { id, connectionStatus } = update.data;
    if (!metadataLoaded) {
      pending.set(id, connectionStatus); // Latest live status wins over the initial REST snapshot.
      return;
    }
    if (!snapshot.interfaces.some(item => item.id === id)) return;
    snapshot = { ...snapshot, interfaces: snapshot.interfaces.map(item => item.id === id
      ? { ...item, connectionStatus } : item) };
    publish();
  }

  function unsubscribe() {
    if (!subscribed) return;
    subscribed = false;
    try { websocket.unsubscribe(config.topic); }
    catch { report('UNSUBSCRIBE_FAILED', 'The host could not remove the topic subscription.'); }
  }

  async function start() {
    if (started) return;
    started = true;
    active = true;
    publish();
    try {
      // Call on the original object: CommManager may rely on `this` / private fields.
      websocket.subscribe(config.topic, onMessage);
      subscribed = true;
    } catch {
      snapshot = { phase: 'ERROR', interfaces: [], error: 'Unable to subscribe to interface updates.' };
      report('SUBSCRIBE_FAILED', snapshot.error!);
      publish();
      active = false;
      return; // Never unsubscribe a topic we failed to acquire.
    }
    timeout = setTimeout(() => { timedOut = true; abort.abort(); }, config.requestTimeoutMs);
    try {
      const interfaces = await fetchInterfaces(config, abort.signal, options.fetcher);
      if (!active || abort.signal.aborted) return;
      snapshot = {
        phase: 'READY', error: null,
        interfaces: interfaces.map(item => pending.has(item.id)
          ? { ...item, connectionStatus: pending.get(item.id)! } : item),
      };
      metadataLoaded = true;
      pending.clear();
      publish();
    } catch {
      if (!active) return;
      snapshot = { phase: 'ERROR', interfaces: [], error: timedOut
        ? 'Loading interfaces timed out.' : 'Unable to load interfaces.' };
      report('METADATA_FAILED', snapshot.error!);
      publish();
      active = false;
      pending.clear();
      unsubscribe(); // Retry creates a fresh controller/subscription.
    } finally { clearTimeout(timeout); }
  }

  function stop() {
    active = false;
    abort.abort();
    clearTimeout(timeout);
    pending.clear();
    unsubscribe();
  }
  return { start, stop };
}
