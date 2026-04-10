import React, { useContext, useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit, Home, GraduationCap, PlusCircle, User, Settings, LogIn, Sun, Moon, Brain, Menu } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../features/auth/context/AuthContext';
import { useQuizContext } from '../features/quiz/context/QuizContext';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ClaymorphismSwitch } from '../features/quiz/components/ui/ClaymorphismSwitch';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { SidePanel } from '../components/layout/SidePanel';


/**
 * Unique identifiers for the main navigation tabs.
 */
export type TabID = 'home' | 'school' | 'create' | 'profile' | 'login' | 'ai';

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
  const { isDarkMode, toggleDarkMode } = useSettingsStore();
  const location = useLocation();
  const isAIFullScreen = location.pathname.startsWith('/ai/chat') || location.pathname.startsWith('/ai/talk') || location.pathname.startsWith('/tools/text-exporter') || location.pathname.startsWith('/tools/flashcard-maker');

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useLayoutEffect(() => {
    const updateIndicator = () => {
      if (activeTab === 'ai') {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
        return;
      }

      const activeEl = tabsRef.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      }
    };

    updateIndicator();

    // Add small delay for initial render positioning
    const timer = setTimeout(updateIndicator, 100);

    window.addEventListener('resize', updateIndicator);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab]);


  const handleProfileClick = () => {
    if (user) {
      onTabChange('profile');
    } else {
      onTabChange('login');
    }
  };

  useEffect(() => {
    if (!document.getElementById('mesh-keyframes')) {
        const style = document.createElement('style');
        style.id = 'mesh-keyframes';
        style.innerHTML = `
            @keyframes flow {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            .animate-flow {
                background-size: 200% 200%;
                animation: flow 15s ease infinite;
            }
        `;
        document.head.appendChild(style);
    }
  }, []);

  return (
    <div className={cn(
        "flex flex-col transition-colors duration-700 relative bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 animate-flow",
        isAIFullScreen ? "h-[100dvh] w-screen overflow-hidden fixed inset-0" : "min-h-screen"
    )}>
      
      {/* --- Sticky Top Header --- */}
      {!isReviewMode && !isAIFullScreen && (
      <header className="sticky top-0 z-40 w-full transition-all duration-300 relative group overflow-visible">
        {/* Glow Background Layer */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

        {/* Interactive Inner Shadow / Border */}
        <div className="absolute inset-0 border-b border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 border-b-[4px] border-b-indigo-200/50 dark:border-b-indigo-700/50"></div>

        {/* Centered Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-20 transition-opacity duration-500 z-0 bg-indigo-500"></div>

        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between relative z-20">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white transition-colors duration-300 leading-none">MindFlow</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">v{import.meta.env.VITE_APP_VERSION}</span>
            </div>
          </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="mr-2 flex-shrink-0 flex items-center justify-center">
              <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={() => onTabChange('profile')} className="rounded-full transition-opacity duration-200 hover:opacity-80">
                  <img
                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/6.x/initials/svg?seed=${user.user_metadata?.full_name || user.email}`}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setIsSidePanelOpen(true)} className="p-2 -mr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>
      )}

      <SidePanel isOpen={isSidePanelOpen} onClose={() => setIsSidePanelOpen(false)} onTabChange={(tab: string) => onTabChange(tab as any)} />

      {/* --- Main Scrollable Content --- */}
      <main className={cn(
        "flex-1 w-full relative z-0",
        isAIFullScreen
            ? "max-w-none p-0 overflow-hidden h-full"
            : cn("max-w-3xl mx-auto px-4 pt-4", isReviewMode ? "pb-4" : "pb-24")
      )}>
        {children}
      </main>

      {/* --- Sticky Bottom Tab Bar --- */}
      <nav className={cn(
        "fixed bottom-0 left-0 w-full z-50 transition-colors duration-300 pb-[env(safe-area-inset-bottom)] group overflow-visible",
        isReviewMode || isAIFullScreen ? "hidden" : "block"
      )}>
        {/* Glow Background Layer */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl transition-colors duration-300 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-white/10 dark:from-white/10 dark:to-transparent z-0"></div>

        {/* Interactive Inner Shadow / Border */}
        <div className="absolute inset-0 border-t border-white/60 dark:border-white/10 shadow-[0_-8px_32px_0_rgba(31,38,135,0.07)] dark:shadow-[0_-8px_32px_0_rgba(0,0,0,0.3)] z-10 transition-all duration-300 border-t-[4px] border-t-indigo-200/50 dark:border-t-indigo-700/50"></div>

        {/* Centered Subtle Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[60px] opacity-20 transition-opacity duration-500 z-0 bg-indigo-500"></div>
        <div className="max-w-3xl mx-auto px-2 h-16 flex items-center justify-around relative z-20" role="tablist">

          {/* Active Indicator Container */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 h-12 rounded-2xl pointer-events-none z-0"
            animate={{
              x: indicatorStyle.left,
              width: indicatorStyle.width,
              opacity: indicatorStyle.opacity,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
            style={{
              willChange: "transform",
              transform: "translateZ(0)"
            }}
          >
            {/* Glow Layer */}
            <div className="absolute inset-0 rounded-2xl blur-[12px] opacity-80" style={{ backgroundColor: 'var(--gold-glow)' }}></div>

            {/* Clip Mask container */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[inset_0_1px_4px_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]">
              {/* Rotating Conic Gradient */}
              <div
                className="indicator-gradient absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, var(--gold-2) 20%, var(--gold-3) 50%, var(--gold-2) 80%, transparent 100%)',
                  opacity: 0.6
                }}
              ></div>

              {/* Inner Plate */}
              <div className="absolute inset-[2px] rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md"></div>
            </div>
          </motion.div>

          
          <NavTab 
            ref={(el: HTMLButtonElement | null) => { tabsRef.current['home'] = el; }}
            id="home" 
            label="Home" 
            icon={<Home className="w-6 h-6" />} 
            isActive={activeTab === 'home'} 
            onClick={() => onTabChange('home')} 
          />
          
          <NavTab 
            ref={(el: HTMLButtonElement | null) => { tabsRef.current['school'] = el; }}
            id="school"
            label="School"
            icon={<GraduationCap className="w-6 h-6" />}
            isActive={activeTab === 'school'}
            onClick={() => onTabChange('school')}
          />
          
          <motion.button
            onClick={() => onTabChange('ai')}
            className="relative -top-5 group"
            whileHover={{ scale: 1.10 }}
            whileTap={{ scale: 1.05 }}
            style={{ transitionTimingFunction: 'var(--easing-bounce)' }}
          >
            <div className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-[400ms] border-4 border-white dark:border-slate-900",
              activeTab === 'ai'
                ? "bg-gradient-to-br from-[var(--gold-2)] to-[var(--gold-1)] text-white shadow-[var(--gold-glow)] translate-y-1"
                : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 hover:scale-105 shadow-indigo-600/30"
            )}>
              {/* Inner glow for glass feel */}
              <div className="absolute inset-0 rounded-full border border-white/20"></div>
              {/* Active glow */}
              {activeTab === 'ai' && (
                <div className="absolute inset-0 rounded-full blur-md bg-indigo-500/30 -z-10"></div>
              )}
              <Brain className="w-7 h-7" />
            </div>
            <span className={cn(
              "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors",
              activeTab === 'ai' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-500"
            )}>
              AI
            </span>
          </motion.button>

          {user ? (
            <NavTab
              ref={(el: HTMLButtonElement | null) => { tabsRef.current['profile'] = el; }}
              id="profile"
              label="Profile"
              icon={<User className="w-6 h-6" />}
              isActive={activeTab === 'profile'}
              onClick={handleProfileClick}
            />
          ) : (
            <NavTab
              ref={(el: HTMLButtonElement | null) => { tabsRef.current['login'] = el; }}
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
const NavTab = React.forwardRef<HTMLButtonElement, { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }>(({ id, label, icon, isActive, onClick }, ref) => (
  <motion.button
    ref={ref}
    onClick={onClick}
    whileHover={{ scale: 1.10 }}
    whileTap={{ scale: 1.05 }}
    role="tab"
    aria-selected={isActive}
    aria-pressed={isActive}
    className={cn(
      "relative flex flex-col items-center justify-center w-16 py-1 transition-colors duration-[400ms] group",
      isActive ? "text-[var(--gold-2)]" : "text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-slate-300"
    )}
    style={{ transitionTimingFunction: 'var(--easing-bounce)' }}
  >
    <div className={cn(
      "relative transition-colors duration-[400ms] z-10 p-1.5 rounded-xl flex items-center justify-center",
      isActive
         ? "text-[var(--gold-2)]"
         : "bg-transparent group-hover:bg-gray-100/50 dark:group-hover:bg-gray-800/50"
    )}
    style={{ transitionTimingFunction: 'var(--easing-bounce)' }}
    >
      {icon}
    </div>
    <span className={cn(
      "text-[10px] font-bold mt-1 transition-colors duration-[400ms] z-10",
      isActive
         ? "text-[var(--gold-2)] font-black tracking-wide"
         : "font-semibold"
    )}
    style={{ transitionTimingFunction: 'var(--easing-bounce)' }}
    >
      {label}
    </span>
  </motion.button>
));
NavTab.displayName = 'NavTab';
