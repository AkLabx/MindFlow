import { supabase } from '@/lib/supabase';

export interface TelemetryEventRecord {
  id: string;
  created_at: string;
  event_name: string;
  event_data: Record<string, any>;
}

export interface ActiveUserSessionRecord {
  user_id: string;
  session_token: string;
  updated_at: string;
  email?: string;
  full_name?: string;
  username?: string;
  target_exam?: string;
}

export interface TelemetrySummaryKPIs {
  totalEvents: number;
  androidEvents: number;
  webEvents: number;
  activeSessions: number;
  recoveryCount: number;
  uniqueUsersToday: number;
}

export interface TelemetryFilterOptions {
  eventName?: string;
  platform?: 'all' | 'android' | 'web';
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const adminAnalyticsService = {
  /**
   * Fetches paginated & filtered telemetry events from public.analytics_events
   */
  async fetchEvents(options: TelemetryFilterOptions = {}): Promise<{ events: TelemetryEventRecord[]; totalCount: number }> {
    const { eventName, platform = 'all', searchQuery, limit = 50, offset = 0 } = options;

    let query = supabase
      .from('analytics_events')
      .select('id, created_at, event_name, event_data', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventName && eventName !== 'all') {
      query = query.eq('event_name', eventName);
    }

    if (platform !== 'all') {
      query = query.filter('event_data->>platform', 'eq', platform);
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const term = searchQuery.trim();
      // Search in event_name or jsonb text representation
      query = query.or(`event_name.ilike.%${term}%,event_data->>path.ilike.%${term}%,event_data->>reason.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error('[AdminAnalytics] Failed to fetch telemetry events:', error);
      throw error;
    }

    return {
      events: (data as TelemetryEventRecord[]) || [],
      totalCount: count || 0,
    };
  },

  /**
   * Computes centralized high-level KPIs across telemetry and sessions without redundant queries
   */
  async fetchSummaryKPIs(): Promise<TelemetrySummaryKPIs> {
    const [
      { count: totalEvents },
      { count: androidEvents },
      { count: webEvents },
      { count: activeSessions },
      { count: recoveryCount }
    ] = await Promise.all([
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).filter('event_data->>platform', 'eq', 'android'),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).filter('event_data->>platform', 'eq', 'web'),
      supabase.from('user_active_sessions').select('session_token', { count: 'exact', head: true }),
      supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('event_name', 'session_recovery')
    ]);

    return {
      totalEvents: totalEvents || 0,
      androidEvents: androidEvents || 0,
      webEvents: webEvents || 0,
      activeSessions: activeSessions || 0,
      recoveryCount: recoveryCount || 0,
      uniqueUsersToday: activeSessions || 0,
    };
  },

  /**
   * Fetches active user sessions joined with profile metadata
   */
  async fetchActiveSessions(): Promise<ActiveUserSessionRecord[]> {
    const { data, error } = await supabase
      .from('user_active_sessions')
      .select(`
        user_id,
        session_token,
        updated_at
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[AdminAnalytics] Failed to fetch active sessions:', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    // Fetch matching profiles to merge user identity
    const userIds = data.map((s) => s.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, target_exam')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return data.map((session) => {
      const prof = profileMap.get(session.user_id);
      return {
        user_id: session.user_id,
        session_token: session.session_token,
        updated_at: session.updated_at,
        email: prof?.email,
        full_name: prof?.full_name,
        username: prof?.username,
        target_exam: prof?.target_exam,
      };
    });
  }
};
