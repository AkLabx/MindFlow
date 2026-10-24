import { create } from 'zustand';

export type AppRecoveryStatus =
  | 'HEALTHY'
  | 'HIDDEN'
  | 'RESUMED'
  | 'CHECKING'
  | 'RECOVERING'
  | 'RECOVERED'
  | 'FAILED';

export interface RecoveryTelemetryLog {
  timestamp: string;
  durationMs?: number;
  success: boolean;
  reason?: string;
  error?: string;
  errorCode?: string;
}

interface RecoveryStore {
  status: AppRecoveryStatus;
  telemetry: RecoveryTelemetryLog[];
  setStatus: (status: AppRecoveryStatus, reason?: string) => void;
  logRecoveryAttempt: (log: Omit<RecoveryTelemetryLog, 'timestamp'>) => void;
  resetStatus: () => void;
}

export const useRecoveryStore = create<RecoveryStore>((set) => ({
  status: 'HEALTHY',
  telemetry: [],

  setStatus: (status, reason) => {
    console.log(`[RecoveryManager] State transition -> ${status}${reason ? ` (Reason: ${reason})` : ''}`);
    set({ status });
  },

  logRecoveryAttempt: (log) => {
    const fullLog: RecoveryTelemetryLog = {
      ...log,
      timestamp: new Date().toISOString()
    };

    console.log(`[RecoveryManager] Telemetry Log:`, fullLog);

    set((state) => ({
      // Keep only the last 20 logs to avoid memory leaks
      telemetry: [...state.telemetry.slice(-19), fullLog]
    }));
  },

  resetStatus: () => set({ status: 'HEALTHY' })
}));
