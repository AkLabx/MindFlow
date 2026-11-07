/**
 * Permissions Registry
 *
 * Constants representing strongly typed application roles and permission levels.
 * Compliant with MindFlow PostgreSQL 17 RBAC architecture.
 */

export type AppRole =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'content_creator'
  | 'teacher'
  | 'student'
  | 'user'
  | 'guest';

export const PERMISSIONS = {
  ROLES: {
    SUPER_ADMIN: 'super_admin' as AppRole,
    ADMIN: 'admin' as AppRole,
    MODERATOR: 'moderator' as AppRole,
    CONTENT_CREATOR: 'content_creator' as AppRole,
    TEACHER: 'teacher' as AppRole,
    STUDENT: 'student' as AppRole,
    USER: 'user' as AppRole,
    GUEST: 'guest' as AppRole,
  },
  DEFAULT_ADMIN_EMAIL: 'admin@mindflow.com',
  TRANSITIONAL_ADMIN_EMAIL: 'admin@mindflow.com',
} as const;
