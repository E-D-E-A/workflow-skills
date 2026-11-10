import { z } from 'zod';

export type Status = number | null;
export type MessageListener = (message: unknown) => void;

/** The exact, live host object. The remote never creates or closes a connection. */
export interface HostWebsocket {
  subscribe(topic: string, listener: MessageListener): void;
  unsubscribe(topic: string): void;
}

export const normalizedUpdateSchema = z.object({
  id: z.number().int().safe(),
  connectionStatus: z.number().finite().nullable(),
});
export type NormalizedStatusUpdate = z.infer<typeof normalizedUpdateSchema>;

/** Synchronous and pure. Return null for irrelevant messages. No state writes. */
export type NormalizeMessage = (message: unknown) => NormalizedStatusUpdate | null;

const metadataSchema = z.object({
  id: z.number().int().safe(),
  connectionStatus: z.number().finite().nullable(),
  displayName: z.string(),
  groupName: z.string().nullable(),
  type: z.unknown(),
}).passthrough();
export type InterfaceMetadata = z.infer<typeof metadataSchema>;

export const interfacesSchema = z.array(metadataSchema).superRefine((items, ctx) => {
  const seen = new Set<number>();
  items.forEach((item, index) => {
    if (seen.has(item.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: 'Duplicate interface ID' });
    seen.add(item.id);
  });
});

export const configSchema = z.object({
  // Absolute HTTP(S) URL or a path rooted at the HOST origin (e.g. /api).
  apiBaseUrl: z.string().min(1).refine(value => {
    if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')) return !/[?#]/.test(value);
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && !url.search && !url.hash && !url.username && !url.password;
    } catch { return false; }
  }, 'Expected an HTTP(S) base URL or host-rooted path, without query/hash'),
  // Placeholder path: the internal endpoint spelling was intentionally deferred.
  interfacesPath: z.string().min(1).default('/interfaces-x').refine(
    value => !value.includes('://') && !value.startsWith('//') && !value.includes('\\') && !value.split('/').includes('..'),
    'Expected an API path under apiBaseUrl',
  ),
  topic: z.string().min(1).default('interface-communication-x'),
  credentials: z.enum(['omit', 'same-origin', 'include']).default('same-origin'),
  requestTimeoutMs: z.number().int().positive().max(120000).default(15000),
  // Domain codes were not supplied. Unknown codes are shown neutrally.
  statusLabels: z.record(z.string()).default({}),
  statusColors: z.record(z.enum(['success', 'warning', 'error', 'info', 'primary', 'secondary'])).default({}),
});
export type RemoteConfig = z.infer<typeof configSchema>;
export type RemoteConfigInput = z.input<typeof configSchema>;

// z.custom preserves class identity, prototype methods, and `this` binding.
// Do NOT replace this with z.object({ subscribe: z.function() ... }): parsing
// into a new plain object would destroy private fields/prototype state.
export const websocketSchema = z.custom<HostWebsocket>(value =>
  value !== null && typeof value === 'object' &&
  typeof (value as HostWebsocket).subscribe === 'function' &&
  typeof (value as HostWebsocket).unsubscribe === 'function',
  'websocket must have callable subscribe and unsubscribe methods',
);
export const normalizerSchema = z.custom<NormalizeMessage>(value => typeof value === 'function',
  'normalizeMessage must be a function');

export function parseInputs(config: unknown, websocket: unknown, normalizeMessage: unknown) {
  const serialized = z.string().parse(config);
  return {
    config: configSchema.parse(JSON.parse(serialized)),
    websocket: websocketSchema.parse(websocket),
    normalizeMessage: normalizerSchema.parse(normalizeMessage),
  };
}

export type DataPhase = 'LOADING' | 'READY' | 'ERROR';
export type DiagnosticCode = 'INVALID_PROPS' | 'SUBSCRIBE_FAILED' | 'UNSUBSCRIBE_FAILED' |
  'NORMALIZER_FAILED' | 'INVALID_UPDATE' | 'METADATA_FAILED';
export interface Diagnostic { code: DiagnosticCode; message: string }
export interface Snapshot {
  phase: DataPhase;
  interfaces: readonly InterfaceMetadata[];
  error: string | null;
}
