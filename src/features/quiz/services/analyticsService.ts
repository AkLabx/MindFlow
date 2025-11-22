
import { supabase } from '../../../lib/supabase';

export type AnalyticsEvent = 'app_installed' | 'quiz_started' | 'quiz_completed' | 'quiz_abandoned';

export const logEvent = async (eventName: AnalyticsEvent, data?: Record<string, any>) => {
  try {
    // Fire and forget - we don't want analytics to block the UI
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_data: data
    });
  } catch (error) {
    // Fail silently in production so we don't annoy the user
    console.warn('Failed to log analytics event:', error);
  }
};
