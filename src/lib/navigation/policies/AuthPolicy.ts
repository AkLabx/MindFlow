import { User } from '@supabase/supabase-js';

export class AuthPolicy {
  /**
   * Returns true if the route requires authentication and the user is NOT authenticated.
   */
  static isUnauthorized(requiresAuth: boolean, user: User | null | undefined): boolean {
    return requiresAuth && !user;
  }

  static isAdmin(user: User | null | undefined, profile?: any | null): boolean {
    return !!user && (user.email === 'admin@mindflow.com' || profile?.role === 'admin');
  }
}
