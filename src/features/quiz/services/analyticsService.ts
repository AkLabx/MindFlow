
import { supabase } from '../../../lib/supabase';

export type AnalyticsEvent = 'app_installed' | 'quiz_started' | 'quiz_completed' | 'quiz_abandoned';

export interface AnalyticsSummary {
  totalInstalls: number;
  totalQuizzesStarted: number;
  totalQuizzesCompleted: number;
  averageScore: number;
  recentActivity: { event: string; date: string; data?: any }[];
}

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

export const fetchAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  try {
    // 1. Fetch last 2000 events (enough for client-side aggregation for a portfolio app)
    // In a real app at scale, this logic should move to a Supabase Edge Function (RPC)
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);

    if (error) throw error;

    // 2. Client-side Aggregation
    const installs = data.filter(e => e.event_name === 'app_installed').length;
    const started = data.filter(e => e.event_name === 'quiz_started').length;
    const completed = data.filter(e => e.event_name === 'quiz_completed');
    
    const totalScorePercent = completed.reduce((sum, e) => {
      const pct = e.event_data?.percentage || 0;
      return sum + pct;
    }, 0);

    const avgScore = completed.length > 0 ? Math.round(totalScorePercent / completed.length) : 0;

    return {
      totalInstalls: installs,
      totalQuizzesStarted: started,
      totalQuizzesCompleted: completed.length,
      averageScore: avgScore,
      recentActivity: data.slice(0, 10).map(e => ({
        event: e.event_name,
        date: new Date(e.created_at).toLocaleString(),
        data: e.event_data
      }))
    };

  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return {
      totalInstalls: 0,
      totalQuizzesStarted: 0,
      totalQuizzesCompleted: 0,
      averageScore: 0,
      recentActivity: []
    };
  }
};