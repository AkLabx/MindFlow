import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Mic, Image as ImageIcon, X, StopCircle, ChevronUp } from 'lucide-react';
import { MODEL_CONFIGS } from './useQuota';
import { useState } from 'react';
import { cn } from '../../../utils/cn';
import { motion, AnimatePresence } from "framer-motion";

interface ChatInputProps {
    activeModel?: string;
    setActiveModel?: (modelId: any) => void;
    value: string;
    onChange: (val: string) => void;
    onSubmit: (image?: string) => void;
    isLoading: boolean;
    disabled?: boolean;
    onStopGenerating?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    activeModel,
    setActiveModel,
    value,
    onChange,
    onSubmit,
    isLoading,
    disabled,
    onStopGenerating
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isListening, setIsListening] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);

    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        if (isListening) {
            recognition.stop();
            setIsListening(false);
            return;
        }

        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                onChange(value ? value + ' ' + finalTranscript : finalTranscript);
            }
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognition.start();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSend = () => {
        if (!value.trim() && !imagePreview) return;
        onSubmit(imagePreview || undefined);
        setImagePreview(null);
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
            textareaRef.current.style.overflowY = scrollHeight > 200 ? 'auto' : 'hidden';
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim() && !isLoading && !disabled) {
                handleSend();
            }
        }
    };

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-4">
            {isLoading && onStopGenerating && (
                <div className="flex justify-center mb-4">
                    <button
                        onClick={onStopGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium border border-red-200 dark:border-red-800/50 shadow-sm"
                    >
                        <StopCircle className="h-4 w-4" />
                        Stop Generating
                    </button>
                </div>
            )}

            {imagePreview && (
                <div className="relative inline-block mb-3">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-md">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <button
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 shadow-sm hover:bg-red-500 transition-colors z-10"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            <div className="relative flex w-full flex-col gap-1 rounded-[24px] bg-gray-100 dark:bg-slate-800/80 px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Mindflow"
                    className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent py-2 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-base leading-relaxed"
                    rows={1}
                    disabled={isLoading || disabled}
                />
                <div className="flex items-center justify-between w-full mt-1">
                    {/* Left: Image Upload */}
                    <div className="flex items-center text-gray-400">
                        <label className="p-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded-full transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isLoading || disabled}
                            />
                            <ImageIcon className="h-5 w-5" />
                        </label>
                    </div>

                    {/* Right: Dynamic Action Button & Model Switcher */}
                    <div className="flex items-center gap-1">
                        {/* Model Switcher Button */}
                        {activeModel && setActiveModel && (
                            <button
                                onClick={() => setIsModelSheetOpen(true)}
                                disabled={isLoading || disabled}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <span className="truncate max-w-[60px]">{MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.displayName || 'Model'}</span>
                                <ChevronUp className="h-3 w-3" />
                            </button>
                        )}

                        {/* Dynamic Action Button */}
                        <button
                            onClick={() => {
                                if (isLoading && onStopGenerating) {
                                    onStopGenerating();
                                } else if (value.trim() || imagePreview) {
                                    handleSend();
                                } else {
                                    handleMicClick();
                                }
                            }}
                            disabled={disabled && !isLoading}
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200",
                                isLoading
                                    ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
                                    : (value.trim() || imagePreview)
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                        : isListening
                                            ? "bg-red-50 text-red-500 dark:bg-red-900/20"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                            )}
                            title={isLoading ? "Stop generating" : (value.trim() || imagePreview) ? "Send message" : "Dictate with voice"}
                        >
                            {isLoading ? (
                                <StopCircle className="h-5 w-5" />
                            ) : (value.trim() || imagePreview) ? (
                                <Send className="h-4 w-4 ml-0.5" />
                            ) : isListening ? (
                                <Mic className="h-5 w-5 animate-pulse" />
                            ) : (
                                <Mic className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet Model Switcher */}
            <AnimatePresence>
                {isModelSheetOpen && activeModel && setActiveModel && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/50"
                            onClick={() => setIsModelSheetOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-x-0 bottom-0 z-[70] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
                        >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select AI Model</h3>
                            <button
                                onClick={() => setIsModelSheetOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2 pb-8">
                            {Object.values(MODEL_CONFIGS).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setActiveModel(m.id);
                                        setIsModelSheetOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors border",
                                        activeModel === m.id
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                            : "border-transparent bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    <div>
                                        <div className="font-medium">{m.displayName}</div>
                                        <div className="text-xs opacity-70 mt-1">Limit: {m.rpd} req/day • {m.rpm} req/min</div>
                                    </div>
                                    {activeModel === m.id && (
                                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                AI can make mistakes. Verify important information.
            </div>
        </div>
    );
};
