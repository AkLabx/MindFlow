import React, { useState } from 'react';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { BrandSpinner } from '@/components/brand';

export const LoadingConfigPanel: React.FC = () => {
  const { config, updateConfig, isLoading } = useAppConfigStore();
  const showToast = useNotificationStore(state => state.showToast);

  const [speed, setSpeed] = useState<'normal' | 'snappy' | 'relaxed'>(config.loading?.speed || 'normal');
  const [showEmblem, setShowEmblem] = useState<boolean>(config.loading?.showEmblem !== false);
  const [activeVariant, setActiveVariant] = useState<'synaptic' | 'morphing'>(
    (config.loading?.activeVariant as 'synaptic' | 'morphing') || 'synaptic'
  );

  const handleSave = async () => {
    try {
      await updateConfig('loading', {
        activeVariant,
        speed,
        showEmblem,
      });
      showToast({ title: 'Saved', message: 'Loading spinner configuration updated remotely', variant: 'success' });
    } catch (e) {
      showToast({ title: 'Error', message: 'Failed to update loading configuration', variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Loading & Motion System</h3>
          <p className="text-sm text-slate-500">Configure signature brand halo animations, compact morphing rings, inline button loaders, and pulse transitions.</p>
        </div>
      </div>

      {/* Live Previews - 4 Variants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Variant 1: Signature Halo Spinner */}
        <div className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
          activeVariant === 'synaptic'
            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/50 shadow-sm'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Halo Ring</span>
            {activeVariant === 'synaptic' && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-indigo-600 text-white uppercase">Active</span>
            )}
          </div>
          <div className="py-4">
            <BrandSpinner variant="synaptic" size="md" speed={speed} showEmblem={showEmblem} />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Orbital glowing halo for immersive transitions</span>
        </div>

        {/* Variant 2: Compact Morphing Synapse */}
        <div className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
          activeVariant === 'morphing'
            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500/50 shadow-sm'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Morphing Synapse</span>
            {activeVariant === 'morphing' && (
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded-md bg-indigo-600 text-white uppercase">Active</span>
            )}
          </div>
          <div className="py-4 flex items-center justify-center gap-4">
            <BrandSpinner variant="morphing" size="sm" speed={speed} showEmblem={showEmblem} />
            <BrandSpinner variant="morphing" size="md" speed={speed} showEmblem={showEmblem} />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Ultra-compact morphing ring that fits anywhere</span>
        </div>

        {/* Variant 3: Inline Button Spinner */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">3. Inline Arc</span>
          <div className="py-3 flex flex-col gap-2 items-center w-full">
            <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm pointer-events-none">
              <BrandSpinner variant="inline" size="xs" />
              <span>Authenticating...</span>
            </button>
            <button className="w-full py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm pointer-events-none">
              <BrandSpinner variant="inline" size="xs" />
              <span>Saving Quiz...</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Single-stroke arc inheriting text color</span>
        </div>

        {/* Variant 4: Neural Pulse Shimmer */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-between text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">4. Neural Skeleton</span>
          <div className="w-full space-y-2 py-4">
            <BrandSpinner variant="skeleton" className="h-4 w-3/4 mx-auto rounded-md" />
            <BrandSpinner variant="skeleton" className="h-8 w-full rounded-xl" />
            <BrandSpinner variant="skeleton" className="h-3 w-1/2 mx-auto rounded-md" />
          </div>
          <span className="text-[11px] text-slate-500 mt-2">Content-aware placeholder shimmer</span>
        </div>
      </div>

      {/* Control Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Active App-Wide Spinner
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'synaptic', label: 'Halo Ring', desc: 'Full-screen & cards' },
              { id: 'morphing', label: 'Morphing Synapse', desc: 'Ultra-compact' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setActiveVariant(v.id as any)}
                className={`py-2 px-3 rounded-xl text-left border transition-all ${
                  activeVariant === v.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{v.label}</div>
                <div className="text-[10px] text-slate-500">{v.desc}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Sets the default loader across all app screens and quizzes.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Rotation & Morph Speed
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['snappy', 'normal', 'relaxed'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  speed === s
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {s === 'snappy' ? 'Snappy' : s === 'normal' ? 'Normal' : 'Relaxed'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Controls duration of the spinning halo and morphing loop.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Center Brain Emblem
          </label>
          <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Display Brain Glyph</span>
            <input
              type="checkbox"
              checked={showEmblem}
              onChange={(e) => setShowEmblem(e.target.checked)}
              className="toggle-checkbox h-5 w-5 text-indigo-600 rounded"
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">Pulsing smooth brain glyph inside the spinner.</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
        >
          {isLoading && <BrandSpinner variant="inline" size="sm" />}
          Publish Config
        </button>
      </div>
    </div>
  );
};
