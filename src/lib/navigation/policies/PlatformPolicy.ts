import { isNativeApp } from '@/utils/platform';

export class PlatformPolicy {
  /**
   * Defines where an unauthenticated user should land.
   * Unified to return '/' (the Authentication Portal) for all platforms.
   */
  static getGuestEntryRoute(): string {
    return '/';
  }

  /**
   * Defines where a user should go after explicit logout.
   * Unified to return '/' (the Authentication Portal) for all platforms.
   */
  static getLogoutRoute(): string {
    return '/';
  }
}
