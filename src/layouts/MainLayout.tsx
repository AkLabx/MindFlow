import React from 'react';
import { BrainCircuit, Home, Compass, PlusCircle, User, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

export type TabID = 'home' | 'explore' | 'create' | 'profile';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: TabID;
  onTabChange: (tab: TabID) => void;
  onOpenSettings: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  onOpenSettings 
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 relative">
      
      {/* --- Sticky Top Header --- */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900">MindFlow</span>
          </div>
          
          <button 
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* --- Main Scrollable Content --- */}
      {/* pb-24 ensures content isn't hidden behind the bottom tab bar */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-24 relative z-0">
        {children}
      </main>

      {/* --- Sticky Bottom Tab Bar --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
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
          
          {/* Floating Action Button style for center tab */}
          <button 
            onClick={() => onTabChange('create')}
            className="relative -top-5 group"
          >
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 border-4 border-gray-50",
              activeTab === 'create' 
                ? "bg-indigo-600 text-white shadow-indigo-200 translate-y-1" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105"
            )}>
              <PlusCircle className="w-7 h-7" />
            </div>
            <span className={cn(
              "absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold transition-colors",
              activeTab === 'create' ? "text-indigo-600" : "text-gray-400"
            )}>
              Create
            </span>
          </button>

          <NavTab 
            id="profile" 
            label="Profile" 
            icon={<User className="w-6 h-6" />} 
            isActive={activeTab === 'profile'} 
            onClick={() => onTabChange('profile')} 
          />
          
        </div>
      </nav>
    </div>
  );
};

const NavTab = ({ id, label, icon, isActive, onClick }: { id: string, label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center w-16 py-1 transition-all duration-200 active:scale-95",
      isActive ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
    )}
  >
    <div className={cn("transition-transform duration-200", isActive && "-translate-y-0.5")}>
      {icon}
    </div>
    <span className="text-[10px] font-bold mt-0.5">{label}</span>
  </button>
);