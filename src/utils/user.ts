/**
 * User Identity & Display Name Utilities
 *
 * Provides resilient, canonical resolution of user display names across
 * Supabase public profiles, auth user metadata, OAuth providers, and fallbacks.
 */

/**
 * Resolves a friendly display name for a user across all profile and metadata sources.
 *
 * Priority Resolution Order:
 * 1. profile.full_name (Canonical public profile from database)
 * 2. user.user_metadata.full_name (Auth metadata set on signup / profile update)
 * 3. user.user_metadata.name (Common in OAuth providers e.g. Google)
 * 4. user.user_metadata.display_name (Supabase signup display_name)
 * 5. profile.username (User chosen unique handle)
 * 6. user.user_metadata.username
 * 7. user.user_metadata.given_name / user.user_metadata.first_name
 * 8. user.email prefix (e.g. 'john' from 'john@example.com')
 * 9. Fallback string (default: 'Aspirant')
 *
 * @param profile - Supabase `public.profiles` row or equivalent object.
 * @param user - Supabase `User` object or session user.
 * @param fallback - Fallback string if no name or email could be found.
 * @returns The resolved display name string.
 */
export const getUserDisplayName = (
  profile?: any | null,
  user?: any | null,
  fallback: string = 'Aspirant'
): string => {
  const candidate =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.user_metadata?.display_name?.trim() ||
    profile?.username?.trim() ||
    user?.user_metadata?.username?.trim() ||
    user?.user_metadata?.given_name?.trim() ||
    user?.user_metadata?.first_name?.trim();

  if (candidate) {
    return candidate;
  }

  const email = user?.email?.trim();
  if (email && email.includes('@')) {
    const prefix = email.split('@')[0]?.trim();
    if (prefix) {
      return prefix;
    }
  }

  return fallback;
};
