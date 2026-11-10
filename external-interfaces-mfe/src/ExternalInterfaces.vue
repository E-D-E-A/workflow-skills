<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue';
import { VBtn, VChip, VProgressCircular } from 'vuetify/components';
import { createInterfacesController } from './controller';
import type { Diagnostic, HostWebsocket, InterfaceMetadata, NormalizeMessage, RemoteConfig, Snapshot } from './contracts';

const props = defineProps<{
  config: RemoteConfig;
  websocket: HostWebsocket;
  normalizeMessage: NormalizeMessage;
  notify: (name: string, detail: unknown) => void;
  retry: () => void;
}>();
const state = shallowRef<Snapshot>({ phase: 'LOADING', interfaces: [], error: null });
let lastPhase: Snapshot['phase'] | undefined;
const controller = createInterfacesController({
  config: props.config,
  websocket: props.websocket,
  normalizeMessage: props.normalizeMessage,
  onSnapshot(snapshot) {
    state.value = snapshot;
    if (snapshot.phase !== lastPhase) {
      lastPhase = snapshot.phase;
      props.notify('mfe-event', { type: 'external-interfaces:data-state', state: snapshot.phase });
    }
  },
  onDiagnostic(diagnostic: Diagnostic) {
    props.notify('mfe-event', { type: 'external-interfaces:diagnostic', ...diagnostic });
  },
});
function label(item: InterfaceMetadata) {
  return props.config.statusLabels[String(item.connectionStatus)] ??
    (item.connectionStatus === null ? 'Unknown' : `Status ${item.connectionStatus}`);
}
function interaction(name: string, item: InterfaceMetadata) {
  props.notify(name, { interfaceId: item.id, connectionStatus: item.connectionStatus });
}
onMounted(() => { void controller.start(); });
onBeforeUnmount(() => controller.stop());
</script>

<template>
  <section class="external-interfaces" aria-label="External interfaces" :aria-busy="state.phase === 'LOADING'">
    <span v-if="state.phase === 'LOADING'" class="external-interfaces__loading" role="status">
      <VProgressCircular indeterminate :size="16" :width="2" aria-hidden="true" /> Loading interfaces…
    </span>
    <div v-else-if="state.phase === 'ERROR'" class="external-interfaces__error">
      <span role="alert">{{ state.error }}</span>
      <VBtn size="small" variant="text" @click="retry">Retry</VBtn>
    </div>
    <span v-else-if="state.interfaces.length === 0" role="status">No external interfaces</span>
    <ul v-else class="external-interfaces__list">
      <li v-for="item in state.interfaces" :key="item.id" :data-interface-id="item.id">
        <VChip size="small" variant="tonal" tag="button" type="button"
          :color="config.statusColors[String(item.connectionStatus)]"
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
