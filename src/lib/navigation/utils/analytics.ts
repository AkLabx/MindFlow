export const NavigationAnalytics = {
  track: (eventName: string, properties?: Record<string, any>) => {
    // In the future, this will connect to PostHog, Amplitude, etc.
    if (import.meta.env.DEV) {
      console.log(`[Analytics] Tracked: ${eventName}`, properties || {});
    }
    // Minimal stub for the architectural requirement
  }
};
