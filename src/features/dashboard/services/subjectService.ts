import { supabase } from '@/lib/supabase';

export interface SubjectTopicsHierarchy {
  [topic: string]: Set<string>;
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
      if (!row.topic) continue; // Skip if no topic

      if (!hierarchy[row.topic]) {
        hierarchy[row.topic] = new Set<string>();
      }

      if (row.subTopic) {
        hierarchy[row.topic].add(row.subTopic);
      }
    }

    return hierarchy;
  }
};
