import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  CreditCard,
  BarChart3,
  CheckSquare,
  PlusCircle,
  GraduationCap,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
}

export interface AdminNavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  highlight?: boolean;
}

export interface AdminNavGroup {
  groupTitle: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupTitle: 'Control Room',
    items: [
      { label: 'Overview', to: ROUTES.ADMIN.OVERVIEW, icon: LayoutDashboard },
      { label: 'Live Telemetry', to: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
      { label: 'AI Pipeline Engine', to: ROUTES.ADMIN.ENRICHMENT, icon: Activity },
      { label: 'Remote App Config', to: ROUTES.ADMIN.APP_CONFIG, icon: Sliders }
    ]
  },
  {
    groupTitle: 'Access & IAM',
    items: [
      { label: 'User Directory', to: ROUTES.ADMIN.USERS, icon: Users }
    ]
  },
  {
    groupTitle: 'Academic Content',
    items: [
      { label: 'Question Bank', to: ROUTES.ADMIN.QUESTIONS, icon: HelpCircle },
      { label: 'Vocabulary Matrix', to: ROUTES.ADMIN.VOCAB, icon: Languages },
      { label: 'AI Ingestion Plane', to: ROUTES.ADMIN.CONTENT, icon: Sparkles },
      { label: 'Study Materials', to: ROUTES.ADMIN.MATERIALS, icon: FileText }
    ]
  },
  {
    groupTitle: 'Mock Tests CMS',
    items: [
      { label: 'Test Series & Categories', to: ROUTES.ADMIN.TEST_SERIES, icon: Award },
      { label: 'Mock Tests Catalog', to: `${ROUTES.ADMIN.TEST_SERIES}?tab=tests`, icon: CheckSquare },
      { label: 'Create Mock Test', to: ROUTES.ADMIN.TEST_NEW, icon: PlusCircle },
      { label: 'BPSC Student Preview', to: ROUTES.TEST_SERIES.BPSC, icon: GraduationCap }
    ]
  },
  {
    groupTitle: 'Governance & Billing',
    items: [
      { label: 'Moderation Queue', to: ROUTES.ADMIN.REPORTS, icon: ShieldAlert },
      { label: 'Broadcast Center', to: ROUTES.ADMIN.NOTIFICATIONS, icon: Megaphone },
      { label: 'Financials & Revenue', to: ROUTES.ADMIN.FINANCIALS, icon: CreditCard }
    ]
  }
];

function isNavItemActive(itemTo: string, pathname: string, search: string): boolean {
  const tabParam = new URLSearchParams(search).get('tab');

  if (itemTo === ROUTES.ADMIN.OVERVIEW) {
    return pathname === ROUTES.ADMIN.ROOT || pathname === ROUTES.ADMIN.OVERVIEW;
  }
  if (itemTo === ROUTES.ADMIN.TEST_SERIES) {
    return pathname === ROUTES.ADMIN.TEST_SERIES && tabParam !== 'tests';
  }
  if (itemTo === `${ROUTES.ADMIN.TEST_SERIES}?tab=tests`) {
    return pathname === ROUTES.ADMIN.TEST_SERIES && tabParam === 'tests';
  }
  if (itemTo === ROUTES.ADMIN.TEST_NEW) {
    return (
      pathname === ROUTES.ADMIN.TEST_NEW ||
      /^\/admin\/test-series\/tests\/[^/]+\/edit/.test(pathname)
    );
  }
  if (itemTo === ROUTES.TEST_SERIES.BPSC) {
    return pathname === ROUTES.TEST_SERIES.BPSC;
  }

  return pathname === itemTo || pathname.startsWith(`${itemTo}/`);
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
  const isMobileDrawer = Boolean(onCloseMobile);

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-30 select-none shadow-sm',
        isMobileDrawer ? 'w-full' : isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="min-h-16 flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            navigate(ROUTES.ADMIN.OVERVIEW);
          }}
          className="min-h-[44px] flex items-center gap-3 px-1.5 rounded-xl overflow-hidden text-left transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-w-0"
        >
          <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Shield className="w-5 h-5" aria-hidden="true" />
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
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider shrink-0">
                  Admin
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Command Center OS
              </span>
            </motion.div>
          )}
        </button>

        {/* Close button inside mobile drawer */}
        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        ) : (
          /* Collapse toggle button for desktop */
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex min-w-[44px] min-h-[44px] items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav
        aria-label="Admin sections"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
      >
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            {!isCollapsed ? (
              <p className="px-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {group.groupTitle}
              </p>
            ) : (
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-3 mx-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.to, location.pathname, location.search);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={handleLinkClick}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    isCollapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/60 dark:border-indigo-800/60 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    aria-hidden="true"
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
      </nav>

      {/* Footer Area: User Card & Return to App */}
      <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
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
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0" title="Online & Connected" />
          </div>
        )}

        {/* Exit to Student App */}
        <button
          type="button"
          onClick={() => {
            onCloseMobile?.();
            navigate(ROUTES.DASHBOARD);
          }}
          className={cn(
            'w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-all active:scale-95',
            isCollapsed && 'justify-center px-0'
          )}
          title="Exit Admin to Student App"
          aria-label="Return to MindFlow"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Return to MindFlow</span>}
        </button>
      </div>
    </aside>
  );
};
