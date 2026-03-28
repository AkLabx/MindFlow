import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, PenTool, User, Sun, Moon, Bell } from 'lucide-react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import Confetti from 'react-confetti';
import { SchoolOnboarding } from './SchoolOnboarding';
import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';

export const SchoolLayout: React.FC = () => {
  const { isDarkMode, toggleDarkMode, schoolOnboardingSeen } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showOnboarding, setShowOnboarding] = useState(!schoolOnboardingSeen);

  const tabs = [
    { id: 'dashboard', path: '/school/dashboard', icon: <Home className="w-6 h-6" />, label: 'Home' },
    { id: 'subjects', path: '/school/subjects', icon: <BookOpen className="w-6 h-6" />, label: 'Subjects' },
    { id: 'tests', path: '/school/tests', icon: <PenTool className="w-6 h-6" />, label: 'Tests' },
    { id: 'profile', path: '/school/profile', icon: <User className="w-6 h-6" />, label: 'Profile' },
  ];

  const [showConfetti, setShowConfetti] = useState(false);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
  };

  if (showOnboarding) {
    return <SchoolOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-outfit selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-300">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={500} />}

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/school/dashboard')}>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-xl shadow-sm">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 hidden sm:block">MindFlow School</span>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 sm:hidden">School</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="mr-1 flex items-center justify-center scale-90">
              <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
            </div>
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button onClick={() => navigate('/school/profile')} className="rounded-full transition-opacity hover:opacity-80 border-2 border-emerald-500/20 p-0.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                S
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-6 pb-24 relative z-0">
        <Outlet />
      </main>

      {/* Sticky Bottom Navigation Bar (School Specific) */}
      <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 transition-colors duration-300 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-3xl mx-auto px-2 h-16 flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 active:scale-95 group relative ${
                  isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-3 w-10 h-1 bg-emerald-500 rounded-b-full transition-all" />
                )}
                <div className={`transition-transform duration-200 ${isActive ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`}>
                  {tab.icon}
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
};
