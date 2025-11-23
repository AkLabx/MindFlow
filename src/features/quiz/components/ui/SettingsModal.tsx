
import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Moon, Smartphone, Sparkles } from 'lucide-react';
import { SettingsContext } from '../../../../context/SettingsContext';
import { SettingsToggle } from './SettingsToggle';
import { InstallPWA } from './InstallPWA';

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    isSoundEnabled, toggleSound,
    isHapticEnabled, toggleHaptics,
    areBgAnimationsEnabled, toggleBgAnimations,
    isDarkMode, toggleDarkMode
  } = useContext(SettingsContext);
  
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Settings</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* Section: Experience */}
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Experience</h3>
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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visuals</h3>
                <div className="space-y-1">
                    <SettingsToggle 
                        label="Background Fireballs" 
                        checked={areBgAnimationsEnabled} 
                        onChange={toggleBgAnimations} 
                        icon={<Sparkles className="w-4 h-4" />}
                    />
                    <SettingsToggle 
                        label="Dark Mode" 
                        checked={isDarkMode} 
                        onChange={toggleDarkMode} 
                        icon={<Moon className="w-4 h-4" />}
                    />
                </div>
            </div>

            {/* Section: PWA Install */}
            <InstallPWA />

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">MindFlow Quiz App v2.0.0</p>
        </div>
      </div>
    </div>,
    document.body
  );
}
