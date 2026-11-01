import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { Question } from '@/features/quiz/types';

export interface SubjectTopicsHierarchy {
  [topic: string]: Set<string>;
}

export interface SubjectTopicsCounts {
  [topic: string]: {
    [subTopic: string]: number;
  };
}

export interface SubjectTaxonomy {
  hierarchy: Record<string, string[]>;
  counts: Record<string, Record<string, number>>;
  totalQuestions: number;
}

export const subjectService = {
  /**
   * Fetches the complete aggregated taxonomy (topics, subtopics, question counts)
   * using a 3-tier strategy: RAM -> Local IndexedDB -> Postgres Summary RPC.
   */
  async fetchSubjectTaxonomy(subject: string): Promise<SubjectTaxonomy> {
    if (!subject) {
      return { hierarchy: {}, counts: {}, totalQuestions: 0 };
    }

    // 1. Tier 1: Check Local IndexedDB Cache
    try {
      const cachedData = await db.getQuizMetadataCache();
      if (cachedData && cachedData.length > 0) {
        const subjectQuestions = cachedData.filter(
          (q) => (q.subject ?? q.classification?.subject) === subject
        );

        if (subjectQuestions.length > 0) {
          const hierarchy: Record<string, Set<string>> = {};
          const counts: Record<string, Record<string, number>> = {};
          let totalQuestions = 0;

          for (const q of subjectQuestions) {
            const topic = q.topic ?? q.classification?.topic;
            if (!topic) continue;

            const sub = (q.subTopic ?? q.classification?.subTopic) || 'General';

            if (!hierarchy[topic]) {
              hierarchy[topic] = new Set<string>();
            }
            hierarchy[topic].add(sub);

            if (!counts[topic]) {
              counts[topic] = {};
            }
            counts[topic][sub] = (counts[topic][sub] || 0) + 1;
            totalQuestions++;
          }

          const sortedHierarchy: Record<string, string[]> = {};
          for (const [top, subSet] of Object.entries(hierarchy)) {
            sortedHierarchy[top] = Array.from(subSet).sort();
          }

          return {
            hierarchy: sortedHierarchy,
            counts,
            totalQuestions,
          };
        }
      }
    } catch (err) {
      console.warn('[subjectService] Local IndexedDB read warning:', err);
    }

    // 2. Tier 2: Call Server Aggregation RPC (15ms, ~1.5 KB payload)
    try {
      const { data, error } = await supabase.rpc('get_subject_topics_summary', {
        p_subject: subject,
      });

      if (error) {
        console.error('[subjectService] Error calling get_subject_topics_summary RPC:', error);
        throw error;
      }

      if (!data || typeof data !== 'object') {
        return { hierarchy: {}, counts: {}, totalQuestions: 0 };
      }

      const rawSummary = data as Record<
        string,
        { total?: number; subtopics?: Record<string, number> }
      >;

      const hierarchy: Record<string, string[]> = {};
      const counts: Record<string, Record<string, number>> = {};
      let totalQuestions = 0;

      for (const [topic, info] of Object.entries(rawSummary)) {
        const subMap = info.subtopics || {};
        hierarchy[topic] = Object.keys(subMap).sort();
        counts[topic] = subMap;
        totalQuestions += info.total || 0;
      }

      return {
        hierarchy,
        counts,
        totalQuestions,
      };
    } catch (rpcErr) {
      console.error('[subjectService] RPC failed, falling back to REST query:', rpcErr);

      // Fallback: PostgREST query if RPC fails
      const { data, error } = await supabase
        .from('questions')
        .select('topic, subTopic')
        .eq('subject', subject)
        .is('deleted_at', null);

      if (error) throw error;
      if (!data) return { hierarchy: {}, counts: {}, totalQuestions: 0 };

      const hierarchySets: Record<string, Set<string>> = {};
      const counts: Record<string, Record<string, number>> = {};
      let total = 0;

      for (const row of data) {
        if (!row.topic) continue;
        const sub = row.subTopic || 'General';

        if (!hierarchySets[row.topic]) {
          hierarchySets[row.topic] = new Set<string>();
        }
        hierarchySets[row.topic].add(sub);

        if (!counts[row.topic]) {
          counts[row.topic] = {};
        }
        counts[row.topic][sub] = (counts[row.topic][sub] || 0) + 1;
        total++;
      }

      const hierarchy: Record<string, string[]> = {};
      for (const [t, set] of Object.entries(hierarchySets)) {
        hierarchy[t] = Array.from(set).sort();
      }

      return { hierarchy, counts, totalQuestions: total };
    }
  },

  /**
   * Fetches lightweight question metadata for a single specific subtopic.
   * Enables zero-block JIT quiz initiation for fast tappers or cold-cache visitors.
   */
  async fetchSubtopicMetadata(
    subject: string,
    topic: string,
    subTopic: string
  ): Promise<Question[]> {
    // 1. Check local IndexedDB first
    try {
      const cached = await db.getQuizMetadataCache();
      if (cached && cached.length > 0) {
        const matched = cached.filter(
          (q) =>
            (q.subject ?? q.classification?.subject) === subject &&
            (q.topic ?? q.classification?.topic) === topic &&
            ((q.subTopic ?? q.classification?.subTopic) === subTopic ||
              (subTopic === 'General' && !(q.subTopic ?? q.classification?.subTopic)))
        );
        if (matched.length > 0) {
          return matched;
        }
      }
    } catch (err) {
      console.warn('[subjectService] Local subtopic read warning:', err);
    }

    // 2. Query targeted RPC from server (~30-80 items, ~100ms)
    try {
      const { data, error } = await supabase.rpc('get_subtopic_quiz_metadata', {
        p_subject: subject,
        p_topic: topic,
        p_subtopic: subTopic,
      });

      if (error) {
        console.error('[subjectService] Error fetching subtopic metadata RPC:', error);
        throw error;
      }

      if (!data || data.length === 0) return [];

      const mapped: Question[] = data.map((row: any) => ({
        id: row.id,
        v1_id: row.v1_id || '',
        subject: row.subject,
        topic: row.topic,
        subTopic: row.subTopic,
        sourceInfo: {
          examName: row.examName || '',
          examYear: row.examYear || 0,
          examDateShift: row.examDateShift,
        },
        classification: {
          subject: row.subject || '',
          topic: row.topic || '',
          subTopic: row.subTopic,
        },
        tags: row.tags || [],
        properties: {
          difficulty: row.difficulty || 'Medium',
          questionType: row.questionType || 'MCQ',
        },
        question: '',
        options: [],
        correct: '',
        explanation: {},
        updated_at: row.updated_at,
      }));

      // Cache the fetched subtopic metadata in IndexedDB so it's permanently available
      await db.saveQuizMetadataCache(mapped).catch((e) =>
        console.warn('[subjectService] Failed to cache subtopic metadata in IDB:', e)
      );

      return mapped;
    } catch (err) {
      console.error('[subjectService] Subtopic metadata fetch error:', err);
      return [];
    }
  },

  /**
   * Backward-compatible adapters
   */
  async fetchSubjectTopics(subject: string): Promise<SubjectTopicsHierarchy> {
    const taxonomy = await this.fetchSubjectTaxonomy(subject);
    const hierarchy: SubjectTopicsHierarchy = {};
    for (const [topic, subtopics] of Object.entries(taxonomy.hierarchy)) {
      hierarchy[topic] = new Set<string>(subtopics as string[]);
    }
    return hierarchy;
  },

  async fetchSubjectTopicCounts(subject: string): Promise<SubjectTopicsCounts> {
    const taxonomy = await this.fetchSubjectTaxonomy(subject);
    return taxonomy.counts;
  },
};
