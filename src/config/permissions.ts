/**
 * Permissions Registry
 *
 * Constants representing roles and permission levels.
 */
export const PERMISSIONS = {
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest', // Though guest login is prohibited, this helps with explicit typing.
  },
  DEFAULT_ADMIN_EMAIL: 'admin@mindflow.com',
} as const;
