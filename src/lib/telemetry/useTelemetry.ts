import { useCallback } from 'react';
import { telemetry, TelemetryEventName, TelemetryPayloads, TelemetryRecord } from './telemetryService';

/**
 * React hook providing convenient, memoized access to the central TelemetryService.
 */
export function useTelemetry() {
  const emit = useCallback(<K extends TelemetryEventName>(name: K, payload: TelemetryPayloads[K]) => {
    telemetry.emit(name, payload);
  }, []);

  const getHistory = useCallback((): readonly TelemetryRecord[] => {
    return telemetry.getHistory();
  }, []);

  const clear = useCallback(() => {
    telemetry.clear();
  }, []);

  return {
    emit,
    getHistory,
    clear,
  };
}
