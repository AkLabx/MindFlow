import { telemetry } from '@/lib/telemetry/telemetryService';

let pageViewDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastLoggedPath = '';

export const NavigationAnalytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Tracked: ${eventName}`, properties || {});
    }

    if (eventName === 'Page View' || eventName === 'page_viewed') {
      const currentPath = `${properties?.path || window.location.pathname}${properties?.hash || window.location.hash}`;

      // Prevent duplicate logging of identical consecutive routes
      if (currentPath === lastLoggedPath) {
        return;
      }

      // Clear any pending transition
      if (pageViewDebounceTimer) {
        clearTimeout(pageViewDebounceTimer);
      }

      // 1.5s Debounce: User must settle on the screen rather than fast click-throughs
      pageViewDebounceTimer = setTimeout(() => {
        lastLoggedPath = currentPath;
        telemetry.emit('page_viewed', {
          path: properties?.path || window.location.pathname,
          search: properties?.search || window.location.search,
          hash: properties?.hash || window.location.hash,
        });
      }, 1500);
    }
  }
};


