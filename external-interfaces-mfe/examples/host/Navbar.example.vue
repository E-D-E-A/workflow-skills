<!-- Integration sketch. Keep the host's existing global component registration,
     injection key, and createRuntimeMfeRegistry(MfeRegistry, envResolver) setup.
     Replace the example inject key with the host's actual key/type. -->
<script setup lang="ts">
import { inject } from 'vue';
const runtimeMfeRegistry = inject<any>('REPLACE_WITH_HOST_RUNTIME_REGISTRY_KEY');
function onMfeEvent(event: unknown) { console.debug('External interfaces:', event); }
</script>

<template>
  <!-- ONE host instance: no v-for here. -->
  <generic-module-federation-host
    :definition="runtimeMfeRegistry.ExternalInterfaces"
    :loading-timeout-duration="15000"
    @mfe-event="onMfeEvent"
  >
    <template #loading><span role="status">Loading external interfaces module…</span></template>
    <template #error><span role="alert">External interfaces module is unavailable.</span></template>
  </generic-module-federation-host>
</template>
