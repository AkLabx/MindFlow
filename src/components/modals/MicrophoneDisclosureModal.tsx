import React, { useId } from 'react';
import { Mic, ShieldCheck, X } from 'lucide-react';
import { NativeDialog } from '../ui/NativeDialog';

interface MicrophoneDisclosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export const MicrophoneDisclosureModal: React.FC<MicrophoneDisclosureModalProps> = ({
    isOpen,
    onClose,
    onAccept,
}) => {
    const titleId = useId();

    return (
        <NativeDialog
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy={titleId}
            className="max-w-md"
            panelClassName="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full p-6 shadow-2xl relative"
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close disclosure"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Mic className="w-6 h-6" />
                </div>
                <div>
                    <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white">Microphone Access Notice</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Google Play &amp; DPDP Policy Disclosure</p>
                </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                <p>
                    MindFlow requires microphone access to enable real-time conversational voice coaching with your AI Tutor.
                </p>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Ephemeral Streaming:</strong> Audio is converted to 16kHz PCM and streamed directly to Google Gemini Multimodal Live API during your active session.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>No Permanent Recording:</strong> Raw voice audio is not saved, sold, or used for advertising.</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-1/2 py-3 px-4 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors"
                >
                    Not Now
                </button>
                <button
                    type="button"
                    onClick={onAccept}
                    className="w-full sm:w-1/2 py-3 px-4 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all"
                >
                    Accept &amp; Continue
                </button>
            </div>
        </NativeDialog>
    );
};
