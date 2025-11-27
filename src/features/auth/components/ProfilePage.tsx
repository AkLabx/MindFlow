
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut, Award, CheckCircle, BarChart, ChevronRight } from 'lucide-react';

interface ProfilePageProps {
  onNavigateToSettings: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigateToSettings }) => {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  // Dummy data for stats, can be replaced with real data later
  const stats = [
    { name: 'Quizzes Completed', value: 24, icon: Award },
    { name: 'Correct Answers', value: '1,200', icon: CheckCircle },
    { name: 'Average Score', value: '85%', icon: BarChart },
  ];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        
        {/* --- Profile Header Card --- */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/30 overflow-hidden">
          <div className="relative h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
             {/* Avatar is positioned to overlap the header */}
          </div>
          <div className="p-6 pb-8 text-center relative">
            <img
              src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
              alt="User Avatar"
              className="w-28 h-28 rounded-full mx-auto -mt-20 border-4 border-white shadow-lg"
            />
            <div className="mt-4 flex items-center justify-center gap-2">
                <h1 className="text-3xl font-black text-slate-800">{user.user_metadata?.full_name || user.email}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
                    PRO
                </span>
            </div>
            <p className="text-slate-500 font-medium mt-1">{user.email}</p>
          </div>
        </div>

        {/* --- Stats Bar --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* --- Action Menu --- */}
        <div className="mt-6 space-y-3">
            <button 
                onClick={onNavigateToSettings}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-left">Profile Settings</h3>
                        <p className="text-xs text-slate-500 font-medium">Update your name, email, and password</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </button>

            <button 
                onClick={signOut}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-red-300 transition-all duration-300 group"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                        <LogOut className="w-5 h-5" />
                    </div>
                     <div>
                        <h3 className="font-bold text-red-700 text-left">Sign Out</h3>
                        <p className="text-xs text-slate-500 font-medium">You will be returned to the login screen</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
            </button>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
