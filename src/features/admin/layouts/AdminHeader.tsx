import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuth } from '@/features/auth';
import { PresenceAvatar } from '@/components/ui/PresenceAvatar';

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  isMobileMenuOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
  isMobileMenuOpen = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const { user, profile, roles, isAdmin } = useAuth();

  // Route-to-Breadcrumbs mapping
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    const tab = new URLSearchParams(location.search).get('tab');

    if (path.includes('/admin/users')) return { group: 'Access & IAM', title: 'User Directory' };
    if (path.includes('/admin/questions')) return { group: 'Academic Content', title: 'Question Bank' };
    if (path.includes('/admin/vocab')) return { group: 'Academic Content', title: 'Vocabulary Matrix' };
    if (path.includes('/admin/materials') || path.includes('/admin/upload')) return { group: 'Academic Content', title: 'Study Materials' };
    if (path.includes('/admin/content')) return { group: 'Academic Content', title: 'AI Ingestion Plane' };
    if (path.includes('/admin/test-series/tests/new')) return { group: 'Mock Tests CMS', title: 'Create Mock Test' };
    if (path.includes('/admin/test-series/tests/')) return { group: 'Mock Tests CMS', title: 'Edit Mock Test' };
    if (path.includes('/admin/test-series')) {
      return {
        group: 'Mock Tests CMS',
        title: tab === 'tests' ? 'Mock Tests Catalog' : 'Mock Test Series'
      };
    }
    if (path.includes('/admin/analytics')) return { group: 'Control Room', title: 'Live Telemetry' };
    if (path.includes('/admin/enrichment')) return { group: 'Control Room', title: 'AI Pipeline Engine' };
    if (path.includes('/admin/app-config')) return { group: 'Control Room', title: 'Remote App Config' };
    if (path.includes('/admin/reports')) return { group: 'Governance', title: 'Moderation Queue' };
    if (path.includes('/admin/notifications')) return { group: 'Governance', title: 'Broadcast Center' };
    if (path.includes('/admin/financials')) return { group: 'Governance', title: 'Financials & Revenue' };
    return { group: 'Control Room', title: 'Operations Cockpit' };
  }, [location.pathname, location.search]);

  const isSuperAdmin = Boolean(roles?.includes('super_admin'));
  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Staff';

  return (
    <header className="sticky top-0 z-20 min-h-16 pt-[env(safe-area-inset-top)] bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 transition-colors">
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shrink-0"
          aria-label="Open Navigation Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Breadcrumb trail */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 min-w-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN.OVERVIEW)}
            className="min-h-[44px] px-1.5 -ml-1.5 inline-flex items-center rounded-lg hover:text-slate-900 dark:hover:text-slate-200 font-semibold text-slate-700 dark:text-slate-300 transition-all active:scale-95 shrink-0"
          >
            Admin
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline-block text-slate-500 dark:text-slate-400 shrink-0">
            {breadcrumb.group}
          </span>
          <ChevronRight className="hidden sm:inline-block w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* Right side: Search / Cmd+K, Status, Theme, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Quick Command Bar Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-sm"
          title="Search or execute command (Ctrl+K)"
          aria-label="Open command palette (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline font-medium">Quick switch...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </button>

        {/* Live System Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>Operational</span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-pressed={isDarkMode}
        >
          {isDarkMode ? <Sun className="w-4 h-4" aria-hidden="true" /> : <Moon className="w-4 h-4" aria-hidden="true" />}
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <PresenceAvatar
            userId={user?.id || 'admin'}
            avatarUrl={profile?.avatar_url || user?.user_metadata?.avatar_url}
            altText={profile?.full_name || profile?.username || 'Admin'}
            className="w-8 h-8 shrink-0"
          />
          <div className="hidden sm:flex flex-col min-w-0 text-left">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
              {profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Admin'}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
