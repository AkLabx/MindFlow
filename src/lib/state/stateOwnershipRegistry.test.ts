import { describe, it, expect } from 'vitest';
import { STATE_OWNERSHIP_REGISTRY, assertStateConsumer } from './stateOwnershipRegistry';

describe('stateOwnershipRegistry', () => {
  it('contains all 10 canonical state entities from Constitution Section 3', () => {
    const keys = Object.keys(STATE_OWNERSHIP_REGISTRY);
    expect(keys).toContain('active_target_exam');
    expect(keys).toContain('pinned_exam_list');
    expect(keys).toContain('active_subject_topic');
    expect(keys).toContain('draft_quiz_filters');
    expect(keys).toContain('inflight_quiz_session');
    expect(keys).toContain('question_taxonomy_cache');
    expect(keys).toContain('cognitive_mastery');
    expect(keys).toContain('bookmarked_questions');
    expect(keys).toContain('user_profile_stats');
    expect(keys).toContain('global_ui_overlays');
    expect(keys.length).toBe(10);
  });

  it('validates authorized consumers correctly', () => {
    expect(assertStateConsumer('active_target_exam', 'Dashboard')).toBe(true);
    expect(assertStateConsumer('active_target_exam', 'QuizConfig')).toBe(true);
    expect(assertStateConsumer('bookmarked_questions', 'BookmarksPage')).toBe(true);
    expect(assertStateConsumer('user_profile_stats', 'AnyArbitraryPage')).toBe(true); // 'Entire Application'
  });

  it('detects unauthorized consumers', () => {
    expect(assertStateConsumer('pinned_exam_list', 'UnauthorizedRandomComponent')).toBe(false);
  });
});
