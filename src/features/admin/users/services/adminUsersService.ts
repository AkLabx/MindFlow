import { supabase } from '@/lib/supabase';
import { AppRole } from '@/config/permissions';

export interface UserSummary {
  id: string;
  email?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  xp?: number;
  study_streak?: number;
  subscription_status?: string;
  status?: string;
  trust_score?: number;
  shadow_flagged?: boolean;
  roles: AppRole[];
  last_seen?: string;
}

export interface UserDetailData extends UserSummary {
  bio?: string;
  target_exam?: string;
  phone?: string;
  dob?: string;
  daily_queries_used?: number;
  daily_questions_attempted?: number;
  delete_requested_at?: string;
  activeSessions: {
    session_token: string;
    updated_at: string;
  }[];
  stats: {
    quizzesCompleted: number;
    bookmarksCount: number;
    testAttemptsCount: number;
  };
}

/**
 * Fetch all users with their assigned roles and stats
 */
export const fetchUsersList = async ({
  search = '',
  roleFilter = 'all',
  sortBy = 'created_at',
  sortOrder = 'desc'
}: {
  search?: string;
  roleFilter?: string;
  sortBy?: 'created_at' | 'xp' | 'study_streak';
  sortOrder?: 'asc' | 'desc';
}) => {
  // 1. Fetch profiles
  let query = supabase.from('profiles').select('*');

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`full_name.ilike.${term},username.ilike.${term},email.ilike.${term},id.eq.${search.trim()}`);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  const { data: profiles, error: profError } = await query;
  if (profError) throw profError;

  // 2. Fetch all user_roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id, role');

  if (rolesError) {
    console.warn('Could not fetch user_roles (might lack super_admin privilege):', rolesError);
  }

  const roleMap: Record<string, AppRole[]> = {};
  (rolesData || []).forEach((r) => {
    if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
    roleMap[r.user_id].push(r.role as AppRole);
  });

  // 3. Assemble composite objects
  let users: UserSummary[] = (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    username: p.username,
    full_name: p.full_name,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
    xp: p.xp || 0,
    study_streak: p.study_streak || 0,
    subscription_status: p.subscription_status || 'free',
    status: p.status || 'active',
    trust_score: p.trust_score ?? 100,
    shadow_flagged: Boolean(p.shadow_flagged),
    roles: roleMap[p.id] || [],
    last_seen: p.last_seen
  }));

  // 4. Client filter by role if specified
  if (roleFilter !== 'all') {
    if (roleFilter === 'user') {
      users = users.filter((u) => u.roles.length === 0);
    } else {
      users = users.filter((u) => u.roles.includes(roleFilter as AppRole));
    }
  }

  return users;
};

/**
 * Fetch detailed metrics and active sessions for a specific user
 */
export const fetchUserDetails = async (userId: string): Promise<UserDetailData> => {
  // 1. Profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profErr) throw profErr;

  // 2. Roles
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  const roles = (rolesData || []).map((r) => r.role as AppRole);

  // 3. Active Sessions
  const { data: sessionsData } = await supabase
    .from('user_active_sessions')
    .select('session_token, updated_at')
    .eq('user_id', userId);

  // 4. Academic Stats (Quizzes, Bookmarks, Test attempts)
  const [
    { count: quizCount },
    { count: bmarkCount },
    { count: testCount }
  ] = await Promise.all([
    supabase.from('quiz_history').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_test_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  ]);

  return {
    id: profile.id,
    email: profile.email,
    username: profile.username,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
    xp: profile.xp || 0,
    study_streak: profile.study_streak || 0,
    subscription_status: profile.subscription_status || 'free',
    status: profile.status || 'active',
    trust_score: profile.trust_score ?? 100,
    shadow_flagged: Boolean(profile.shadow_flagged),
    roles,
    last_seen: profile.last_seen,
    bio: profile.bio,
    target_exam: profile.target_exam,
    phone: profile.phone,
    dob: profile.dob,
    daily_queries_used: profile.daily_queries_used || 0,
    daily_questions_attempted: profile.daily_questions_attempted || 0,
    delete_requested_at: profile.delete_requested_at,
    activeSessions: sessionsData || [],
    stats: {
      quizzesCompleted: quizCount || 0,
      bookmarksCount: bmarkCount || 0,
      testAttemptsCount: testCount || 0
    }
  };
};

/**
 * Assign a new role to a user
 */
export const assignUserRole = async (
  userId: string,
  role: AppRole,
  currentAdminId?: string
) => {
  const { data, error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role,
    assigned_by: currentAdminId || null
  }).select();

  if (error) throw error;
  return data;
};

/**
 * Revoke a role from a user
 */
export const revokeUserRole = async (userId: string, role: AppRole) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) throw error;
  return true;
};

/**
 * Update user trust score, shadow flag, or account status
 */
export const updateUserModerationStatus = async (
  userId: string,
  updates: {
    trust_score?: number;
    shadow_flagged?: boolean;
    status?: string;
  }
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Terminate all active sessions for a user
 */
export const terminateAllUserSessions = async (userId: string) => {
  const { error } = await supabase
    .from('user_active_sessions')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return true;
};
