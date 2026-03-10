import React, { useContext } from 'react';
import { BrainCircuit, Home, Compass, PlusCircle, User, Settings, LogIn, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../features/auth/context/AuthContext';
import { useQuizContext } from '../features/quiz/context/QuizContext';
import { SettingsContext } from '../context/SettingsContext';
import { ClaymorphismSwitch } from '../features/quiz/components/ui/ClaymorphismSwitch';


/**
 * Unique identifiers for the main navigation tabs.
 */
export type TabID = 'home' | 'explore' | 'create' | 'profile' | 'login';

/**
 * Props for the MainLayout component.
 */
interface MainLayoutProps {
  /** The main content to render within the layout frame. */
  children: React.ReactNode;
  /** The currently active navigation tab. */
  activeTab: TabID;
  /** Callback to switch tabs. */
  onTabChange: (tab: TabID) => void;
  /** Callback to open the settings modal. */
  onOpenSettings: () => void;
}

/**
 * The primary application layout shell.
 *
 * Provides:
 * - Sticky Top Header (Logo + Avatar/Settings).
 * - Scrollable Main Content Area.
 * - Sticky Bottom Navigation Bar (Tabs).
 * - Responsive constraints (centered content max-width).
 *
 * @param {MainLayoutProps} props - The layout configuration.
 * @returns {JSX.Element} The rendered layout.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  onOpenSettings 
}) => {
  const { user } = useAuth();
  const { isReviewMode } = useQuizContext();
  const { isDarkMode, toggleDarkMode } = useContext(SettingsContext);

  const handleProfileClick = () => {
    if (user) {
      onTabChange('profile');
    } else {
      onTabChange('login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 dark:bg-gray-900/50 dark:bg-slate-950 transition-colors duration-300 relative">
      
      {/* --- Sticky Top Header --- */}
      {!isReviewMode && (
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-gray-800 dark:bg-gray-800/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 dark:border-gray-700/50 dark:border-slate-800 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white dark:text-white dark:text-slate-100 transition-colors duration-300">MindFlow</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="scale-[0.25] origin-right w-[50px] mr-2 flex-shrink-0 relative overflow-visible">
              <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
            </div>
            {user ? (
              <button onClick={() => onTabChange('profile')} className="rounded-full transition-opacity duration-200 hover:opacity-80">
                <img
                  src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              </button>
            ) : (
               <button
                onClick={onOpenSettings}
                className="p-2 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      {/* --- Main Scrollable Content --- */}
      <main className={cn("flex-1 w-full max-w-3xl mx-auto px-4 pt-4 relative z-0", isReviewMode ? "pb-4" : "pb-24")}>
        {children}
      </main>

      {/* --- Sticky Bottom Tab Bar --- */}
      <nav className={cn("fixed bottom-0 left-0 w-full bg-white dark:bg-gray-800 dark:bg-gray-800 dark:bg-slate-900 border-t border-gray-200 dark:border-gray-700 dark:border-gray-700 dark:border-slate-800 z-50 transition-colors duration-300 pb-[env(safe-area-inset-bottom)]", isReviewMode ? "hidden" : "block")}>
        <div className="max-w-3xl mx-auto px-2 h-16 flex items-center justify-around">
          
          <NavTab 
            id="home" 
            label="Home" 
            icon={<Home className="w-6 h-6" />} 
            isActive={activeTab === 'home'} 
            onClick={() => onTabChange('home')} 
          />
          
          <NavTab 
            id="explore" 
            label="English" 
            icon={<Compass className="w-6 h-6" />} 
            isActive={activeTab === 'explore'} 
            onClick={() => onTabChange('explore')} 
          />
          
          <button 
            onClick={() => onTabChange('create')}
            className="relative -top-5 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 border-gray-50 dark:border-slate-950 transition-colors",
              activeTab === 'create' 
                ? "bg-indigo-600 text-white shadow-indigo-200 translate-y-1" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
            )}>
              <PlusCircle className="w-7 h-7" />
            </div>
            <span className={cn(
              "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors",
              activeTab === 'create' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
            )}>
              Create
            </span>
          </button>

          {user ? (
            <NavTab
              id="profile"
              label="Profile"
              icon={<User className="w-6 h-6" />}
              isActive={activeTab === 'profile'}
              onClick={handleProfileClick}
            />
          ) : (
            <NavTab
              id="login"
              label="Sign In"
              icon={<LogIn className="w-6 h-6" />}
              isActive={activeTab === 'login'}
              onClick={handleProfileClick}
            />
          )}
        </div>
      </nav>
    </div>
  );
};

// Helper Subcomponent for Tab Items
const NavTab = ({ id, label, icon, isActive, onClick }: { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 active:scale-95",
      isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:text-slate-500 dark:hover:text-slate-300"
    )}
  >
    <div className={cn("transition-transform duration-200", isActive && "-translate-y-0.5")}>
      {icon}
    </div>
    <span className="text-[10px] font-bold mt-0.5">{label}</span>
  </button>
);
