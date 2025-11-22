
import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowLeft, Users, PlayCircle, CheckCircle, TrendingUp, RefreshCcw, LogOut, Mail } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { fetchAnalyticsSummary, AnalyticsSummary } from '../services/analyticsService';
import { supabase } from '../../../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AdminDashboardProps {
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadStats();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadStats();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setStats(null);
  };

  const loadStats = async () => {
    setStatsLoading(true);
    const data = await fetchAnalyticsSummary();
    setStats(data);
    setStatsLoading(false);
  };

  // Login View
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-200">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-full">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Login</h2>
          <p className="text-sm text-center text-gray-500 mb-6">Secure access via Supabase Auth</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mindflow.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
            
            <Button fullWidth type="submit" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
            
            <button 
              type="button" 
              onClick={onExit}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Return to App
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View (Authenticated)
  return (
    <div className="min-h-screen bg-gray-50 p-6 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Analytics Dashboard</h1>
              <p className="text-xs text-gray-500 font-medium">Welcome back, {session.user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={loadStats} disabled={statsLoading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
            <Button variant="secondary" onClick={onExit}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Exit
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Growth</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats?.totalInstalls || 0}
            </div>
            <p className="text-sm text-gray-500 font-medium">App Installs</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <PlayCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats?.totalQuizzesStarted || 0}
            </div>
            <p className="text-sm text-gray-500 font-medium">Quizzes Started</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completion</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats?.totalQuizzesCompleted || 0}
            </div>
            <p className="text-sm text-gray-500 font-medium">Quizzes Finished</p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats?.averageScore || 0}%
            </div>
            <p className="text-sm text-gray-500 font-medium">Avg. Score</p>
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Recent Activity Feed</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Event Type</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      {statsLoading ? 'Loading data...' : 'No recent activity found.'}
                    </td>
                  </tr>
                ) : (
                  stats?.recentActivity.map((activity, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 capitalize">
                        {activity.event.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {activity.date}
                      </td>
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                        {JSON.stringify(activity.data || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
