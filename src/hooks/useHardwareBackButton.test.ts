/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { resolveHardwareBackTarget } from './useHardwareBackButton';

describe('resolveHardwareBackTarget (Phase 9 Hierarchical Back Navigation)', () => {
  it('routes /quiz/subject/:name/topics back to /quiz/subject/:name', () => {
    expect(resolveHardwareBackTarget('/quiz/subject/Indian%20Polity/topics')).toBe('/quiz/subject/Indian%20Polity');
    expect(resolveHardwareBackTarget('/quiz/subject/History/topics/')).toBe('/quiz/subject/History');
  });

  it('routes legacy /subject/:name/topics back to /subject/:name', () => {
    expect(resolveHardwareBackTarget('/subject/History/topics')).toBe('/subject/History');
    expect(resolveHardwareBackTarget('/subject/Geography/topics/')).toBe('/subject/Geography');
  });

  it('routes /vocab/* and legacy vocab routes back to /english', () => {
    expect(resolveHardwareBackTarget('/vocab/idioms/config')).toBe('/english');
    expect(resolveHardwareBackTarget('/vocab/synonyms/session/deck-1')).toBe('/english');
    expect(resolveHardwareBackTarget('/vocab/ows/library')).toBe('/english');
    expect(resolveHardwareBackTarget('/flashcards/summary')).toBe('/english');
    expect(resolveHardwareBackTarget('/idioms')).toBe('/english');
    expect(resolveHardwareBackTarget('/synonyms')).toBe('/english');
    expect(resolveHardwareBackTarget('/ows')).toBe('/english');
  });

  it('preserves multi-level Test Series and MCQs hierarchy', () => {
    expect(resolveHardwareBackTarget('/mcqs/test-series/category/ssc')).toBe('/mcqs/test-series');
    expect(resolveHardwareBackTarget('/mcqs/test-series/series/cgl-1')).toBe('/mcqs/test-series');
    expect(resolveHardwareBackTarget('/mcqs/test-series/test/mock-1')).toBe('/mcqs/test-series');
    expect(resolveHardwareBackTarget('/mcqs/test-series')).toBe('/mcqs');
    expect(resolveHardwareBackTarget('/mcqs/uploadcustomquiz')).toBe('/mcqs');
    expect(resolveHardwareBackTarget('/mcqs')).toBe('/dashboard');
  });

  it('preserves Community, Reels, and Messaging parent hierarchy', () => {
    expect(resolveHardwareBackTarget('/messages/room-42')).toBe('/messages');
    expect(resolveHardwareBackTarget('/messages')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/community/reels/abc/comments')).toBe('/community/reels');
    expect(resolveHardwareBackTarget('/community/reels')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/community/post/99')).toBe('/community');
    expect(resolveHardwareBackTarget('/community/search')).toBe('/community');
    expect(resolveHardwareBackTarget('/u/aalok')).toBe('/community');
    expect(resolveHardwareBackTarget('/community')).toBe('/dashboard');
  });

  it('preserves Settings, Profile, About, School, Tools, and AI hierarchies', () => {
    expect(resolveHardwareBackTarget('/settings/deleteaccount')).toBe('/settings');
    expect(resolveHardwareBackTarget('/settings/my-reports')).toBe('/settings');
    expect(resolveHardwareBackTarget('/settings')).toBe('/profile');
    expect(resolveHardwareBackTarget('/profile/preferences')).toBe('/profile');
    expect(resolveHardwareBackTarget('/profile/subscription')).toBe('/profile');
    expect(resolveHardwareBackTarget('/profile/support')).toBe('/profile');
    expect(resolveHardwareBackTarget('/profile')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/about/terms-of-use')).toBe('/about');
    expect(resolveHardwareBackTarget('/about')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/school/download')).toBe('/school');
    expect(resolveHardwareBackTarget('/school')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/tools/text-exporter')).toBe('/tools');
    expect(resolveHardwareBackTarget('/tools')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/ai/talk')).toBe('/ai');
    expect(resolveHardwareBackTarget('/ai')).toBe('/dashboard');
  });

  it('routes main section and quiz sub-routes cleanly to /dashboard', () => {
    expect(resolveHardwareBackTarget('/quiz/config')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/quiz/library')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/quiz/session/learning/123')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/quiz/subject/Polity')).toBe('/dashboard');
    expect(resolveHardwareBackTarget('/unknown-deep-link')).toBe('/dashboard');
  });
});
