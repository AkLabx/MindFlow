import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Mic, MicOff, Image as ImageIcon, X, StopCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../utils/cn';

interface ChatInputProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: (image?: string) => void;
    isLoading: boolean;
    disabled?: boolean;
    onStopGenerating?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
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
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
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

            <div className="relative flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-indigo-500">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask MindFlow AI anything..."
                    className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent p-3 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-0 dark:text-white dark:placeholder:text-gray-400 sm:text-sm"
                    rows={1}
                    disabled={isLoading || disabled}
                />
                <div className="flex items-center justify-between w-full pt-2 border-t border-gray-100 dark:border-gray-800/50 mt-1">
                    <div className="flex items-center gap-1 text-gray-400">
                        <label className="p-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isLoading || disabled}
                            />
                            <ImageIcon className="h-5 w-5" />
                        </label>
                        <button
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                isListening
                                    ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                                    : "hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                            onClick={handleMicClick}
                            disabled={isLoading || disabled}
                            title="Dictate with voice"
                        >
                            {isListening ? <Mic className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
                        </button>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={(!value.trim() && !imagePreview) || isLoading || disabled}
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                            (value.trim() || imagePreview) && !isLoading && !disabled
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                        )}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4 ml-0.5" />
                        )}
                    </button>
                </div>
            </div>
            <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                AI can make mistakes. Verify important information.
            </div>
        </div>
    );
};
