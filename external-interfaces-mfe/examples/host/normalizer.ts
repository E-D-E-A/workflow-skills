import type { NormalizeMessage, NormalizedStatusUpdate, Status } from '../../src/contracts';

/** Replace this adapter for a different client envelope or field naming. */
export const normalizeMessage: NormalizeMessage = (rawMessage: unknown) => {
  let normalizedUpdate: NormalizedStatusUpdate | null = null;
  const isObject = rawMessage !== null && typeof rawMessage === 'object';
  if (isObject) {
    const message = rawMessage as Record<string, unknown>;
    const interfaceId = message.id;
    const communicationStatus = message.communicationStatus;
    const isNumericId = typeof interfaceId === 'number';
    const isSafeIntegerId = Number.isSafeInteger(interfaceId);
    const hasValidId = isNumericId && isSafeIntegerId;
    const isNullStatus = communicationStatus === null;
    const isNumericStatus = typeof communicationStatus === 'number';
    const isFiniteStatus = Number.isFinite(communicationStatus);
    const hasValidStatus = isNullStatus || (isNumericStatus && isFiniteStatus);
    const isValidMessage = hasValidId && hasValidStatus;
    if (isValidMessage) {
      normalizedUpdate = { id: interfaceId as number, connectionStatus: communicationStatus as Status };
    }
  }
  return normalizedUpdate;
};
