import React, { useState } from 'react';
import { useAppConfigStore } from '@/stores/useAppConfigStore';
import { useShallow } from 'zustand/react/shallow';
import { Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VersionBanner: React.FC = () => {
    const { config, previewConfig, isPreviewing } = useAppConfigStore(useShallow((state) => ({
        config: state.config,
        previewConfig: state.previewConfig,
        isPreviewing: state.previewNonce > 0
    })));

    const activeConfig = (isPreviewing && previewConfig) ? previewConfig as typeof config : config;
    const banner = activeConfig.branding?.versionNotice;

    const [isDismissed, setIsDismissed] = useState(false);

    // If no banner config or it's not enabled, don't show
    if (!banner || !banner.enabled) return null;

    // If user dismissed it during this session, don't show unless in preview mode
    if (isDismissed && !isPreviewing) return null;

    const getColors = () => {
        switch (banner.severity) {
            case 'error': return 'bg-red-500 text-white';
            case 'warning': return 'bg-amber-500 text-white';
            default: return 'bg-indigo-600 text-white';
        }
    };

    const getIcon = () => {
        switch (banner.severity) {
            case 'error': return <XCircle className="w-5 h-5 shrink-0" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 shrink-0" />;
            default: return <Info className="w-5 h-5 shrink-0" />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`w-full ${getColors()} px-4 py-3 shadow-md flex items-center justify-between gap-4 z-[9000] relative`}
            >
                <div className="flex items-center gap-3 w-full max-w-6xl mx-auto">
                    {getIcon()}
                    <p className="text-sm font-medium leading-tight flex-1">
                        {banner.message}
                    </p>
                    {banner.dismissible !== false && (
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
