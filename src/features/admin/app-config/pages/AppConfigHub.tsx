import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Sparkles, Palette, Loader2, Layout, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { getAllIntroModules } from '@/features/intro/registry';

// Subcomponents for tabs
const IntroConfigPanel = () => {
  const { config, updateConfig, isLoading, startPreview } = useAppConfigStore();
  const showToast = useNotificationStore(state => state.showToast);
  const introModules = getAllIntroModules();

  const [activeTab, setActiveTab] = useState(config.intro.active);
  const [duration, setDuration] = useState(config.intro.duration);
  const [skipDelay, setSkipDelay] = useState(config.intro.skipDelay);
  const [enabled, setEnabled] = useState(config.intro.enabled);

  const handleSave = async () => {
    try {
      await updateConfig('intro', {
        active: activeTab,
        duration,
        skipDelay,
        enabled
      });
      showToast({ title: 'Saved', message: 'Intro config updated remotely', variant: 'success' });
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to update config', variant: 'error' });
    }
  };

  const handlePreview = () => {
      startPreview({
        active: activeTab,
        duration,
        skipDelay,
        enabled // Preview will bypass enabled check in IntroEngine, but we pass it anyway
      });
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Startup Experience</h3>
           <div className="flex items-center gap-3">
               <label className="flex items-center gap-2 cursor-pointer">
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Enable Intro</span>
                   <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={enabled}
                      onChange={e => setEnabled(e.target.checked)}
                   />
               </label>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {introModules.map(mod => (
               <div
                   key={mod.id}
                   onClick={() => mod.isAvailable && setActiveTab(mod.id)}
                   className={`p-4 rounded-xl border-2 transition-all ${
                       activeTab === mod.id
                       ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                       : mod.isAvailable
                            ? 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 cursor-pointer'
                            : 'border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed'
                   }`}
               >
                   <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">{mod.name}</h4>
                       {!mod.isAvailable && <span className="text-[10px] uppercase font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400">Soon</span>}
                   </div>
                   <p className="text-xs text-slate-500">{mod.description}</p>
               </div>
           ))}
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
           <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   Duration (ms)
               </label>
               <input
                   type="number"
                   value={duration}
                   onChange={e => setDuration(Number(e.target.value))}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
               />
               <p className="text-xs text-slate-500 mt-1">Total animation length before continuing.</p>
           </div>
           <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                   Skip Delay (ms)
               </label>
               <input
                   type="number"
                   value={skipDelay}
                   onChange={e => setSkipDelay(Number(e.target.value))}
                   className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
               />
               <p className="text-xs text-slate-500 mt-1">When to show the skip button (0 to hide).</p>
           </div>
       </div>

       <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
           <button
               onClick={handlePreview}
               className="px-6 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2"
           >
               <Play className="w-4 h-4" /> Live Preview
           </button>
           <button
               onClick={handleSave}
               disabled={isLoading}
               className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
           >
               {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
               Publish Config
           </button>
       </div>
    </div>
  );
};

// Stub Panels
const ThemeStub = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Palette className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Theme Config (Phase 2)</h3>
        <p className="text-sm">Manage colors, fonts, and dark/light modes.</p>
    </div>
);
const LoadingStub = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-16 h-16 mb-4 opacity-20 animate-spin-slow" />
        <h3 className="text-xl font-bold">Loading Config (Phase 2)</h3>
        <p className="text-sm">Manage spinners and skeleton styles.</p>
    </div>
);
const DashboardStub = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Layout className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Dashboard Config (Phase 2)</h3>
        <p className="text-sm">Manage widgets, banners, and layout.</p>
    </div>
);
const BrandingStub = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Image className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Branding Config (Phase 2)</h3>
        <p className="text-sm">Manage logo, welcome text, and assets.</p>
    </div>
);

export const AppConfigHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'intro' | 'theme' | 'loading' | 'dashboard' | 'branding'>('intro');

  const tabs = [
    { id: 'intro', label: 'Intro', icon: Sparkles },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'loading', label: 'Loading', icon: Loader2 },
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'branding', label: 'Branding', icon: Image },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> App Administration
            </h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 flex gap-6 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                            isActive
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon className="w-4 h-4" /> {tab.label}
                    </button>
                )
            })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'intro' && <IntroConfigPanel />}
                    {activeTab === 'theme' && <ThemeStub />}
                    {activeTab === 'loading' && <LoadingStub />}
                    {activeTab === 'dashboard' && <DashboardStub />}
                    {activeTab === 'branding' && <BrandingStub />}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
