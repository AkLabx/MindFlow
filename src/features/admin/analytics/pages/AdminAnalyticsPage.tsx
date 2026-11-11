import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Smartphone,
  Globe,
  RefreshCw,
  Search,
  Users,
  Eye,
  Sliders,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Key,
  ShieldAlert
} from 'lucide-react';
import {
  adminAnalyticsService,
  TelemetryEventRecord,
  TelemetrySummaryKPIs,
  ActiveUserSessionRecord
} from '../services/adminAnalyticsService';
import { TelemetryDetailModal } from '../components/TelemetryDetailModal';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminAnalyticsPage: React.FC = () => {
  const showToast = useNotificationStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'events' | 'sessions'>('events');
  const [events, setEvents] = useState<TelemetryEventRecord[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveUserSessionRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [kpis, setKpis] = useState<TelemetrySummaryKPIs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEventRecord | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'android' | 'web'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10s default
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [eventsResult, summaryKpis, sessionsResult] = await Promise.all([
        adminAnalyticsService.fetchEvents({
          eventName: selectedCategory,
          platform: selectedPlatform,
          searchQuery,
          limit: 100,
        }),
        adminAnalyticsService.fetchSummaryKPIs(),
        adminAnalyticsService.fetchActiveSessions(),
      ]);

      setEvents(eventsResult.events);
      setTotalCount(eventsResult.totalCount);
      setKpis(summaryKpis);
      setActiveSessions(sessionsResult);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('[AdminAnalytics] Load error:', err);
      if (!isSilent) {
        showToast({ title: 'Error', message: 'Failed to load telemetry events.', variant: 'error' });
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedCategory, selectedPlatform, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadData(true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadData]);

  // Click handler: Total Events (Reset all filters)
  const handleTotalEventsClick = () => {
    setActiveTab('events');
    setSelectedCategory('all');
    setSelectedPlatform('all');
    setSearchQuery('');
  };

  // Click handler: Toggle Platform (All -> Web -> Android)
  const handlePlatformKpiClick = () => {
    setActiveTab('events');
    if (selectedPlatform === 'all') {
      setSelectedPlatform('web');
    } else if (selectedPlatform === 'web') {
      setSelectedPlatform('android');
    } else {
      setSelectedPlatform('all');
    }
  };

  // Click handler: Active User Sessions
  const handleActiveSessionsClick = () => {
    setActiveTab('sessions');
  };

  // Click handler: Session Recoveries
  const handleRecoveryClick = () => {
    setActiveTab('events');
    setSelectedCategory('session_recovery');
  };

  const getEventBadgeStyle = (name: string) => {
    if (name.includes('app_opened')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (name.includes('page_viewed')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    if (name.includes('auth')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (name.includes('quiz')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (name.includes('recovery')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Live Telemetry & Diagnostics
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ● Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time diagnostic events and client hardware telemetry from Web and native Android APK.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="px-2 text-[11px] text-slate-400 font-normal">Poll:</span>
            {[5, 10, 30].map((sec) => (
              <button
                key={sec}
                onClick={() => setAutoRefreshInterval(sec)}
                className={`px-2 py-1 rounded-lg transition-all ${autoRefreshInterval === sec ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'}`}
              >
                {sec}s
              </button>
            ))}
            <button
              onClick={() => setAutoRefreshInterval(0)}
              className={`px-2 py-1 rounded-lg transition-all ${autoRefreshInterval === 0 ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'hover:text-slate-900 dark:hover:text-slate-100'}`}
            >
              Off
            </button>
          </div>

          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Interactive KPI Cards (Click to Filter or View) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Captured Events */}
        <button
          onClick={handleTotalEventsClick}
          className={`text-left border rounded-2xl p-5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer ${activeTab === 'events' && selectedCategory === 'all' && selectedPlatform === 'all' ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500/50 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Captured Events</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">View All ↗</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {kpis?.totalEvents ?? '—'}
          </div>
          <span className="text-xs text-indigo-500 mt-1 font-medium block">
            public.analytics_events
          </span>
        </button>

        {/* 2. Platform Traffic */}
        <button
          onClick={handlePlatformKpiClick}
          className={`text-left border rounded-2xl p-5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer ${selectedPlatform !== 'all' ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/50 ring-2 ring-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Android vs Web</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Filter: {selectedPlatform.toUpperCase()} ↗
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {kpis?.androidEvents ?? 0} <span className="text-sm font-normal text-slate-400">/ {kpis?.webEvents ?? 0}</span>
          </div>
          <span className="text-xs text-emerald-500 mt-1 font-medium block">
            Click to toggle Web / Android
          </span>
        </button>

        {/* 3. Active User Sessions */}
        <button
          onClick={handleActiveSessionsClick}
          className={`text-left border rounded-2xl p-5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer ${activeTab === 'sessions' ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500/50 ring-2 ring-cyan-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active User Sessions</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">View Sessions ↗</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {kpis?.activeSessions ?? '—'}
          </div>
          <span className="text-xs text-cyan-500 mt-1 font-medium block">
            Click to view connected users
          </span>
        </button>

        {/* 4. Session Recoveries */}
        <button
          onClick={handleRecoveryClick}
          className={`text-left border rounded-2xl p-5 shadow-xs transition-all hover:scale-[1.01] cursor-pointer ${selectedCategory === 'session_recovery' ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-500/50 ring-2 ring-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Session Recoveries</span>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Filter Recoveries ↗</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {kpis?.recoveryCount ?? '—'}
          </div>
          <span className="text-xs text-amber-500 mt-1 font-medium block">
            Auto-healing auth recoveries
          </span>
        </button>
      </div>

      {/* Main Tab Toggle Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
          >
            <Activity className="w-3.5 h-3.5" />
            Live Telemetry Stream ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'sessions' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'}`}
          >
            <Users className="w-3.5 h-3.5" />
            Connected User Sessions ({activeSessions.length})
          </button>
        </div>

        {activeTab === 'events' && (
          <span className="text-xs text-slate-400">
            Showing {events.length} of {totalCount} events
          </span>
        )}
      </div>

      {/* TAB 1: Live Telemetry Stream */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="all">All Events ({totalCount})</option>
                <option value="app_opened">app_opened</option>
                <option value="page_viewed">page_viewed</option>
                <option value="auth_signup_attempted">auth_signup_attempted</option>
                <option value="auth_login_succeeded">auth_login_succeeded</option>
                <option value="quiz_session_started">quiz_session_started</option>
                <option value="session_recovery">session_recovery</option>
              </select>

              {/* Platform Filter */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
                <button
                  onClick={() => setSelectedPlatform('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${selectedPlatform === 'all' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  All Platforms
                </button>
                <button
                  onClick={() => setSelectedPlatform('android')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${selectedPlatform === 'android' ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Android
                </button>
                <button
                  onClick={() => setSelectedPlatform('web')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${selectedPlatform === 'web' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                >
                  <Globe className="w-3.5 h-3.5" /> Web
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paths, reasons, payloads..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* High-Density Desktop Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Event Name</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Context / Path</th>
                    <th className="px-4 py-3">Display & Network</th>
                    <th className="px-4 py-3">Timestamp (IST)</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                        No telemetry events matched the active filters.
                      </td>
                    </tr>
                  ) : (
                    events.map((evt) => {
                      const isAndroid = evt.event_data?.platform === 'android';
                      const eventDate = new Date(evt.created_at);
                      const istString = eventDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

                      return (
                        <tr
                          key={evt.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => setSelectedEvent(evt)}
                        >
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold border ${getEventBadgeStyle(evt.event_name)}`}>
                              {evt.event_name}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isAndroid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'}`}>
                              {isAndroid ? <Smartphone className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                              {evt.event_data?.platform || 'web'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs truncate">
                            <span className="font-mono text-slate-900 dark:text-slate-100">
                              {evt.event_data?.path || evt.event_data?.reason || evt.event_data?.examId || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                            {evt.event_data?.screen_resolution ? `${evt.event_data.screen_resolution} (${evt.event_data?.network_type || 'net'})` : '—'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            {istString}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(evt);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                            >
                              Inspect JSON
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Connected User Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-500" />
                  Live Connected User Sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time active sessions stored in <code className="font-mono text-[11px] bg-slate-200/50 dark:bg-slate-800 px-1 py-0.5 rounded">public.user_active_sessions</code>
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-2.5 py-1 rounded-lg">
                {activeSessions.length} Active Devices
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Learner / Account</th>
                    <th className="px-4 py-3">Target Exam</th>
                    <th className="px-4 py-3">Session Token (UUID)</th>
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Last Active (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                        No active user sessions recorded.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((session) => {
                      const sessionDate = new Date(session.updated_at);
                      const istDate = sessionDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

                      return (
                        <tr key={session.session_token} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {session.full_name || session.username || 'Learner'}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {session.email || 'No email profile'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {session.target_exam ? (
                              <span className="px-2 py-0.5 rounded font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {session.target_exam.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                            {session.session_token}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                            {session.user_id}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            {istDate}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <TelemetryDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};

export default AdminAnalyticsPage;
