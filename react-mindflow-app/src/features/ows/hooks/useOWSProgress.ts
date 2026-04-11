import { useState, useCallback, useEffect } from 'react';
import { db, OWSInteraction } from '../../../lib/db';
import { OneWord } from '../../quiz/types';

export const useOWSProgress = () => {
  const [interactions, setInteractions] = useState<Record<string, OWSInteraction>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    const init = async () => {
      try {
        const storedInteractions = await db.getAllOWSInteractions();
        const interactionsMap: Record<string, OWSInteraction> = {};
        storedInteractions.forEach(int => interactionsMap[int.wordId] = int);
        setInteractions(interactionsMap);
      } catch (e) {
        console.error('Failed to load OWS interactions from DB', e);
      } finally {
        setIsLoaded(true);
      }
    };
    init();
  }, []);

  const updateInteraction = async (wordId: string, isRead: boolean) => {
      const updated: OWSInteraction = {
          wordId,
          isRead,
          lastInteractedAt: new Date().toISOString()
      };

      setInteractions(prev => ({ ...prev, [wordId]: updated }));

      try {
          await db.saveOWSInteraction(updated);
      } catch (e) {
          console.error('Failed to save OWS interaction', e);
      }
  };

  /**
   * Toggles the read status of a specific OWS word.
   */
  const toggleReadStatus = useCallback(async (wordObj: OneWord) => {
      const currentInteraction = interactions[wordObj.id];
      const isCurrentlyRead = currentInteraction ? currentInteraction.isRead : false;
      await updateInteraction(wordObj.id, !isCurrentlyRead);
  }, [interactions]);

  /**
   * Determines the read status of a word object.
   */
  const getReadStatus = useCallback((wordObj: OneWord): boolean => {
    const idToCheck = wordObj.id;
    if (idToCheck && interactions[idToCheck]) {
        return interactions[idToCheck].isRead;
    }
    return false;
  }, [interactions]);

  const clearProgress = useCallback(async () => {
    try {
        await db.clearOWSInteractions();
        setInteractions({});
    } catch (e) {
        console.error('Failed to clear OWS interactions', e);
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
