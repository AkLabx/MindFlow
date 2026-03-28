import React from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { User, Settings, GraduationCap, ChevronRight, LogOut, Moon, Sun, Monitor, Bell, HelpCircle, ShieldAlert, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';
import { ModeSelector } from '../../../components/ModeSelector';

export const SchoolProfile: React.FC = () => {
  const {
    schoolBoard,
    schoolClass,
    setSchoolBoard,
    setSchoolClass,
    isDarkMode,
    toggleDarkMode,
    setTargetAudience
  } = useSettingsStore();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSwitchToCompetitive = () => {
    // Navigate first, update state slightly after to allow smooth transition
    navigate('/dashboard', { replace: true });
    setTimeout(() => {
        setTargetAudience('competitive');
    }, 50);
  };

  const menuGroups = [
    {
      title: 'Preferences',
      items: [
        {
          id: 'theme',
          label: 'Dark Theme',
          icon: isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
          action: () => toggleDarkMode(),
          rightElement: <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
        },
        {
          id: 'board',
          label: 'Board',
          icon: <Award className="w-5 h-5" />,
          action: () => {
             const newBoard = prompt("Enter your Board (CBSE, ICSE, State):", schoolBoard || '');
             if (newBoard) setSchoolBoard(newBoard);
          },
          rightElement: <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">{schoolBoard || 'Not Set'}</span>
        },
        {
          id: 'class',
          label: 'Class',
          icon: <GraduationCap className="w-5 h-5" />,
          action: () => {
             const newClass = prompt("Enter your Class (1-12):", schoolClass || '');
             if (newClass) setSchoolClass(newClass);
          },
          rightElement: <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">Class {schoolClass || 'Not Set'}</span>
        }
      ]
    },
    {
      title: 'App Settings',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          action: () => {},
          rightElement: <ChevronRight className="w-5 h-5 text-slate-400" />
        },
        {
          id: 'switch_mode',
          label: 'App Mode',
          icon: <Monitor className="w-5 h-5" />,
          action: () => {},
          rightElement: <ModeSelector />
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help Center',
          icon: <HelpCircle className="w-5 h-5" />,
          action: () => {},
          rightElement: <ChevronRight className="w-5 h-5 text-slate-400" />
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          icon: <ShieldAlert className="w-5 h-5" />,
          action: () => {},
          rightElement: <ChevronRight className="w-5 h-5 text-slate-400" />
        }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-8"
    >
      <header className="mb-6 flex flex-col items-center justify-center pt-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-xl shadow-emerald-500/20">
            <img
              src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.user_metadata?.full_name || 'Student'}`}
              alt="Profile"
              className="w-full h-full rounded-full border-4 border-white dark:border-slate-900 object-cover bg-white dark:bg-slate-800"
            />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-lg border-2 border-white dark:border-slate-900 hover:scale-105 transition-transform">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">
          {user?.user_metadata?.full_name || 'Student Profile'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {user?.email || 'student@mindflow.school'}
        </p>
      </header>

      <div className="space-y-6">
        {menuGroups.map((group, gIndex) => (
          <div key={gIndex} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.title}
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {group.items.map((item, iIndex) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors active:bg-slate-100 dark:active:bg-slate-800 group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-500 transition-colors">
                      {item.icon}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex-shrink-0" onClick={e => item.id === 'theme' ? e.stopPropagation() : null}>
                    {item.rightElement}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="px-4">
          <button
            onClick={handleSignOut}
            className="w-full py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>
    </motion.div>
  );
};
