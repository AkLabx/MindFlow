
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button/Button';
import { ArrowLeft, User, Mail, Lock, Loader2, Check, AlertTriangle } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  
  // State for user profile information
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  // State for password change
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI/UX states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setMessage(null);

    const updates: { data: { full_name: string }, email?: string } = {
        data: { full_name: fullName },
    };

    // Only include email if it has changed
    if (email !== user.email) {
        updates.email = email;
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Profile updated successfully!');
      await refreshUser(); // Refresh user data to get the latest
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!password) {
      setError('Password cannot be empty.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex items-center mb-6">
            <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Profile Settings</h1>
        </div>

        {/* --- Status Messages --- */}
        {error && (
          <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5"/>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        {message && (
           <div className="mb-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5"/>
            <span className="text-sm font-medium">{message}</span>
          </div>
        )}

        {/* --- Personal Information Card --- */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Personal Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
            </div>
             <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Saving...</> : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* --- Change Password Card --- */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-6">
           <h2 className="text-lg font-bold text-slate-800 mb-5">Change Password</h2>
           <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                      type="password"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
              </div>
              <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                  />
              </div>
            <Button type="submit" disabled={loading} variant="secondary" className="w-full sm:w-auto">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2"/> Updating...</> : 'Update Password'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
