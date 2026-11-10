import {
  interfacesSchema,
  normalizedUpdateSchema,
  type HostWebsocket,
  type NormalizeMessage,
  type NormalizedStatusUpdate,
  type RemoteConfig,
} from './contracts';

interface StatusSubscriptionOptions {
  websocket: HostWebsocket;
  topic: string;
  normalizeMessage: NormalizeMessage;
  onStatusUpdate: (update: NormalizedStatusUpdate) => void;
  onDiagnostic: (code: string, message: string) => void;
}

export function subscribeToInterfaceStatuses(options: StatusSubscriptionOptions) {
  const { websocket, topic, normalizeMessage, onStatusUpdate, onDiagnostic } = options;
  let isActive = true;

  function handleMessage(rawMessage: unknown) {
    const shouldIgnoreMessage = isActive === false;
    if (shouldIgnoreMessage) return;

    let normalizedMessage: unknown;
    try {
      normalizedMessage = normalizeMessage(rawMessage);
    } catch {
      onDiagnostic('NORMALIZER_FAILED', 'The host normalizer threw an error.');
      return;
    }
    const isIrrelevantMessage = normalizedMessage === null;
    if (isIrrelevantMessage) return;

    const validationResult = normalizedUpdateSchema.safeParse(normalizedMessage);
    const isInvalidUpdate = validationResult.success === false;
    if (isInvalidUpdate) {
      onDiagnostic('INVALID_UPDATE', 'Expected { id, connectionStatus } or null.');
      return;
    }
    onStatusUpdate(validationResult.data);
  }

  // Preserve the manager's method receiver. A failed subscription has no cleanup.
  websocket.subscribe(topic, handleMessage);

  function unsubscribe() {
    const alreadyStopped = isActive === false;
    if (alreadyStopped) return;
    isActive = false;
    try {
      websocket.unsubscribe(topic);
    } catch {
      onDiagnostic('UNSUBSCRIBE_FAILED', 'Unable to remove the topic subscription.');
    }
  }
  return unsubscribe;
}

export async function fetchInterfaceMetadata(configuration: RemoteConfig) {
  const apiBaseUrl = configuration.apiBaseUrl.replace(/\/$/, '');
  const interfacesPath = configuration.interfacesPath.replace(/^\//, '');
  const requestUrl = `${apiBaseUrl}/${interfacesPath}`;
  const requestOptions = { credentials: configuration.credentials };
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
