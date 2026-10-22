import { supabase } from '@/lib/supabase';

export interface SubjectTopicsHierarchy {
  [topic: string]: Set<string>;
}

export interface SubjectTopicsCounts {
  [topic: string]: {
    [subTopic: string]: number;
  };
}

export const subjectService = {
  async fetchSubjectTopics(subject: string): Promise<SubjectTopicsHierarchy> {
    const { data, error } = await supabase
      .from('questions')
      .select('topic, subTopic')
      .eq('subject', subject)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching subject topics:', error);
      throw error;
    }

    if (!data) return {};

    const hierarchy: SubjectTopicsHierarchy = {};

    for (const row of data) {
      if (!row.topic) continue;

      if (!hierarchy[row.topic]) {
        hierarchy[row.topic] = new Set<string>();
      }

      if (row.subTopic) {
        hierarchy[row.topic].add(row.subTopic);
      }
    }

    return hierarchy;
  },

  async fetchSubjectTopicCounts(subject: string): Promise<SubjectTopicsCounts> {
    const { data, error } = await supabase
      .from('questions')
      .select('topic, subTopic')
      .eq('subject', subject)
      .is('deleted_at', null);

    if (error) {
      console.error('Error fetching subject topics counts:', error);
      throw error;
    }

    if (!data) return {};

    const counts: SubjectTopicsCounts = {};

    for (const row of data) {
      if (!row.topic) continue;

      if (!counts[row.topic]) {
        counts[row.topic] = {};
      }

      const sub = row.subTopic || '';

      if (!counts[row.topic][sub]) {
        counts[row.topic][sub] = 0;
      }

      counts[row.topic][sub]++;
    }

    return counts;
  }
};
