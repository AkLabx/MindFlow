import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  Languages,
  Sparkles,
  FileText,
  Award,
  Activity,
  Sliders,
  ShieldAlert,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Shield,
  Layers,
  Database,
  CreditCard,
  BarChart3
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { BrandLogo } from '@/components/brand';
import { useAuth } from '@/features/auth';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roles, isAdmin } = useAuth();

  const isSuperAdmin = Boolean(roles?.includes('super_admin'));
  const primaryRole = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Staff';

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'Control Room',
      items: [
        { label: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
        { label: 'Live Telemetry', to: '/admin/analytics', icon: BarChart3 },
        { label: 'AI Pipeline Engine', to: '/admin/enrichment', icon: Activity },
        { label: 'Remote App Config', to: '/admin/app-config', icon: Sliders }
      ]
    },
    {
      groupTitle: 'Access & IAM',
      items: [
        { label: 'User Directory', to: '/admin/users', icon: Users }
      ]
    },
    {
      groupTitle: 'Academic Content',
      items: [
        { label: 'Question Bank', to: '/admin/questions', icon: HelpCircle },
        { label: 'Vocabulary Matrix', to: '/admin/vocab', icon: Languages },
        { label: 'AI Ingestion Plane', to: '/admin/content', icon: Sparkles },
        { label: 'Study Materials', to: '/admin/materials', icon: FileText }
      ]
    },
    {
      groupTitle: 'Mock Tests CMS',
      items: [
        { label: 'Test Series & Exams', to: '/admin/test-series', icon: Award }
      ]
    },
    {
      groupTitle: 'Governance & Billing',
      items: [
        { label: 'Moderation Queue', to: '/admin/reports', icon: ShieldAlert },
        { label: 'Broadcast Center', to: '/admin/notifications', icon: Megaphone },
        { label: 'Financials & Revenue', to: '/admin/financials', icon: CreditCard }
      ]
    }
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 select-none shadow-sm',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div
          onClick={() => navigate('/admin/overview')}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              className="flex flex-col min-w-0"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 font-display truncate">
                  MindFlow
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Command Center OS
              </span>
            </motion.div>
          )}
        </div>

        {/* Collapse toggle button for desktop */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isCollapsed ? (
              <h4 className="px-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                {group.groupTitle}
              </h4>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-3 mx-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/admin/overview'
                  ? location.pathname === '/admin' || location.pathname === '/admin/overview'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/60 dark:border-indigo-800/60 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'shrink-0 w-5 h-5 transition-transform group-hover:scale-105',
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                    )}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                      {item.badge}
                    </span>
                  )}

                  {/* Active Indicator Bar on collapsed view */}
                  {isCollapsed && isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r-full" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Area: User Card & Return to App */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        {!isCollapsed && (
          <div className="px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {user?.email || 'Admin User'}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider">
                {primaryRole}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Online & Connected" />
          </div>
        )}

        {/* Exit to Student App */}
        <button
          onClick={() => navigate('/dashboard')}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors',
            isCollapsed && 'justify-center px-0'
          )}
          title="Exit Admin to Student App"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Return to MindFlow</span>}
        </button>
      </div>
    </aside>
  );
};
