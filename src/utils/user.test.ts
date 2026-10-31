import { describe, it, expect } from 'vitest';
import { getUserDisplayName } from './user';

describe('user utils', () => {
  describe('getUserDisplayName', () => {
    it('prioritizes profile.full_name when available', () => {
      const profile = { full_name: 'Guest User', username: 'guest123' };
      const user = {
        email: 'mindflow@user.com',
        user_metadata: { full_name: 'Metadata User' },
      };
      expect(getUserDisplayName(profile, user)).toBe('Guest User');
    });

    it('falls back to user.user_metadata.full_name if profile is null or has empty full_name', () => {
      const profile = { full_name: '   ', username: 'guest123' };
      const user = {
        email: 'mindflow@user.com',
        user_metadata: { full_name: 'Guest User' },
      };
      expect(getUserDisplayName(profile, user)).toBe('Guest User');
      expect(getUserDisplayName(null, user)).toBe('Guest User');
    });

    it('falls back to user_metadata.name (OAuth provider e.g. Google)', () => {
      const user = {
        email: 'alok@gmail.com',
        user_metadata: { name: 'Aalok Sharma' },
      };
      expect(getUserDisplayName(null, user)).toBe('Aalok Sharma');
    });

    it('falls back to user_metadata.display_name', () => {
      const user = {
        email: 'student@example.com',
        user_metadata: { display_name: 'Rank One Aspirant' },
      };
      expect(getUserDisplayName(null, user)).toBe('Rank One Aspirant');
    });

    it('falls back to profile.username when full_name is not set', () => {
      const profile = { username: 'theaspirant_10301e' };
      const user = { email: 'mindflow@user.com' };
      expect(getUserDisplayName(profile, user)).toBe('theaspirant_10301e');
    });

    it('falls back to email prefix if no name or handle exists', () => {
      const user = { email: 'mindflow@user.com' };
      expect(getUserDisplayName(null, user)).toBe('mindflow');
    });

    it('falls back to provided fallback or "Aspirant" when completely empty', () => {
      expect(getUserDisplayName(null, null)).toBe('Aspirant');
      expect(getUserDisplayName(null, null, 'MindFlow User')).toBe('MindFlow User');
      expect(getUserDisplayName({}, { email: '' })).toBe('Aspirant');
    });

    it('handles edge cases with whitespace trimming', () => {
      const profile = { full_name: '  Trimmed Name  ' };
      expect(getUserDisplayName(profile, null)).toBe('Trimmed Name');
    });
  });
});
