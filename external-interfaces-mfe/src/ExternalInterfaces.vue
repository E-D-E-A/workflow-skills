<template>
  <section class="external-interfaces" aria-label="External interfaces" :aria-busy="isLoading">
    <span v-if="isLoading" class="external-interfaces__loading" role="status">
      <VProgressCircular indeterminate :size="16" :width="2" aria-hidden="true" />
      Loading interfaces…
    </span>
    <div v-else-if="hasLoadingError" class="external-interfaces__error">
      <span role="alert">{{ errorMessage }}</span>
      <VBtn size="small" variant="text" @click="retryLoading">Retry</VBtn>
    </div>
    <span v-else-if="hasNoInterfaces" role="status">No external interfaces</span>
    <ul v-else class="external-interfaces__list">
      <li v-for="interfaceRow in interfaceRows" :key="interfaceRow.id" :data-interface-id="interfaceRow.id">
        <VChip
          size="small"
          variant="tonal"
          tag="button"
          type="button"
          :color="interfaceRow.statusColor"
          :title="interfaceRow.groupTitle"
          :aria-label="interfaceRow.accessibleLabel"
          @click="handleInterfaceInteraction('componentClick', interfaceRow)"
          @dblclick="handleInterfaceInteraction('componentDoubleClick', interfaceRow)"
          @contextmenu="handleInterfaceInteraction('componentRightClick', interfaceRow)"
        >
          <span class="external-interfaces__name">{{ interfaceRow.displayName }}</span>
          <span class="external-interfaces__status">{{ interfaceRow.statusLabel }}</span>
        </VChip>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useHost, watch } from 'vue';
import { VBtn, VChip, VProgressCircular } from 'vuetify/components';
import {
  interfacesSchema,
  normalizedUpdateSchema,
  parseInputs,
  type HostWebsocket,
  type InterfaceMetadata,
  type NormalizeMessage,
  type RemoteConfig,
  type Status,
} from './contracts';

const props = defineProps<{
  config: string;
  websocket: HostWebsocket;
  normalizeMessage: NormalizeMessage;
}>();
const hostElement = useHost();
const interfaces = ref<InterfaceMetadata[]>([]);
const configuration = shallowRef<RemoteConfig>();
const isLoading = ref(false);
const errorMessage = ref('');
const reloadCount = ref(0);

const hasLoadingError = computed(() => {
  const hasErrorMessage = errorMessage.value.length > 0;
  return hasErrorMessage;
});
const hasNoInterfaces = computed(() => {
  const isCollectionEmpty = interfaces.value.length === 0;
  return isCollectionEmpty;
});
const interfaceRows = computed(() => {
  const displayRows = interfaces.value.map(createInterfaceRow);
  return displayRows;
});

function createInterfaceRow(externalInterface: InterfaceMetadata) {
  const statusKey = String(externalInterface.connectionStatus);
  const hasUnknownStatus = externalInterface.connectionStatus === null;
  const defaultStatusLabel = hasUnknownStatus ? 'Unknown' : `Status ${externalInterface.connectionStatus}`;
  const statusLabel = configuration.value?.statusLabels[statusKey] ?? defaultStatusLabel;
  const statusColor = configuration.value?.statusColors[statusKey];
  const displayName = externalInterface.displayName || `Interface ${externalInterface.id}`;
  const groupTitle = externalInterface.groupName || undefined;
  const accessibleLabel = `${displayName}: ${statusLabel}`;
  const interfaceRow = {
    id: externalInterface.id,
    connectionStatus: externalInterface.connectionStatus,
    displayName,
    groupTitle,
    statusLabel,
    statusColor,
    accessibleLabel,
  };
  return interfaceRow;
}

function dispatchHostEvent(eventName: string, eventDetail: unknown) {
  const hostEvent = new CustomEvent(eventName, { detail: eventDetail, bubbles: true, composed: true });
  hostElement?.dispatchEvent(hostEvent);
}
function reportDiagnostic(code: string, message: string) {
  const diagnostic = { type: 'external-interfaces:diagnostic', code, message };
  dispatchHostEvent('mfe-event', diagnostic);
}
function emitDataState(state: 'LOADING' | 'READY' | 'ERROR') {
  const stateChange = { type: 'external-interfaces:data-state', state };
  dispatchHostEvent('mfe-event', stateChange);
}
function showLoadingError(code: string, message: string) {
  errorMessage.value = message;
  isLoading.value = false;
  reportDiagnostic(code, message);
  emitDataState('ERROR');
}
function handleInterfaceInteraction(eventName: string, externalInterface: { id: number; connectionStatus: Status }) {
  const interaction = { interfaceId: externalInterface.id, connectionStatus: externalInterface.connectionStatus };
  dispatchHostEvent(eventName, interaction);
}
function retryLoading() {
  const nextReloadCount = reloadCount.value + 1;
  reloadCount.value = nextReloadCount;
}
function getLoadDependencies() {
  const dependencies = [props.config, props.websocket, props.normalizeMessage, reloadCount.value];
  return dependencies;
}

// Each watcher invocation owns its request, subscription and cleanup independently.
function startInterfacesLoad(
  _currentDependencies: unknown,
  _previousDependencies: unknown,
  registerCleanup: (cleanup: () => void) => void,
) {
  interfaces.value = [];
  errorMessage.value = '';
  isLoading.value = false;

  let validatedInputs: ReturnType<typeof parseInputs>;
  try {
    validatedInputs = parseInputs(props.config, props.websocket, props.normalizeMessage);
  } catch {
    showLoadingError('INVALID_PROPS', 'External interfaces configuration is invalid.');
    return;
  }

  const { config: currentConfiguration, websocket, normalizeMessage } = validatedInputs;
  configuration.value = currentConfiguration;
  isLoading.value = true;
  emitDataState('LOADING');
  const abortController = new AbortController();
  const pendingStatusUpdates = new Map<number, Status>();
  let isCurrentLoadActive = true;
  let hasTopicSubscription = false;
  let requestTimeout: ReturnType<typeof setTimeout> | undefined;

  function cleanupSubscriptionAndRequest() {
    isCurrentLoadActive = false;
    abortController.abort();
    clearTimeout(requestTimeout);
    pendingStatusUpdates.clear();
    if (hasTopicSubscription) {
      hasTopicSubscription = false;
      try {
        websocket.unsubscribe(currentConfiguration.topic);
      } catch {
        reportDiagnostic('UNSUBSCRIBE_FAILED', 'Unable to remove the topic subscription.');
      }
    }
  }
  registerCleanup(cleanupSubscriptionAndRequest);

  function handleStatusMessage(rawMessage: unknown) {
    const shouldIgnoreMessage = isCurrentLoadActive === false;
    if (shouldIgnoreMessage) return;

    let normalizedMessage: unknown;
    try {
      normalizedMessage = normalizeMessage(rawMessage);
    } catch {
      reportDiagnostic('NORMALIZER_FAILED', 'The host normalizer threw an error.');
      return;
    }
    const isIrrelevantMessage = normalizedMessage === null;
    if (isIrrelevantMessage) return;

    const validationResult = normalizedUpdateSchema.safeParse(normalizedMessage);
    const isInvalidUpdate = validationResult.success === false;
    if (isInvalidUpdate) {
      reportDiagnostic('INVALID_UPDATE', 'Expected { id, connectionStatus } or null.');
      return;
    }
    const { id: interfaceId, connectionStatus } = validationResult.data;
    // Remember the latest update until the initial REST metadata arrives.
    const isWaitingForMetadata = isLoading.value;
    if (isWaitingForMetadata) {
      pendingStatusUpdates.set(interfaceId, connectionStatus);
      return;
    }
    const matchingInterface = interfaces.value.find(externalInterface => {
      const hasMatchingId = externalInterface.id === interfaceId;
      return hasMatchingId;
    });
    if (matchingInterface) matchingInterface.connectionStatus = connectionStatus;
  }

  function subscribeToStatusUpdates() {
    let subscriptionSucceeded = false;
    try {
      // Preserve the manager as the method receiver; it may rely on private fields.
      websocket.subscribe(currentConfiguration.topic, handleStatusMessage);
      hasTopicSubscription = true;
      subscriptionSucceeded = true;
    } catch {
      showLoadingError('SUBSCRIBE_FAILED', 'Unable to subscribe to interface updates.');
      cleanupSubscriptionAndRequest(); // Never unsubscribe a topic we failed to acquire.
    }
    return subscriptionSucceeded;
  }

  async function fetchInterfaceMetadata() {
    const apiBaseUrl = currentConfiguration.apiBaseUrl.replace(/\/$/, '');
    const interfacesPath = currentConfiguration.interfacesPath.replace(/^\//, '');
    const requestUrl = `${apiBaseUrl}/${interfacesPath}`;
    const requestOptions = { signal: abortController.signal, credentials: currentConfiguration.credentials };
    const response = await fetch(requestUrl, requestOptions);
    const requestFailed = response.ok === false;
    if (requestFailed) {
      const requestError = new Error(`HTTP ${response.status}`);
      throw requestError;
    }
    const responseBody = await response.json();
    const validatedInterfaces = interfacesSchema.parse(responseBody);
    return validatedInterfaces;
  }

  function applyInitialInterfaces(fetchedInterfaces: InterfaceMetadata[]) {
    for (const externalInterface of fetchedInterfaces) {
      const bufferedStatus = pendingStatusUpdates.get(externalInterface.id);
      const hasBufferedStatus = bufferedStatus !== undefined;
      if (hasBufferedStatus) externalInterface.connectionStatus = bufferedStatus;
    }
    interfaces.value = fetchedInterfaces;
    pendingStatusUpdates.clear();
    emitDataState('READY');
  }

  function handleMetadataFailure() {
    const requestTimedOut = abortController.signal.aborted;
    const failureMessage = requestTimedOut ? 'Loading interfaces timed out.' : 'Unable to load interfaces.';
    showLoadingError('METADATA_FAILED', failureMessage);
    cleanupSubscriptionAndRequest();
  }

  async function loadInterfaces() {
    const subscriptionSucceeded = subscribeToStatusUpdates();
    const subscriptionFailed = subscriptionSucceeded === false;
    if (subscriptionFailed) return;

    requestTimeout = setTimeout(() => { abortController.abort(); }, currentConfiguration.requestTimeoutMs);
    try {
      const fetchedInterfaces = await fetchInterfaceMetadata();
      const shouldDiscardResponse = isCurrentLoadActive === false;
      if (shouldDiscardResponse) return;
      const requestTimedOut = abortController.signal.aborted;
      if (requestTimedOut) {
        handleMetadataFailure();
        return;
      }
      applyInitialInterfaces(fetchedInterfaces);
    } catch {
      if (isCurrentLoadActive) handleMetadataFailure();
    } finally {
      clearTimeout(requestTimeout);
      if (isCurrentLoadActive) isLoading.value = false;
    }
  }
  void loadInterfaces();
}
watch(getLoadDependencies, startInterfacesLoad, { immediate: true });
</script>

<style scoped>
.external-interfaces {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  font: inherit;
}
.external-interfaces__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.external-interfaces__loading,
.external-interfaces__error {
  display: flex;
  align-items: center;
  gap: 8px;
}
.external-interfaces__name {
  max-width: 12rem;
  overflow: hidden;
  text-overflow: ellipsis;
}
.external-interfaces__status {
  margin-inline-start: 6px;
}
</style>
