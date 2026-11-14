import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { getAllIntroModules } from '@/features/intro/registry';

export const IntroConfigPanel: React.FC = () => {
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
        intro: {
        active: activeTab,
        duration,
        skipDelay,
        enabled // Preview will bypass enabled check in IntroEngine, but we pass it anyway
        }
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
