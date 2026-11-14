import React, { useId } from 'react';
import { X, Volume2, Smartphone, Clock, BookOpen } from 'lucide-react';
import { useQuizSettingsStore } from '../../stores/useQuizSettingsStore';
import { SettingsToggle } from './SettingsToggle';
import { NativeDialog } from '../../../../components/ui/NativeDialog';

export function QuizSettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const titleId = useId();
  const {
    isTimerEnabled, toggleTimer,
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    isExplanationEnabled, toggleExplanation
  } = useQuizSettingsStore();

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      className="max-w-md"
      panelClassName="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-slate-800 w-full overflow-hidden"
    >
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 dark:bg-slate-900">
        <h2 id={titleId} className="text-lg font-bold text-gray-900 dark:text-white">Quiz Settings</h2>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">

          <div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Gameplay</h3>
              <div className="space-y-1">
                  <SettingsToggle
                      label="Timer"
                      checked={isTimerEnabled}
                      onChange={toggleTimer}
                      icon={<Clock className="w-4 h-4" />}
                  />
                  <SettingsToggle
                      label="Show Explanation"
                      checked={isExplanationEnabled}
                      onChange={toggleExplanation}
                      icon={<BookOpen className="w-4 h-4" />}
                  />
              </div>
          </div>

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
      </div>
    </NativeDialog>
  );
}
