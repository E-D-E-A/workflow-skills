<script setup lang="ts">
import { ref, shallowRef, useHost, watch } from 'vue';
import { VBtn, VChip, VProgressCircular } from 'vuetify/components';
import { interfacesSchema, normalizedUpdateSchema, parseInputs, type HostWebsocket,
  type InterfaceMetadata, type NormalizeMessage, type RemoteConfig } from './contracts';

const props = defineProps<{ config: string; websocket: HostWebsocket; normalizeMessage: NormalizeMessage }>();
const host = useHost();
const interfaces = ref<InterfaceMetadata[]>([]);
const config = shallowRef<RemoteConfig>();
const loading = ref(false);
const error = ref('');
const attempt = ref(0);

function notify(name: string, detail: unknown) {
  host?.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
}
function report(code: string, message: string) {
  notify('mfe-event', { type: 'external-interfaces:diagnostic', code, message });
}
function dataState(state: 'LOADING' | 'READY' | 'ERROR') {
  notify('mfe-event', { type: 'external-interfaces:data-state', state });
}

// Vue runs cleanup before changed props are applied and when this component unmounts.
watch(() => [props.config, props.websocket, props.normalizeMessage, attempt.value], (_, __, onCleanup) => {
  interfaces.value = [];
  error.value = '';
  loading.value = false;
  let input: ReturnType<typeof parseInputs>;
  try { input = parseInputs(props.config, props.websocket, props.normalizeMessage); }
  catch {
    error.value = 'External interfaces configuration is invalid.';
    report('INVALID_PROPS', error.value);
    return;
  }
  const { config: settings, websocket, normalizeMessage } = input;
  config.value = settings;
  loading.value = true;
  dataState('LOADING');
  const abort = new AbortController();
  const pending = new Map<number, number | null>();
  let active = true;
  let subscribed = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function stop() {
    active = false;
    abort.abort();
    clearTimeout(timeout);
    pending.clear();
    if (subscribed) {
      subscribed = false;
      try { websocket.unsubscribe(settings.topic); }
      catch { report('UNSUBSCRIBE_FAILED', 'Unable to remove the topic subscription.'); }
    }
  }
  onCleanup(stop);

  function receive(raw: unknown) {
    if (!active) return;
    let normalized: unknown;
    try { normalized = normalizeMessage(raw); }
    catch { report('NORMALIZER_FAILED', 'The host normalizer threw an error.'); return; }
    if (normalized === null) return;
    const result = normalizedUpdateSchema.safeParse(normalized);
    if (!result.success) { report('INVALID_UPDATE', 'Expected { id, connectionStatus } or null.'); return; }
    const { id, connectionStatus } = result.data;
    // Preserve messages arriving before metadata; the latest value per ID wins.
    if (loading.value) { pending.set(id, connectionStatus); return; }
    const item = interfaces.value.find(item => item.id === id);
    if (item) item.connectionStatus = connectionStatus;
  }

  async function load() {
    try {
      // Keep the original object as the method receiver (CommManager may use this).
      websocket.subscribe(settings.topic, receive);
      subscribed = true;
    } catch {
      loading.value = false;
      error.value = 'Unable to subscribe to interface updates.';
      report('SUBSCRIBE_FAILED', error.value);
      dataState('ERROR');
      stop(); // subscribed is false: never remove another consumer's subscription.
      return;
    }
    timeout = setTimeout(() => abort.abort(), settings.requestTimeoutMs);
    try {
      const url = `${settings.apiBaseUrl.replace(/\/$/, '')}/${settings.interfacesPath.replace(/^\//, '')}`;
      const response = await fetch(url, { signal: abort.signal, credentials: settings.credentials });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = interfacesSchema.parse(await response.json());
      if (!active) return;
      if (abort.signal.aborted) throw new Error('Request timed out');
      interfaces.value = items.map(item => pending.has(item.id)
        ? { ...item, connectionStatus: pending.get(item.id)! } : item);
      pending.clear();
      dataState('READY');
    } catch {
      if (!active) return;
      error.value = abort.signal.aborted ? 'Loading interfaces timed out.' : 'Unable to load interfaces.';
      report('METADATA_FAILED', error.value);
      dataState('ERROR');
      loading.value = false;
      stop();
    } finally {
      clearTimeout(timeout);
      if (active) loading.value = false;
    }
  }
  void load();
}, { immediate: true });

function label(item: InterfaceMetadata) {
  return config.value?.statusLabels[String(item.connectionStatus)] ??
    (item.connectionStatus === null ? 'Unknown' : `Status ${item.connectionStatus}`);
}
function interaction(name: string, item: InterfaceMetadata) {
  notify(name, { interfaceId: item.id, connectionStatus: item.connectionStatus });
}
</script>

<template>
  <section class="external-interfaces" aria-label="External interfaces" :aria-busy="loading">
    <span v-if="loading" class="external-interfaces__loading" role="status">
      <VProgressCircular indeterminate :size="16" :width="2" aria-hidden="true" /> Loading interfaces…
    </span>
    <div v-else-if="error" class="external-interfaces__error">
      <span role="alert">{{ error }}</span>
      <VBtn size="small" variant="text" @click="attempt++">Retry</VBtn>
    </div>
    <span v-else-if="interfaces.length === 0" role="status">No external interfaces</span>
    <ul v-else class="external-interfaces__list">
      <li v-for="item in interfaces" :key="item.id" :data-interface-id="item.id">
        <VChip size="small" variant="tonal" tag="button" type="button"
          :color="config?.statusColors[String(item.connectionStatus)]"
          :title="item.groupName || undefined"
          :aria-label="`${item.displayName || `Interface ${item.id}`}: ${label(item)}`"
          @click="interaction('componentClick', item)"
          @dblclick="interaction('componentDoubleClick', item)"
          @contextmenu="interaction('componentRightClick', item)">
          <span class="external-interfaces__name">{{ item.displayName || `Interface ${item.id}` }}</span>
          <span class="external-interfaces__status">{{ label(item) }}</span>
        </VChip>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.external-interfaces { display: inline-flex; align-items: center; min-width: 0; font: inherit; }
.external-interfaces__list { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; padding: 0; list-style: none; }
.external-interfaces__loading, .external-interfaces__error { display: flex; align-items: center; gap: 8px; }
.external-interfaces__name { max-width: 12rem; overflow: hidden; text-overflow: ellipsis; }
.external-interfaces__status { margin-inline-start: 6px; }
</style>
