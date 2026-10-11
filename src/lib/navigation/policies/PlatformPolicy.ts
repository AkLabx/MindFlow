import { isNativeApp } from '@/utils/platform';

export class PlatformPolicy {
  /**
   * Defines where an unauthenticated user should land.
   * Native strictly goes to /login. Web goes to / (Landing Page).
   */
  static getGuestEntryRoute(): string {
    return isNativeApp() ? '/login' : '/';
  }

  /**
   * Defines where a user should go after explicit logout.
   */
  static getLogoutRoute(): string {
    return isNativeApp() ? '/login' : '/';
  }
}
