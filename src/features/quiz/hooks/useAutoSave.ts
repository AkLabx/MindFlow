import { useEffect, useRef } from 'react';
import { db } from '../../../lib/db';

interface UseAutoSaveProps {
  sessionId: string;
  state: any; // Can be more strictly typed based on quizReducer state
  intervalMs?: number;
}

/**
 * Enterprise Level Auto-Save Hook
 * Debounces state changes and saves them to IndexedDB for offline resilience.
 */
export function useAutoSave({ sessionId, state, intervalMs = 3000 }: UseAutoSaveProps) {
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    useEffect(() => {
        if (!sessionId) return;

        // Perform initial save or sync here if necessary.
        // For now, we rely on the interval to persist the latest state.

        const saveInterval = setInterval(async () => {
             try {
                // Background Sync to IndexedDB
                await db.saveActiveSession(sessionId, stateRef.current);
             } catch (error) {
                 console.error("AutoSave Failed:", error);
             }
        }, intervalMs);

        return () => {
             clearInterval(saveInterval);
             // Final flush on unmount
             db.saveActiveSession(sessionId, stateRef.current).catch(console.error);
        };
    }, [sessionId, intervalMs]);

    return {
        clearSavedSession: () => db.clearActiveSession(sessionId)
    };
}
