import React, { useId, useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Smartphone,
  AlertTriangle,
  Flame,
  Zap,
  Bookmark,
  Award,
  Calendar,
  Mail,
  User,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Flag,
  Activity
} from 'lucide-react';
import { PresenceAvatar } from '@/components/ui/PresenceAvatar';
import { UserRoleBadge } from './UserRoleBadge';
import {
  UserDetailData,
  fetchUserDetails,
  assignUserRole,
  revokeUserRole,
  updateUserModerationStatus,
  terminateAllUserSessions
} from '../services/adminUsersService';
import { AppRole, PERMISSIONS } from '@/config/permissions';
import { useAuth } from '@/features/auth';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { NativeDialog } from '@/components/ui/NativeDialog';

interface UserDetailsDrawerProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  userId,
  isOpen,
  onClose,
  onUserUpdated
}) => {
  const titleId = useId();
  const { user: currentAdmin, roles: currentAdminRoles } = useAuth();
  const showToast = useNotificationStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'stats' | 'roles' | 'sessions' | 'moderation'>('stats');
  const [details, setDetails] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState<AppRole>('moderator');

  const isSuperAdmin = Boolean(currentAdminRoles?.includes('super_admin'));

  const loadDetails = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fetchUserDetails(userId);
      setDetails(data);
    } catch (err: any) {
      console.error('Failed to load user details:', err);
      showToast({ title: 'Error', message: 'Could not load user profile details.', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadDetails();
      setActiveTab('stats');
    }
  }, [isOpen, userId]);

  const handleCopyId = () => {
    if (!details?.id) return;
    navigator.clipboard.writeText(details.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAssignRole = async () => {
    if (!details || !userId) return;
    setIsMutating(true);
    try {
      await assignUserRole(userId, selectedNewRole, currentAdmin?.id);
      showToast({ title: 'Role Assigned', message: `Granted ${selectedNewRole} to ${details.username || details.full_name || 'user'}.`, variant: 'success' });
      await loadDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      showToast({ title: 'Action Failed', message: err.message || 'Could not assign role.', variant: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleRevokeRole = async (role: AppRole) => {
    if (!details || !userId) return;
    if (!confirm(`Are you sure you want to revoke role '${role}' from this user?`)) return;

    setIsMutating(true);
    try {
      await revokeUserRole(userId, role);
      showToast({ title: 'Role Revoked', message: `Revoked ${role} role.`, variant: 'success' });
      await loadDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      showToast({ title: 'Action Failed', message: err.message || 'Could not revoke role.', variant: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleTerminateSessions = async () => {
    if (!userId) return;
    if (!confirm('Force sign-out this user from all active devices?')) return;

    setIsMutating(true);
    try {
      await terminateAllUserSessions(userId);
      showToast({ title: 'Sessions Terminated', message: 'All active device sessions have been revoked.', variant: 'success' });
      await loadDetails();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to revoke sessions.', variant: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleShadowFlag = async () => {
    if (!details || !userId) return;
    const newStatus = !details.shadow_flagged;
    setIsMutating(true);
    try {
      await updateUserModerationStatus(userId, { shadow_flagged: newStatus });
      showToast({
        title: newStatus ? 'Account Shadow-Flagged' : 'Shadow Flag Removed',
        message: newStatus ? 'User is silently restricted.' : 'Restrictions removed.',
        variant: 'success'
      });
      await loadDetails();
      if (onUserUpdated) onUserUpdated();
    } catch (err: any) {
      showToast({ title: 'Error', message: err.message || 'Failed to update flag.', variant: 'error' });
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      variant="drawer-right"
      ariaLabelledBy={titleId}
      className="max-w-xl"
      panelClassName="relative w-full h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
    >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/20 shadow-md shrink-0">
                  <PresenceAvatar
                    avatarUrl={details?.avatar_url}
                    altText={details?.full_name || 'User'}
                    className="w-14 h-14"
                    userId={details?.id || ''}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                      {details?.full_name || details?.username || 'Learner Profile'}
                    </h2>
                    {details?.shadow_flagged && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-[10px] font-bold uppercase">
                        Flagged
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {details?.email || details?.username || 'No email registered'}
                  </span>

                  <button
                    onClick={handleCopyId}
                    className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 w-fit"
                  >
                    <span className="truncate max-w-[200px]">{details?.id}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close user details"
                className="p-2 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 bg-white dark:bg-slate-900 shrink-0">
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'stats'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4" />
                Overview & Stats
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'roles'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                RBAC Roles ({details?.roles.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'sessions'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Sessions ({details?.activeSessions.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('moderation')}
                className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'moderation'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Flag className="w-4 h-4" />
                Trust & Risk
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-sm font-medium">Fetching profile details...</span>
                </div>
              ) : details ? (
                <>
                  {/* TAB 1: ACADEMIC STATS */}
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">XP Earned</span>
                          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                            ⚡ {details.xp.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Study Streak</span>
                          <span className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                            🔥 {details.study_streak} Days
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Quizzes Done</span>
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                            {details.stats.quizzesCompleted}
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Bookmarks</span>
                          <span className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1 block">
                            {details.stats.bookmarksCount}
                          </span>
                        </div>
                      </div>

                      {/* Bio & Academic Target */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Metadata</h4>
                        <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                          <div><strong>Target Exam:</strong> {details.target_exam || 'Not specified'}</div>
                          <div><strong>Registered:</strong> {details.created_at ? new Date(details.created_at).toLocaleString() : '—'}</div>
                          <div><strong>Bio:</strong> {details.bio || 'No bio written'}</div>
                          <div><strong>Plan Status:</strong> <span className="capitalize font-semibold text-emerald-600">{details.subscription_status}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RBAC ROLES */}
                  {activeTab === 'roles' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Roles</h4>
                        {details.roles.length === 0 ? (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500">
                            This user has no elevated roles (Standard Learner).
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {details.roles.map((r) => (
                              <div
                                key={r}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                              >
                                <UserRoleBadge role={r} size="md" />
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleRevokeRole(r)}
                                    disabled={isMutating}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Revoke Role"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Role Section (Super Admin only) */}
                      {isSuperAdmin ? (
                        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                          <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                            Assign New Privilege
                          </h4>
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedNewRole}
                              onChange={(e) => setSelectedNewRole(e.target.value as AppRole)}
                              className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                            >
                              <option value="admin">Admin</option>
                              <option value="moderator">Moderator</option>
                              <option value="content_creator">Content Creator</option>
                              <option value="teacher">Teacher</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                            <button
                              onClick={handleAssignRole}
                              disabled={isMutating}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Grant
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                          Role assignment requires Super Admin permission.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ACTIVE SESSIONS */}
                  {activeTab === 'sessions' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Device Tokens</h4>
                          <span className="text-xs text-slate-500">{details.activeSessions.length} active login sessions</span>
                        </div>
                        {details.activeSessions.length > 0 && (
                          <button
                            onClick={handleTerminateSessions}
                            disabled={isMutating}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Revoke All
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {details.activeSessions.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                            No active sessions found for this user.
                          </div>
                        ) : (
                          details.activeSessions.map((session, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                  <Smartphone className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="font-mono text-slate-600 dark:text-slate-300 block truncate max-w-[200px]">
                                    {session.session_token}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Last Active: {new Date(session.updated_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" title="Active" />
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TRUST & RISK */}
                  {activeTab === 'moderation' && (
                    <div className="space-y-6">
                      {/* Trust Score */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Trust Score</span>
                          <span className="text-sm text-slate-500">Heuristic score based on reports and activity</span>
                        </div>
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {details.trust_score} / 100
                        </div>
                      </div>

                      {/* Shadow Flag Toggle */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Shadow Flagged</span>
                          <span className="text-xs text-slate-500">Silently restrict social posts, reels & chat visibility</span>
                        </div>
                        <button
                          onClick={handleToggleShadowFlag}
                          disabled={isMutating}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            details.shadow_flagged
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {details.shadow_flagged ? 'Flagged (Restricted)' : 'Clean'}
                        </button>
                      </div>

                      {/* Deletion Request Status */}
                      {details.delete_requested_at && (
                        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <strong>Account Deletion Pending:</strong> Requested on {new Date(details.delete_requested_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
    </NativeDialog>
  );
};
