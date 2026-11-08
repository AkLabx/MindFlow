import React from 'react';
import { AppRole } from '@/config/permissions';
import { ShieldAlert, ShieldCheck, Shield, Sparkles, GraduationCap, User } from 'lucide-react';

interface UserRoleBadgeProps {
  role: AppRole | string;
  size?: 'sm' | 'md';
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClass = isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (role) {
    case 'super_admin':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider ${sizeClass}`}
        >
          <ShieldAlert className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Super Admin
        </span>
      );
    case 'admin':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider ${sizeClass}`}
        >
          <ShieldCheck className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Admin
        </span>
      );
    case 'moderator':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 uppercase tracking-wider ${sizeClass}`}
        >
          <Shield className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Moderator
        </span>
      );
    case 'content_creator':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider ${sizeClass}`}
        >
          <Sparkles className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Content Creator
        </span>
      );
    case 'teacher':
      return (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider ${sizeClass}`}
        >
          <GraduationCap className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Teacher
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider ${sizeClass}`}
        >
          <User className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Learner
        </span>
      );
  }
};
