const fs = require('fs');
const path = './src/features/ai/chat/ChatInput.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Add new props
content = content.replace(
    /interface ChatInputProps \{/,
    `interface ChatInputProps {\n    activeModel?: string;\n    setActiveModel?: (modelId: string) => void;`
);

// 2. Add imports
content = content.replace(
    /import \{ Send, Loader2, Mic, MicOff, Image as ImageIcon, X, StopCircle \} from 'lucide-react';/,
    `import { Send, Loader2, Mic, Image as ImageIcon, X, StopCircle, ChevronUp } from 'lucide-react';\nimport { MODEL_CONFIGS } from './useQuota';`
);

// 3. Update component signature
content = content.replace(
    /export const ChatInput: React\.FC<ChatInputProps> = \(\{/,
    `export const ChatInput: React.FC<ChatInputProps> = ({\n    activeModel,\n    setActiveModel,`
);

// 4. Add state for bottom sheet
content = content.replace(
    /const \[imagePreview, setImagePreview\] = useState<string \| null>\(null\);/,
    `const [imagePreview, setImagePreview] = useState<string | null>(null);\n    const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);`
);

// 5. Update placeholder
content = content.replace(
    /placeholder="Ask MindFlow AI anything..."/,
    `placeholder="Ask Mindflow"`
);

// 6. Remove the top Stop Generating button block
content = content.replace(
    /\{\s*isLoading\s*&&\s*onStopGenerating\s*&&\s*\([\s\S]*?\}\s*\)\s*\}/,
    ``
);

// 7. Rebuild the bottom bar UI
const bottomBarRegex = /<div className="flex items-center justify-between w-full pt-2 border-t border-gray-100 dark:border-gray-800\/50 mt-1">[\s\S]*?<\/div>(\s*<\/div>\s*<div className="mt-2 text-center text-xs text-gray-500)/;

const newBottomBar = `<div className="flex items-center justify-between w-full mt-1">
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
            {isModelSheetOpen && activeModel && setActiveModel && (
                <>
                    <div
                        className="fixed inset-0 z-[60] bg-black/50 transition-opacity"
                        onClick={() => setIsModelSheetOpen(false)}
                    />
                    <div className="fixed inset-x-0 bottom-0 z-[70] transform bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select AI Model</h3>
                            <button
                                onClick={() => setIsModelSheetOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto space-y-2">
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
                    </div>
                </>
            )}$1`;

content = content.replace(bottomBarRegex, newBottomBar);

// 8. Fix the container style
content = content.replace(
    /<div className="relative flex w-full flex-col gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-slate-900 focus-within:ring-0 focus-within:border-indigo-500\/50">/,
    `<div className="relative flex w-full flex-col gap-1 rounded-[24px] bg-gray-100 dark:bg-slate-800/80 px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50">`
);

// 9. Remove top/bottom borders from textarea wrapper items and make the structure cleaner
content = content.replace(
    /className="max-h-\[200px\] min-h-\[44px\] w-full resize-none border-0 bg-transparent p-3 py-3 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-sm"/,
    `className="max-h-[200px] min-h-[44px] w-full resize-none border-0 bg-transparent py-2 text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none focus:outline-none dark:text-white dark:placeholder:text-gray-400 sm:text-base leading-relaxed"`
);


fs.writeFileSync(path, content, 'utf8');
console.log('Patched ChatInput.tsx successfully.');
