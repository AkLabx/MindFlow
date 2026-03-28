import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Target, ChevronDown, Check } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { supabase } from '../../lib/supabase';

export const ModeSelector: React.FC = () => {
  const { targetAudience, setTargetAudience } = useSettingsStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'competitive' | 'school' | null>(null);

  const currentMode = targetAudience || 'competitive';

  const handleSelectMode = (mode: 'competitive' | 'school') => {
    if (mode === currentMode) {
      setIsOpen(false);
      return;
    }
    setPendingMode(mode);
    setIsOpen(false);
    setShowConfirm(true);
  };

  const confirmSwitch = async () => {
    if (!pendingMode) return;

    setShowConfirm(false);

    // We delay the state update and navigation slightly to allow the modal to close
    // and to orchestrate a smoother route transition without an abrupt UI flash.
    const modeToSwitchTo = pendingMode;
    setPendingMode(null);

    // Update remote state in background if authenticated
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ target_audience: modeToSwitchTo })
          .eq('id', user.id);
      } catch (error) {
        console.error('Failed to update target audience in DB:', error);
      }
    }

    // First navigate, then change state to allow smooth routing unmount/mount
    if (modeToSwitchTo === 'school') {
      navigate('/school/dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }

    setTimeout(() => {
        setTargetAudience(modeToSwitchTo);
    }, 50); // tiny delay lets the router start pushing before state snaps out the tree
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className={`p-1.5 rounded-lg ${currentMode === 'school' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
          {currentMode === 'school' ? <GraduationCap className="w-4 h-4" /> : <Target className="w-4 h-4" />}
        </div>
        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
          {currentMode === 'school' ? 'School Mode' : 'Competitive'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
            >
              <div className="p-1">
                <button
                  onClick={() => handleSelectMode('competitive')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    currentMode === 'competitive'
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span className="font-semibold text-sm flex-1">Competitive</span>
                  {currentMode === 'competitive' && <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleSelectMode('school')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    currentMode === 'school'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-semibold text-sm flex-1">School Mode</span>
                  {currentMode === 'school' && <Check className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700"
            >
              <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${
                pendingMode === 'school'
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }`}>
                {pendingMode === 'school' ? <GraduationCap className="w-6 h-6" /> : <Target className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Switching Mode
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You are about to switch to <strong className="text-slate-800 dark:text-slate-200">{pendingMode === 'school' ? 'School Mode' : 'Competitive Mode'}</strong>. Are you sure you want to continue?
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSwitch}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white transition-colors ${
                    pendingMode === 'school'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Confirm Switch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
