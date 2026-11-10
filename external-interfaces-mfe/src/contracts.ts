import { z } from 'zod';

export type Status = number | null;
export type MessageListener = (message: unknown) => void;

/** The original live host object; the remote never creates or closes a connection. */
export interface HostWebsocket {
  subscribe(topic: string, listener: MessageListener): void;
  unsubscribe(topic: string): void;
}

const interfaceIdSchema = z.number().int().safe();
const connectionStatusSchema = z.number().finite().nullable();
export const normalizedUpdateSchema = z.object({
  id: interfaceIdSchema,
  connectionStatus: connectionStatusSchema,
});
export type NormalizedStatusUpdate = z.infer<typeof normalizedUpdateSchema>;
/** Synchronous and pure. Return null for irrelevant messages. */
export type NormalizeMessage = (message: unknown) => NormalizedStatusUpdate | null;

const metadataSchema = z.object({
  id: interfaceIdSchema,
  connectionStatus: connectionStatusSchema,
  displayName: z.string(),
  groupName: z.string().nullable(),
  type: z.unknown(),
}).passthrough();
export type InterfaceMetadata = z.infer<typeof metadataSchema>;

export const interfacesSchema = z.array(metadataSchema).superRefine((interfaces, validationContext) => {
  const seenInterfaceIds = new Set<number>();
  for (const [interfaceIndex, externalInterface] of interfaces.entries()) {
    const isDuplicateId = seenInterfaceIds.has(externalInterface.id);
    if (isDuplicateId) {
      validationContext.addIssue({
        code: 'custom',
        path: [interfaceIndex, 'id'],
        message: 'Duplicate interface ID',
      });
    }
    seenInterfaceIds.add(externalInterface.id);
  }
});

function isValidApiBaseUrl(apiBaseUrl: string) {
  const isHostRootedPath = apiBaseUrl.startsWith('/');
  const isProtocolRelativePath = apiBaseUrl.startsWith('//');
  const hasBackslash = apiBaseUrl.includes('\\');
  const hasQueryOrFragment = /[?#]/.test(apiBaseUrl);
  const isRelativeBaseUrl = isHostRootedPath && !isProtocolRelativePath && !hasBackslash;
  let isValidBaseUrl = false;
  if (isRelativeBaseUrl) {
    isValidBaseUrl = hasQueryOrFragment === false;
  } else {
    try {
      const parsedUrl = new URL(apiBaseUrl);
      const usesHttp = parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
      const hasUrlSuffix = Boolean(parsedUrl.search || parsedUrl.hash);
      const containsCredentials = Boolean(parsedUrl.username || parsedUrl.password);
      isValidBaseUrl = usesHttp && !hasUrlSuffix && !containsCredentials;
    } catch {
      isValidBaseUrl = false;
    }
  }
  return isValidBaseUrl;
}

function isValidInterfacesPath(interfacesPath: string) {
  const hasProtocol = interfacesPath.includes('://');
  const isProtocolRelativePath = interfacesPath.startsWith('//');
  const hasBackslash = interfacesPath.includes('\\');
  const pathSegments = interfacesPath.split('/');
  const hasParentSegment = pathSegments.includes('..');
  const isValidPath = !hasProtocol && !isProtocolRelativePath && !hasBackslash && !hasParentSegment;
  return isValidPath;
}

export const configSchema = z.object({
  apiBaseUrl: z.string().min(1).refine(isValidApiBaseUrl,
    'Expected an HTTP(S) base URL or host-rooted path, without query/hash'),
  // The actual internal endpoint is intentionally left for the receiving repo.
  interfacesPath: z.string().min(1).default('/interfaces-x').refine(isValidInterfacesPath,
    'Expected an API path under apiBaseUrl'),
  topic: z.string().min(1).default('interface-communication-x'),
  credentials: z.enum(['omit', 'same-origin', 'include']).default('same-origin'),
  statusLabels: z.record(z.string()).default({}),
  statusColors: z.record(z.enum(['success', 'warning', 'error', 'info', 'primary', 'secondary'])).default({}),
});
export type RemoteConfig = z.infer<typeof configSchema>;
export type RemoteConfigInput = z.input<typeof configSchema>;

function hasWebsocketMethods(candidate: unknown) {
  const isObject = candidate !== null && typeof candidate === 'object';
  let hasRequiredMethods = false;
  if (isObject) {
    const websocket = candidate as Partial<HostWebsocket>;
    const hasSubscribeMethod = typeof websocket.subscribe === 'function';
    const hasUnsubscribeMethod = typeof websocket.unsubscribe === 'function';
    hasRequiredMethods = hasSubscribeMethod && hasUnsubscribeMethod;
  }
  return hasRequiredMethods;
}
function isNormalizerFunction(candidate: unknown) {
  const isFunction = typeof candidate === 'function';
  return isFunction;
}

// z.custom preserves class identity, prototype methods and private fields.
// Parsing the manager into a new plain object would break its method receiver.
export const websocketSchema = z.custom<HostWebsocket>(hasWebsocketMethods,
  'websocket must have callable subscribe and unsubscribe methods');
export const normalizerSchema = z.custom<NormalizeMessage>(isNormalizerFunction,
  'normalizeMessage must be a function');

export function parseInputs(config: unknown, websocket: unknown, normalizeMessage: unknown) {
  const serializedConfig = z.string().parse(config);
  const parsedConfig = JSON.parse(serializedConfig);
  const validatedConfig = configSchema.parse(parsedConfig);
  const validatedWebsocket = websocketSchema.parse(websocket);
  const validatedNormalizer = normalizerSchema.parse(normalizeMessage);
  const validatedInputs = {
    config: validatedConfig,
    websocket: validatedWebsocket,
    normalizeMessage: validatedNormalizer,
  };
  return validatedInputs;
}
