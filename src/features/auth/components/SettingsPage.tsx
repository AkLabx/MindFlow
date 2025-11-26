
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Button/Button';

interface SettingsPageProps {
  onBack: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        avatar_url: avatarUrl,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Profile updated successfully!');
      refreshUser();
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
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
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <Button onClick={onBack} className="mb-4">Go Back</Button>
      <h1 className="text-2xl font-bold mb-4">Profile Settings</h1>

      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      <div className="space-y-4">
        {/* Account & Security */}
        <div>
          <h2 className="text-xl font-semibold">Account & Security</h2>
          <div className="mt-2 space-y-2">
            <div>
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label>Avatar URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
            <div className="mt-4">
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <Button onClick={handleUpdatePassword} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </div>

        {/* --- Placeholders for other sections --- */}
        <div className="opacity-50">
          <h2 className="text-xl font-semibold">Preferences & Customization</h2>
          <p className="text-sm text-gray-500">(Placeholder)</p>
        </div>
        <div className="opacity-50">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="text-sm text-gray-500">(Placeholder)</p>
        </div>
        <div className="opacity-50">
          <h2 className="text-xl font-semibold">Privacy & Data</h2>
          <p className="text-sm text-gray-500">(Placeholder)</p>
        </div>
        <div className="opacity-50">
          <h2 className="text-xl font-semibold">Support & Feedback</h2>
          <p className="text-sm text-gray-500">(Placeholder)</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
