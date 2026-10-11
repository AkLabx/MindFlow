import { Capacitor } from '@capacitor/core';
import { isNativeApp } from '../../utils/platform';

export class NavigationPolicy {
  /**
   * Returns the default unauthenticated entry route based on platform.
   * WEB -> '/' (Landing Page)
   * NATIVE (Android/iOS) -> '/login'
   */
  static getDefaultGuestRoute(): string {
    return isNativeApp() || Capacitor.isNativePlatform() ? '/login' : '/';
  }

  /**
   * Returns the default route after a user explicitly logs out.
   * WEB -> '/'
   * NATIVE -> '/login'
   */
  static getLogoutRedirectRoute(): string {
    return isNativeApp() || Capacitor.isNativePlatform() ? '/login' : '/';
  }

  /**
   * Returns the default authenticated landing route.
   */
  static getDefaultAuthRoute(): string {
    return '/dashboard';
  }
}
