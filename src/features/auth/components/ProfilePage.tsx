
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../../components/Button/Button';

interface ProfilePageProps {
  onNavigateToSettings: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToSettings }) => {
  const { user, signOut } = useAuth();

  if (!user) {
    return <div>Loading user profile...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <img
          src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
          alt="User Avatar"
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h2 className="text-2xl font-bold">{user.user_metadata?.full_name || user.email}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        <Button onClick={onNavigateToSettings} className="w-full">
          Profile Settings
        </Button>
        <Button onClick={signOut} variant="danger" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
