import { useState, useCallback, useEffect } from 'react';
import { db, IdiomInteraction } from '../../../lib/db';
import { Idiom } from '../../quiz/types';

export const useIdiomProgress = () => {
  const [interactions, setInteractions] = useState<Record<string, IdiomInteraction>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const storedInteractions = await db.getAllIdiomInteractions();
        const interactionsMap: Record<string, IdiomInteraction> = {};
        storedInteractions.forEach(int => interactionsMap[int.idiomId] = int);
        setInteractions(interactionsMap);
      } catch (e) {
        console.error('Failed to load Idiom interactions from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updateInteraction = async (idiomId: string, isRead: boolean) => {
      const updated: IdiomInteraction = {
          idiomId,
          isRead,
          lastInteractedAt: new Date().toISOString()
      };

      setInteractions(prev => ({ ...prev, [idiomId]: updated }));

      try {
          await db.saveIdiomInteraction(updated);
      } catch (e) {
          console.error('Failed to save Idiom interaction', e);
      }
  };

  /**
   * Toggles the read status of a specific Idiom.
   */
  const toggleReadStatus = useCallback(async (wordObj: Idiom) => {
      const currentInteraction = interactions[wordObj.id];
      const isCurrentlyRead = currentInteraction ? currentInteraction.isRead : false;
      await updateInteraction(wordObj.id, !isCurrentlyRead);
  }, [interactions]);

  /**
   * Determines the read status of a Idiom object.
   */
  const getReadStatus = useCallback((wordObj: Idiom): boolean => {
    const idToCheck = wordObj.id;
    if (idToCheck && interactions[idToCheck]) {
        return interactions[idToCheck].isRead;
    }
    return false;
  }, [interactions]);

  const clearProgress = useCallback(async () => {
    try {
        await db.clearIdiomInteractions();
        setInteractions({});
    } catch (e) {
        console.error('Failed to clear Idiom interactions', e);
    }
  }, []);

  return {
    isLoaded,
    interactions,
    toggleReadStatus,
    getReadStatus,
    clearProgress
  };
};
