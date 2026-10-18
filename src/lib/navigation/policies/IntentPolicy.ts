import { isNativeApp } from '@/utils/platform';

export interface SavedIntent {
  pathname: string;
  search: string;
  hash: string;
  timestamp: number;
  expiresAt: number;
  platform: string;
}

const INTENT_STORAGE_KEY = 'mindflow_redirect_intent';
const INTENT_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class IntentPolicy {
  static saveIntent(location: Location | { pathname: string, search: string, hash: string }): void {
    // Only save intent if it's not the root or login
    if (location.pathname === '/' || location.pathname === '/login') return;

    const intent: SavedIntent = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: Date.now(),
      expiresAt: Date.now() + INTENT_EXPIRY_MS,
      platform: isNativeApp() ? 'native' : 'web'
    };
    sessionStorage.setItem(INTENT_STORAGE_KEY, JSON.stringify(intent));
  }

  static peekIntent(): string | null {
    const savedStr = sessionStorage.getItem(INTENT_STORAGE_KEY);
    if (!savedStr) return null;

    try {
      const intent: SavedIntent = JSON.parse(savedStr);
      if (Date.now() > intent.expiresAt) {
        sessionStorage.removeItem(INTENT_STORAGE_KEY);
        return null;
      }
      return `${intent.pathname}${intent.search}${intent.hash}`;
    } catch (e) {
      sessionStorage.removeItem(INTENT_STORAGE_KEY);
      return null;
    }
  }

  static popIntent(): string | null {
    const intent = this.peekIntent();
    this.clearIntent();
    return intent;
  }

  static clearIntent(): void {
    sessionStorage.removeItem(INTENT_STORAGE_KEY);
  }
}
