import { User } from '@supabase/supabase-js';
import { AppRole } from '@/config/permissions';

export class AuthPolicy {
  /**
   * Returns true if the route requires authentication and the user is NOT authenticated.
   */
  static isUnauthorized(requiresAuth: boolean, user: User | null | undefined): boolean {
    return requiresAuth && !user;
  }

  /**
   * Determines if caller has administrative privileges.
   * Checks authoritative RBAC roles first, profile fallback second, and transitional email third.
   */
  static isAdmin(
    user: User | null | undefined,
    profile?: any | null,
    roles?: AppRole[]
  ): boolean {
    if (!user) return false;

    // 1. Authoritative RBAC check
    if (roles && (roles.includes('super_admin') || roles.includes('admin'))) {
      return true;
    }

    // 2. Profile role attribute check (if view or RPC attached role)
    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      return true;
    }
    if (Array.isArray(profile?.roles) && (profile.roles.includes('admin') || profile.roles.includes('super_admin'))) {
      return true;
    }

    return false;
  }

  /**
   * Checks if caller has any of the required application roles.
   * Super Admin inherits all roles. Admin inherits moderator and content_creator.
   */
  static hasRequiredRole(
    user: User | null | undefined,
    roles: AppRole[] | undefined,
    required: AppRole | AppRole[]
  ): boolean {
    if (!user) return false;
    const currentRoles = roles || [];

    // super_admin satisfies any role requirement
    if (currentRoles.includes('super_admin')) return true;

    const requiredList = Array.isArray(required) ? required : [required];

    // admin inherits moderator and content_creator capabilities
    if (currentRoles.includes('admin') && (
      requiredList.includes('admin') ||
      requiredList.includes('moderator') ||
      requiredList.includes('content_creator')
    )) {
      return true;
    }

    return requiredList.some(r => currentRoles.includes(r));
  }
}
