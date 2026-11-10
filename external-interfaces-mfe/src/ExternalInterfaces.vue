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
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useHost } from 'vue';
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
// Captured once on mount; later property changes require remounting the MFE.
let mountedInputs: ReturnType<typeof parseInputs> | undefined;
let isUnmounted = false;
let hasTopicSubscription = false;
let hasInitialMetadata = false;
let abortController: AbortController | undefined;
let requestTimeout: ReturnType<typeof setTimeout> | undefined;
const pendingStatusUpdates = new Map<number, Status>();

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
  void loadInterfaces();
}

function initializeInterfaces() {
  try {
    mountedInputs = parseInputs(props.config, props.websocket, props.normalizeMessage);
    configuration.value = mountedInputs.config;
  } catch {
    showLoadingError('INVALID_PROPS', 'External interfaces configuration is invalid.');
    return;
  }
  void loadInterfaces();
}

function cleanupSubscriptionAndRequest() {
  isUnmounted = true;
  abortController?.abort();
  clearTimeout(requestTimeout);
  pendingStatusUpdates.clear();
  const inputs = mountedInputs;
  const shouldUnsubscribe = hasTopicSubscription && inputs !== undefined;
  if (shouldUnsubscribe) {
    hasTopicSubscription = false;
    try {
      inputs.websocket.unsubscribe(inputs.config.topic);
    } catch {
      reportDiagnostic('UNSUBSCRIBE_FAILED', 'Unable to remove the topic subscription.');
    }
  }
}

function handleStatusMessage(rawMessage: unknown) {
  const inputs = mountedInputs;
  const shouldIgnoreMessage = isUnmounted || inputs === undefined;
  if (shouldIgnoreMessage) return;

  let normalizedMessage: unknown;
  try {
    normalizedMessage = inputs.normalizeMessage(rawMessage);
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
  const isWaitingForMetadata = hasInitialMetadata === false;
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

function subscribeToStatusUpdates(inputs: ReturnType<typeof parseInputs>) {
  let subscriptionSucceeded = hasTopicSubscription;
  const needsSubscription = hasTopicSubscription === false;
  if (needsSubscription) {
    try {
      inputs.websocket.subscribe(inputs.config.topic, handleStatusMessage);
      hasTopicSubscription = true;
      subscriptionSucceeded = true;
    } catch {
      showLoadingError('SUBSCRIBE_FAILED', 'Unable to subscribe to interface updates.');
    }
  }
  return subscriptionSucceeded;
}

async function fetchInterfaceMetadata(currentConfiguration: RemoteConfig, requestSignal: AbortSignal) {
  const apiBaseUrl = currentConfiguration.apiBaseUrl.replace(/\/$/, '');
  const interfacesPath = currentConfiguration.interfacesPath.replace(/^\//, '');
  const requestUrl = `${apiBaseUrl}/${interfacesPath}`;
  const requestOptions = { signal: requestSignal, credentials: currentConfiguration.credentials };
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
  hasInitialMetadata = true;
  pendingStatusUpdates.clear();
  emitDataState('READY');
}

function handleMetadataFailure(requestSignal: AbortSignal) {
  const requestTimedOut = requestSignal.aborted;
  const failureMessage = requestTimedOut ? 'Loading interfaces timed out.' : 'Unable to load interfaces.';
  showLoadingError('METADATA_FAILED', failureMessage);
}

async function loadInterfaces() {
  const inputs = mountedInputs;
  const cannotStartLoad = inputs === undefined || isUnmounted || isLoading.value;
  if (cannotStartLoad) return;

  errorMessage.value = '';
  isLoading.value = true;
  emitDataState('LOADING');
  const subscriptionSucceeded = subscribeToStatusUpdates(inputs);
  const subscriptionFailed = subscriptionSucceeded === false;
  if (subscriptionFailed) return;

  abortController = new AbortController();
  const requestSignal = abortController.signal;
  requestTimeout = setTimeout(() => { abortController?.abort(); }, inputs.config.requestTimeoutMs);
  try {
    const fetchedInterfaces = await fetchInterfaceMetadata(inputs.config, requestSignal);
    if (isUnmounted) return;
    const requestTimedOut = requestSignal.aborted;
    if (requestTimedOut) handleMetadataFailure(requestSignal);
    else applyInitialInterfaces(fetchedInterfaces);
  } catch {
    const shouldReportFailure = isUnmounted === false;
    if (shouldReportFailure) handleMetadataFailure(requestSignal);
  } finally {
    clearTimeout(requestTimeout);
    isLoading.value = false;
  }
}

onMounted(initializeInterfaces);
onBeforeUnmount(cleanupSubscriptionAndRequest);
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
