import React, { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { BrandingConfig, useAppConfigStore } from '@/stores/useAppConfigStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { BrandLogo } from '@/components/brand';

export const BrandingConfigPanel: React.FC = () => {
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
            versionNotice: { enabled: false, message: '', severity: 'info', dismissible: true },
            onboarding: config.branding.onboarding,
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
                                    <label htmlFor="branding-notice-severity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Severity</label>
                                    <select
                                        id="branding-notice-severity"
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
