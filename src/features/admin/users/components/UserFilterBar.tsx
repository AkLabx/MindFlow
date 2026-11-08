import React from 'react';
import { Search, Filter, RefreshCw, Download, Users } from 'lucide-react';

interface UserFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  sortBy: 'created_at' | 'xp' | 'study_streak';
  onSortByChange: (value: 'created_at' | 'xp' | 'study_streak') => void;
  onRefresh: () => void;
  isLoading: boolean;
  totalFiltered: number;
  onExportCsv: () => void;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  sortBy,
  onSortByChange,
  onRefresh,
  isLoading,
  totalFiltered,
  onExportCsv
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, @username, email, or User ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Selectors & Actions */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admins</option>
          <option value="admin">Admins</option>
          <option value="moderator">Moderators</option>
          <option value="content_creator">Content Creators</option>
          <option value="teacher">Teachers</option>
          <option value="user">Learners Only</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="created_at">Joined Date</option>
          <option value="xp">Highest XP</option>
          <option value="study_streak">Longest Streak</option>
        </select>

        {/* Export CSV */}
        <button
          onClick={onExportCsv}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Export CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          title="Refresh user list"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>

        {/* Counter Badge */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{totalFiltered}</span>
        </div>
      </div>
    </div>
  );
};
