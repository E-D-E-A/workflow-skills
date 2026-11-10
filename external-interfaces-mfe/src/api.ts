import { interfacesSchema, type InterfaceMetadata, type RemoteConfig } from './contracts';

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function metadataUrl(config: RemoteConfig): string {
  // Preserve /api prefixes even if interfacesPath starts with '/'.
  return `${config.apiBaseUrl.replace(/\/$/, '')}/${config.interfacesPath.replace(/^\//, '')}`;
}

/** Adapt this one function if your internal API requires a host HTTP client. */
export async function fetchInterfaces(config: RemoteConfig, signal: AbortSignal,
  fetcher: FetchLike = (input, init) => fetch(input, init)): Promise<InterfaceMetadata[]> {
  const response = await fetcher(metadataUrl(config), {
    method: 'GET', signal, credentials: config.credentials,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Metadata request failed (HTTP ${response.status})`);
  return interfacesSchema.parse(await response.json());
}
