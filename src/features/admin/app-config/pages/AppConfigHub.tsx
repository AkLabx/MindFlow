import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { supabase } from '@/lib/supabase';
import { ThemeConfig, BrandingConfig } from '@/stores/useAppConfigStore';

import { ChevronLeft, Play, Sparkles, Palette, Loader2, Layout, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { getAllIntroModules } from '@/features/intro/registry';
import { BrandLogo, BrandSpinner } from '@/components/brand';

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

// Stub Panels

const ThemeConfigPanel = () => {
    const { config, updateConfig, startPreview, isLoading } = useAppConfigStore();
    const showToast = useNotificationStore(state => state.showToast);

    const [theme, setTheme] = useState<ThemeConfig>(config.theme);

    const handleSave = async () => {
        try {
            await updateConfig('theme', theme);
            showToast({ title: 'Saved', message: 'Theme config updated remotely', variant: 'success' });
        } catch (e) {
            showToast({ title: 'Error', message: 'Failed to update config', variant: 'error' });
        }
    };

    const handlePreview = () => {
        startPreview({ theme });
    };

    const handleReset = () => {
        setTheme({
            mode: 'system',
            primaryColor: '#4f46e5',
            fontFamily: 'sans'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Theme Configuration</h3>
                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">Reset to defaults</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color Mode (Default)</label>
                    <select
                        value={theme.mode}
                        onChange={e => setTheme({ ...theme, mode: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="system">System Preference</option>
                        <option value="light">Force Light Mode</option>
                        <option value="dark">Force Dark Mode</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typography</label>
                    <select
                        value={theme.fontFamily}
                        onChange={e => setTheme({ ...theme, fontFamily: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="sans">System Default (Inter)</option>
                        <option value="poppins">Modern (Poppins)</option>
                        <option value="serif">Elegant (Serif)</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Accent Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={theme.primaryColor}
                            onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                            className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                            type="text"
                            value={theme.primaryColor}
                            onChange={e => setTheme({ ...theme, primaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                            placeholder="#4f46e5"
                        />
                    </div>
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

const BrandingConfigPanel = () => {
    const { config, updateConfig, startPreview, isLoading } = useAppConfigStore();
    const showToast = useNotificationStore(state => state.showToast);

    const [branding, setBranding] = useState<BrandingConfig>(config.branding);
    const [uploading, setUploading] = useState(false);

    const handleSave = async () => {
        try {
            await updateConfig('branding', branding);
            showToast({ title: 'Saved', message: 'Branding config updated remotely', variant: 'success' });
        } catch (e) {
            showToast({ title: 'Error', message: 'Failed to update config', variant: 'error' });
        }
    };

    const handlePreview = () => {
        startPreview({ branding });
    };

    const handleReset = () => {
        setBranding({
            appName: 'MindFlow',
            welcomeText: 'Welcome to MindFlow',
            tagline: 'The ultimate learning platform.',
            logoUrl: null,
            versionNotice: { enabled: false, message: '', severity: 'info', dismissible: true }
        });
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('branding')
                .getPublicUrl(fileName);

            setBranding({ ...branding, logoUrl: data.publicUrl });
            showToast({ title: 'Uploaded', message: 'Logo uploaded successfully', variant: 'success' });
        } catch (err) {
            showToast({ title: 'Upload Failed', message: 'Failed to upload logo', variant: 'error' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Branding Configuration</h3>
                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">Reset to defaults</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application Name</label>
                    <input
                        type="text"
                        value={branding.appName}
                        onChange={e => setBranding({ ...branding, appName: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
                    <input
                        type="text"
                        value={branding.tagline}
                        onChange={e => setBranding({ ...branding, tagline: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Custom Logo (SVG/PNG)</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <BrandLogo variant="icon" size="sm" />
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/png, image/svg+xml"
                                onChange={handleLogoUpload}
                                className="hidden"
                                id="logo-upload"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="logo-upload"
                                className="px-4 py-2 rounded-xl font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-600 inline-block"
                            >
                                {uploading ? 'Uploading...' : 'Upload New Logo'}
                            </label>
                            <button
                                onClick={() => setBranding({...branding, logoUrl: null})}
                                className="ml-2 px-4 py-2 text-sm text-red-500 hover:text-red-600"
                                disabled={!branding.logoUrl}
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Version Banner Config */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">Global Version Notice</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                           <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Enable</span>
                           <input
                              type="checkbox"
                              className="toggle-checkbox"
                              checked={branding.versionNotice?.enabled || false}
                              onChange={e => setBranding({
                                  ...branding,
                                  versionNotice: { ...branding.versionNotice, enabled: e.target.checked }
                              })}
                           />
                        </label>
                    </div>
                    {branding.versionNotice?.enabled && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notice Message</label>
                                <input
                                    type="text"
                                    value={branding.versionNotice.message}
                                    onChange={e => setBranding({
                                        ...branding,
                                        versionNotice: { ...branding.versionNotice, message: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="A new version of the app is available..."
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Severity</label>
                                    <select
                                        value={branding.versionNotice.severity}
                                        onChange={e => setBranding({
                                            ...branding,
                                            versionNotice: { ...branding.versionNotice, severity: e.target.value as any }
                                        })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="error">Error (Red)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
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
                    disabled={isLoading || uploading}
                    className="px-6 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Publish Config
                </button>
            </div>
        </div>
    );
};

const LoadingConfigPanel = () => {
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> Remote App Administration & Config
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic remote configuration for startup intros, brand logo variants, dark/light themes, and loading animations.
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
