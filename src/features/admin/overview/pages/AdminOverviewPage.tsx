import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Users,
  Award,
  Activity,
  ShieldAlert,
  Megaphone,
  FileText,
  Languages,
  Sparkles,
  Sliders,
  ArrowUpRight,
  RefreshCw,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

interface SystemMetric {
  label: string;
  count: number | null;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  href: string;
  helperText: string;
}

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, roles, isAdmin } = useAuth();

  const [metrics, setMetrics] = useState({
    questionsCount: null as number | null,
    usersCount: null as number | null,
    testsCount: null as number | null,
    reportsCount: null as number | null,
    dlqCount: null as number | null,
    materialsCount: null as number | null,
    synonymsCount: null as number | null,
    idiomsCount: null as number | null,
    owsCount: null as number | null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const [
        { count: qCount },
        { count: uCount },
        { count: tCount },
        { count: rCount },
        { count: dlqCount },
        { count: matCount },
        { count: synCount },
        { count: idmCount },
        { count: owsCount }
      ] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tests').select('id', { count: 'exact', head: true }),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('enrichment_dlq').select('id', { count: 'exact', head: true }),
        supabase.from('study_materials').select('id', { count: 'exact', head: true }),
        supabase.from('synonym').select('id', { count: 'exact', head: true }),
        supabase.from('idiom').select('id', { count: 'exact', head: true }),
        supabase.from('ows').select('id', { count: 'exact', head: true })
      ]);

      setMetrics({
        questionsCount: qCount ?? 0,
        usersCount: uCount ?? 0,
        testsCount: tCount ?? 0,
        reportsCount: rCount ?? 0,
        dlqCount: dlqCount ?? 0,
        materialsCount: matCount ?? 0,
        synonymsCount: synCount ?? 0,
        idiomsCount: idmCount ?? 0,
        owsCount: owsCount ?? 0
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load admin overview metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const totalVocab =
    (metrics.synonymsCount || 0) + (metrics.idiomsCount || 0) + (metrics.owsCount || 0);

  const kpiCards: SystemMetric[] = [
    {
      label: 'Questions in Bank',
      count: metrics.questionsCount,
      icon: HelpCircle,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      href: '/admin/questions',
      helperText: 'Master questions database'
    },
    {
      label: 'Registered Learners',
      count: metrics.usersCount,
      icon: Users,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/10 dark:bg-sky-500/20',
      href: '/admin/users',
      helperText: 'Active profiles & accounts'
    },
    {
      label: 'Vocabulary Matrix',
      count: totalVocab || null,
      icon: Languages,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-500/10 dark:bg-violet-500/20',
      href: '/admin/vocab',
      helperText: 'Synonyms, Idioms & OWS'
    },
    {
      label: 'Mock Tests Published',
      count: metrics.testsCount,
      icon: Award,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 dark:bg-amber-500/20',
      href: '/admin/test-series',
      helperText: 'Curated test series & mocks'
    },
    {
      label: 'Pending Moderation',
      count: metrics.reportsCount,
      icon: ShieldAlert,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 dark:bg-rose-500/20',
      href: '/admin/reports',
      helperText: 'User flags requiring review'
    },
    {
      label: 'AI DLQ Dead Letters',
      count: metrics.dlqCount,
      icon: Activity,
      color: metrics.dlqCount && metrics.dlqCount > 0 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      href: '/admin/enrichment',
      helperText: 'Failed AI jobs needing retry'
    }
  ];

  const quickActions = [
    {
      title: 'Question Bank',
      description: 'Search, filter and edit 10,500+ questions',
      icon: HelpCircle,
      href: '/admin/questions',
      color: 'border-indigo-500/20 hover:border-indigo-500'
    },
    {
      title: 'AI Ingestion Studio',
      description: 'Extract questions from uploaded documents & PDFs',
      icon: Sparkles,
      href: '/admin/content',
      color: 'border-violet-500/20 hover:border-violet-500'
    },
    {
      title: 'Mock Tests CMS',
      description: 'Publish exam categories, series, and full tests',
      icon: Award,
      href: '/admin/test-series',
      color: 'border-amber-500/20 hover:border-amber-500'
    },
    {
      title: 'Broadcast Center',
      description: 'Send instant push announcements to learners',
      icon: Megaphone,
      href: '/admin/notifications',
      color: 'border-sky-500/20 hover:border-sky-500'
    },
    {
      title: 'AI Enrichment Engine',
      description: 'Inspect queue latency, tokens, and dead letter queue',
      icon: Activity,
      href: '/admin/enrichment',
      color: 'border-emerald-500/20 hover:border-emerald-500'
    },
    {
      title: 'Remote App Config',
      description: 'Tune startup splash, intro anims, and theme branding',
      icon: Sliders,
      href: '/admin/app-config',
      color: 'border-fuchsia-500/20 hover:border-fuchsia-500'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Cockpit Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                Control Room
              </span>
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Cluster Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display">
              MindFlow Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Centralized operations dashboard for user management, academic content, AI ingestion pipelines, and platform configuration.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold backdrop-blur-sm transition-all active:scale-95 text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={() => navigate('/admin/questions')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <span>Question Bank</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status ticker */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>PostgreSQL 17: <strong className="text-white">Online</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>pgmq Queue: <strong className="text-white">Active</strong></span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              onClick={() => navigate(kpi.href)}
              className="cursor-pointer rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2.5 rounded-xl ${kpi.bgColor} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                  {isLoading && kpi.count === null ? (
                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  ) : (
                    kpi.count?.toLocaleString() ?? 0
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {kpi.helperText}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Launchers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
            Quick Operations
          </h2>
          <span className="text-xs text-slate-500">Frequently used administration tools</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -2 }}
                onClick={() => navigate(action.href)}
                className={`cursor-pointer rounded-2xl p-5 bg-white dark:bg-slate-900 border ${action.color} shadow-sm hover:shadow-md transition-all flex items-start gap-4 group`}
              >
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {action.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AdminOverviewPage;
