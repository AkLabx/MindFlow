import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTargetAudience } from '../hooks/useTargetAudience';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button/Button';
import { ArrowLeft, User, Mail, Lock, Loader2, Check, AlertTriangle, Pencil, X, Phone, Calendar, Target, FileText, Trash2, Repeat } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

const EditableField: React.FC<{
  value: string,
  onSave: (newValue: string) => Promise<void>,
  icon: React.ElementType,
  placeholder?: string,
  type?: string
}> = ({ value, onSave, icon: Icon, placeholder, type = "text" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        setLoading(true);
        await onSave(currentValue);
        setLoading(false);
        setIsEditing(false);
    };

    return (
        <div className="relative flex items-center">
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                ref={inputRef}
                type={type}
                placeholder={placeholder}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                readOnly={!isEditing}
                className={`w-full pl-10 pr-20 py-3 border rounded-lg outline-none transition-shadow ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-300 bg-slate-50'}`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} disabled={loading} className="p-1.5 rounded-md hover:bg-green-100 text-green-600">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setIsEditing(false); setCurrentValue(value); }} className="p-1.5 rounded-md hover:bg-red-100 text-red-600">
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 dark:text-slate-400">
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setError(null); setMessage(null); }, 3000);
  };

  const updateMetadata = async (key: string, value: string, successMessage: string) => {
    if (!user) return;
    const { error } = await supabase.auth.updateUser({
      data: { [key]: value }
    });

    if (error) {
      showMessage(error.message, true);
    } else {
      showMessage(successMessage);
      await refreshUser();
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showMessage('Passwords do not match.', true);
      return;
    }
    if (!password) {
      showMessage('Password cannot be empty.', true);
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showMessage(error.message, true);
    } else {
      showMessage('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
       showMessage("Account deletion is not supported via the client side currently. Please contact support.", true);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in pb-32 md:pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 ml-4">Profile Settings</h1>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3"><AlertTriangle className="w-5 h-5"/><span className="text-sm font-medium">{error}</span></div>
        )}
        {message && (
           <div className="mb-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3"><Check className="w-5 h-5"/><span className="text-sm font-medium">{message}</span></div>
        )}

        {/* --- Personal Information Card --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">Personal Information</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <EditableField icon={User} value={user?.user_metadata?.full_name || ''} onSave={(v) => updateMetadata('full_name', v, 'Name updated!')} placeholder="Enter your full name" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Bio</label>
              <EditableField icon={FileText} value={user?.user_metadata?.bio || ''} onSave={(v) => updateMetadata('bio', v, 'Bio updated!')} placeholder="Write a short bio" />
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Target Exam</label>
               <EditableField icon={Target} value={user?.user_metadata?.target_exam || ''} onSave={(v) => updateMetadata('target_exam', v, 'Target exam updated!')} placeholder="e.g. UPSC, SSC, Banking" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <EditableField icon={Phone} type="tel" value={user?.user_metadata?.phone || ''} onSave={(v) => updateMetadata('phone', v, 'Phone updated!')} placeholder="+91 XXXXX XXXXX" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Date of Birth</label>
                  <EditableField icon={Calendar} type="date" value={user?.user_metadata?.dob || ''} onSave={(v) => updateMetadata('dob', v, 'DOB updated!')} />
               </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
               <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input
                       type="email"
                       value={user?.email || ''}
                       readOnly
                       className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                   />
               </div>
            </div>

          </div>
        </div>

        {/* --- Security Settings Card --- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 shadow-sm p-6">
           <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-5">Security Settings</h2>

           <div className="mb-8">
               <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Change Password</h3>
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

           <div className="pt-6 border-t border-slate-200">
               <h3 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2">
                   <AlertTriangle className="w-4 h-4" /> Danger Zone
               </h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
               <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
               >
                  <Trash2 className="w-4 h-4" /> Delete Account
               </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
