
import { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import { InitialFilters } from '../features/quiz/types';

export function useDependentFilters({ selectedFilters, setSelectedFilters, classificationMap }: {
  selectedFilters: InitialFilters;
  setSelectedFilters: Dispatch<SetStateAction<InitialFilters>>;
  classificationMap: Map<string, Map<string, Set<string>>>;
}) {
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableSubTopics, setAvailableSubTopics] = useState<string[]>([]);
  const isInitialMount = useRef(true);

  // Update Topics when Subject changes
  useEffect(() => {
    const newTopics = new Set<string>();
    if (selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        classificationMap.get(subject)?.forEach((_, topic) => newTopics.add(topic));
      });
    }
    setAvailableTopics(Array.from(newTopics).sort());

    // Reset dependent fields if not initial mount
    if (!isInitialMount.current) {
      setSelectedFilters(prev => ({
          ...prev,
          topic: [],
          subTopic: [],
      }));
    }
  }, [selectedFilters.subject, classificationMap, setSelectedFilters]);

  // Update SubTopics when Topic changes
  useEffect(() => {
    const newSubTopics = new Set<string>();
    if (selectedFilters.topic.length > 0 && selectedFilters.subject.length > 0) {
      selectedFilters.subject.forEach(subject => {
        const topicsMap = classificationMap.get(subject);
        if (topicsMap) {
          selectedFilters.topic.forEach(topic => {
            topicsMap.get(topic)?.forEach(subTopic => newSubTopics.add(subTopic));
          });
        }
      });
    }
    setAvailableSubTopics(Array.from(newSubTopics).sort());

    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        subTopic: [],
      }));
    }
  }, [selectedFilters.topic, selectedFilters.subject, classificationMap, setSelectedFilters]);

  return {
    availableTopics,
    availableSubTopics
  };
}
