import type { NormalizeMessage } from '../../src/contracts';

/** Example for the originally described host payload. Replace ONLY this adapter
 * for a different envelope/field naming. The remote never reads these raw keys. */
export const normalizeMessage: NormalizeMessage = (raw: unknown) => {
  if (raw === null || typeof raw !== 'object') return null;
  const message = raw as Record<string, unknown>;
  if (typeof message.id !== 'number' || !Number.isSafeInteger(message.id)) return null;
  if (message.communicationStatus !== null &&
    (typeof message.communicationStatus !== 'number' || !Number.isFinite(message.communicationStatus))) return null;
  return { id: message.id, connectionStatus: message.communicationStatus as number | null };
};
