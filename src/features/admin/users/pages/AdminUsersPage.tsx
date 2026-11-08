import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Flame,
  Zap,
  RefreshCw,
  MoreVertical,
  Flag,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { PresenceAvatar } from '@/components/ui/PresenceAvatar';
import { UserRoleBadge } from '../components/UserRoleBadge';
import { UserFilterBar } from '../components/UserFilterBar';
import { UserDetailsDrawer } from '../components/UserDetailsDrawer';
import { fetchUsersList, UserSummary } from '../services/adminUsersService';
import { useNotificationStore } from '@/stores/useNotificationStore';

export const AdminUsersPage: React.FC = () => {
  const showToast = useNotificationStore((state) => state.showToast);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'xp' | 'study_streak'>('created_at');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsersList({
        search,
        roleFilter,
        sortBy,
        sortOrder: 'desc'
      });
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      showToast({ title: 'Error', message: 'Could not fetch user directory.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, sortBy]);

  // Debounced search on enter or when search is cleared
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((u) => (u.roles || []).includes('super_admin')).length;
    const staff = users.filter((u) => (u.roles || []).length > 0).length;
    const flagged = users.filter((u) => u.shadow_flagged).length;
    return { total, superAdmins, staff, flagged };
  }, [users]);

  const handleInspectUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDrawerOpen(true);
  };

  const handleExportCsv = () => {
    if (users.length === 0) return;

    const headers = ['User ID', 'Full Name', 'Username', 'Email', 'Roles', 'XP', 'Streak', 'Status', 'Registered Date'];
    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${u.full_name || ''}"`,
      `"${u.username || ''}"`,
      `"${u.email || ''}"`,
      `"${u.roles.join(', ') || 'user'}"`,
      u.xp,
      u.study_streak,
      `"${u.status || 'active'}"`,
      `"${u.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mindflow_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({ title: 'CSV Exported', message: `Exported ${users.length} learner records.`, variant: 'success' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-display">
            User Directory & Access Control (IAM)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorize staff roles, audit learner progress, and manage active device sessions.
          </p>
        </div>

        {/* Quick KPI Stat Pills */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-semibold text-purple-700 dark:text-purple-300">
            {stats.superAdmins} Super Admins
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            {stats.staff} Staff Accounts
          </div>
          {stats.flagged > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
              {stats.flagged} Flagged
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <UserFilterBar
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onRefresh={loadUsers}
        isLoading={isLoading}
        totalFiltered={users.length}
        onExportCsv={handleExportCsv}
      />

      {/* High Density Users Master Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th className="py-3.5 px-4">Learner Profile</th>
                <th className="py-3.5 px-4">Access Roles</th>
                <th className="py-3.5 px-4">Learning Momentum</th>
                <th className="py-3.5 px-4">Trust / Risk</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      Loading learner directory...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    No users matching criteria. Try adjusting your search query or role filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleInspectUser(user.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* User Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          <PresenceAvatar
                            avatarUrl={user.avatar_url}
                            altText={user.full_name || 'User'}
                            className="w-9 h-9"
                            userId={user.id}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {user.full_name || user.username || 'Anonymous Learner'}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {user.email || user.username || user.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.roles.length === 0 ? (
                          <UserRoleBadge role="user" />
                        ) : (
                          user.roles.map((r) => <UserRoleBadge key={r} role={r} />)
                        )}
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          ⚡ {user.xp.toLocaleString()} XP
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-orange-600 dark:text-orange-400 font-medium">
                          🔥 {user.study_streak}d
                        </span>
                      </div>
                    </td>

                    {/* Trust / Risk */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {user.shadow_flagged ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold text-[10px] uppercase">
                            Flagged
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {user.trust_score}% Trust
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectUser(user.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xs font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flyout User Details & RBAC Management Drawer */}
      <UserDetailsDrawer
        userId={selectedUserId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedUserId(null);
        }}
        onUserUpdated={loadUsers}
      />
    </div>
  );
};
export default AdminUsersPage;
