import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button/Button';
import { ArrowLeft, User, Mail, Lock, Loader2, Check, AlertTriangle, Pencil, X } from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
}

/**
 * A sub-component for inline editing of text fields.
 *
 * Displays a value and allows the user to switch to edit mode.
 * In edit mode, shows Save and Cancel buttons.
 *
 * @param {object} props - The component props.
 * @param {string} props.value - The current value of the field.
 * @param {function} props.onSave - Async callback function executed when saving the new value.
 * @returns {JSX.Element} The rendered editable field component.
 */
const EditableField: React.FC<{value: string, onSave: (newValue: string) => Promise<void>}> = ({ value, onSave }) => {
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
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                ref={inputRef}
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                readOnly={!isEditing}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg outline-none transition-shadow ${isEditing ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-300 bg-slate-50'}`}
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
                    <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500">
                        <Pencil className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * User Settings Page Component.
 *
 * Allows users to update their personal information (Name) and security credentials (Password).
 *
 * @param {SettingsPageProps} props - The component props.
 * @returns {JSX.Element} The rendered Settings Page.
 */
const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * Updates the user's full name in Supabase.
   * @param {string} newName - The new name to save.
   */
  const handleUpdateName = async (newName: string) => {
    if (!user) return;
    
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName } });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Name updated successfully!');
      await refreshUser();
    }
    setTimeout(() => setMessage(null), 3000);
  };

  /**
   * Updates the user's password.
   * @param {React.FormEvent} e - Form submission event.
   */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!password) {
      setError('Password cannot be empty.');
       setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);

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
        
        <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
            <h1 className="text-2xl font-bold text-slate-800 ml-4">Profile Settings</h1>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3"><AlertTriangle className="w-5 h-5"/><span className="text-sm font-medium">{error}</span></div>
        )}
        {message && (
           <div className="mb-4 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3"><Check className="w-5 h-5"/><span className="text-sm font-medium">{message}</span></div>
        )}

        {/* --- Personal Information Card --- */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-5">Personal Information</h2>
          <div className="space-y-4">
            <EditableField value={user?.user_metadata?.full_name || ''} onSave={handleUpdateName} />
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                />
            </div>
          </div>
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
