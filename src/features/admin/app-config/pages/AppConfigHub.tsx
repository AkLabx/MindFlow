import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Loader2, Layout, Image, Compass } from 'lucide-react';
import { IntroConfigPanel } from '../components/IntroConfigPanel';
import { ThemeConfigPanel } from '../components/ThemeConfigPanel';
import { BrandingConfigPanel } from '../components/BrandingConfigPanel';
import { LoadingConfigPanel } from '../components/LoadingConfigPanel';
import { OnboardingConfigPanel } from '../components/OnboardingConfigPanel';

const DashboardStub = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Layout className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Dashboard Config (Phase 2)</h3>
        <p className="text-sm">Manage widgets, banners, and layout.</p>
    </div>
);

export const AppConfigHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'intro' | 'onboarding' | 'theme' | 'loading' | 'dashboard' | 'branding'>('intro');

  const tabs = [
    { id: 'intro', label: 'Intro', icon: Sparkles },
    { id: 'onboarding', label: 'Onboarding', icon: Compass },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'loading', label: 'Loading', icon: Loader2 },
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'branding', label: 'Branding', icon: Image },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Remote App Administration & Config
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic remote configuration for startup intros, native onboarding flows, brand logo variants, dark/light themes, and loading animations.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 border-b-2 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div>
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
                    {activeTab === 'onboarding' && <OnboardingConfigPanel />}
                    {activeTab === 'theme' && <ThemeConfigPanel />}
                    {activeTab === 'loading' && <LoadingConfigPanel />}
                    {activeTab === 'dashboard' && <DashboardStub />}
                    {activeTab === 'branding' && <BrandingConfigPanel />}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
