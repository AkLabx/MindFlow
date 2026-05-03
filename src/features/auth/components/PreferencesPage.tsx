import React from 'react';
import { ArrowLeft, Volume2, Smartphone, Sparkles, Moon } from 'lucide-react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { SettingsToggle } from '../../quiz/components/ui/SettingsToggle';
import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';
import { InstallPWA } from '../../quiz/components/ui/InstallPWA';

interface PreferencesPageProps {
  onBack: () => void;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBack }) => {
  const {
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    areBgAnimationsEnabled, toggleBgAnimations,
    isDarkMode, toggleDarkMode
  } = useSettingsStore();

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8 animate-fade-in pb-32 md:pb-20 transition-colors duration-300">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"><ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" /></button>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 ml-4">App Preferences</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 transition-colors duration-300">
            <div className="space-y-6">

                {/* Section: Experience */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Experience</h3>
                    <div className="space-y-1">
                        <SettingsToggle
                            label="Sound Effects"
                            checked={isSoundEnabled}
                            onChange={toggleSound}
                            icon={<Volume2 className="w-4 h-4" />}
                        />
                        <SettingsToggle
                            label="Haptic Feedback"
                            checked={isHapticEnabled}
                            onChange={toggleHaptics}
                            icon={<Smartphone className="w-4 h-4" />}
                        />
                    </div>
                </div>

                {/* Section: Visuals */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Visuals</h3>
                    <div className="space-y-1">
                        <SettingsToggle
                            label="Background Fireballs"
                            checked={areBgAnimationsEnabled}
                            onChange={toggleBgAnimations}
                            icon={<Sparkles className="w-4 h-4" />}
                        />
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                               <span className="text-gray-400"><Moon className="w-4 h-4" /></span>
                               <label className="cursor-pointer select-none">Dark Mode</label>
                            </div>
                            <div>
                               <ClaymorphismSwitch checked={isDarkMode} onChange={toggleDarkMode} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: PWA Install */}
                <InstallPWA />

            </div>
        </div>

      </div>
    </div>
  );
};

export default PreferencesPage;
