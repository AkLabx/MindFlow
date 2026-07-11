import { describe, it, expect } from 'vitest';
import { getCanonicalAvatarUrl, getDeterministicFallback } from './avatar';

describe('avatar utils', () => {
  describe('getCanonicalAvatarUrl', () => {
    describe('isPollutedAvatar logic', () => {
      const getAvatar = (url: string | null | undefined) =>
        getCanonicalAvatarUrl({ avatar_url: url }, null);

      it('rejects null/undefined/empty values', () => {
        expect(getAvatar(null)).toContain('api.dicebear.com');
        expect(getAvatar(undefined)).toContain('api.dicebear.com');
        expect(getAvatar('')).toContain('api.dicebear.com');
        expect(getAvatar('   ')).toContain('api.dicebear.com');
      });

      it('rejects data:image/svg+xml', () => {
        expect(getAvatar('data:image/svg+xml;base64,PHN2Zy...')).toContain('api.dicebear.com');
      });

      it('rejects assets/default-avatar', () => {
        expect(getAvatar('/assets/default-avatar.png')).toContain('api.dicebear.com');
      });

      it('rejects legacy DiceBear avatar URLs', () => {
        expect(getAvatar('https://dicebear.com/7.x/avataaars/svg?seed=test')).toContain('api.dicebear.com');
      });

      it('accepts a normal external avatar URL', () => {
        const validUrl = 'https://example.com/avatar.png';
        expect(getAvatar(validUrl)).toBe(validUrl);
      });
    });

    describe('fallback logic', () => {
      it('returns a valid profile.avatar_url when it is a canonical, non-polluted avatar', () => {
        const url = 'https://example.com/profile.jpg';
        expect(getCanonicalAvatarUrl({ avatar_url: url }, null)).toBe(url);
      });

      it('ignores polluted/default profile avatars and falls back to user metadata', () => {
        const userAvatar = 'https://example.com/user.jpg';
        expect(
          getCanonicalAvatarUrl(
            { avatar_url: 'assets/default-avatar' },
            { user_metadata: { avatar_url: userAvatar } }
          )
        ).toBe(userAvatar);
      });

      it('ignores polluted/default user metadata avatars and falls back to deterministic dicebear', () => {
        const url = getCanonicalAvatarUrl(
          { avatar_url: null },
          { user_metadata: { avatar_url: 'data:image/svg+xml' } }
        );
        expect(url).toContain('api.dicebear.com');
      });

      it('uses full_name as the fallback seed when available', () => {
        const url = getCanonicalAvatarUrl(null, { user_metadata: { full_name: 'John Doe' } });
        expect(url).toContain('seed=John%20Doe');
      });

      it('falls back to email when full_name is unavailable', () => {
        const url = getCanonicalAvatarUrl(null, { email: 'test@example.com' });
        expect(url).toContain('seed=test%40example.com');
      });

      it('uses options.fallbackSeed when neither full_name nor email exists', () => {
        const url = getCanonicalAvatarUrl(null, null, { fallbackSeed: 'CustomSeed' });
        expect(url).toContain('seed=CustomSeed');
      });

      it('falls back to default User seed when no other seed is available', () => {
        const url = getCanonicalAvatarUrl(null, null);
        expect(url).toContain('seed=User');
      });
    });

    describe('cache busting logic', () => {
      it('appends updated_at timestamp correctly to valid profile urls', () => {
        const timestamp = '2023-10-01T12:00:00.000Z';
        const expectedTime = new Date(timestamp).getTime();
        const url = getCanonicalAvatarUrl(
          { avatar_url: 'https://example.com/avatar.png', updated_at: timestamp },
          null
        );
        expect(url).toBe(`https://example.com/avatar.png?t=${expectedTime}`);
      });

      it('handles urls that already have query params for cache busting', () => {
         const timestamp = '2023-10-01T12:00:00.000Z';
         const expectedTime = new Date(timestamp).getTime();
         const url = getCanonicalAvatarUrl(
           { avatar_url: 'https://example.com/avatar.png?size=large', updated_at: timestamp },
           null
         );
         expect(url).toBe(`https://example.com/avatar.png?size=large&t=${expectedTime}`);
      });

      it('does not append cache buster to default dicebear avatars', () => {
        const timestamp = '2023-10-01T12:00:00.000Z';
        const url = getCanonicalAvatarUrl(
          { avatar_url: null, updated_at: timestamp },
          null
        );
        expect(url).not.toContain('t=');
      });
    });
  });

  describe('getDeterministicFallback', () => {
    it('returns default User seed when no seed is provided', () => {
      expect(getDeterministicFallback()).toContain('seed=User');
    });

    it('returns provided seed URL encoded', () => {
      expect(getDeterministicFallback('Hello World')).toContain('seed=Hello%20World');
    });
  });
});
