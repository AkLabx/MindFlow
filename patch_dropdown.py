import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Add isModelDropdownOpen state
state_pattern = r'const \[isSettingsOpen, setIsSettingsOpen\] = useState\(false\);'
new_state = 'const [isSettingsOpen, setIsSettingsOpen] = useState(false);\n    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);'
content = content.replace(state_pattern, new_state)

# Add ChevronDown import
import_pattern = r'import { ArrowLeft, ArrowDown,'
new_import = 'import { ArrowLeft, ArrowDown, ChevronDown,'
content = content.replace(import_pattern, new_import)

dropdown_html = """<div className="space-y-3 relative">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            AI Model
                        </label>
                        <div className="relative">
                            <button
                                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                                className="w-full flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 dark:bg-slate-800 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {activeModel ? MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.displayName : 'Select Model'}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-0.5">
                                        {activeModel ? `${MODEL_CONFIGS[activeModel as keyof typeof MODEL_CONFIGS]?.rpd} req/day limit` : ''}
                                    </span>
                                </div>
                                <ChevronDown className={cn("h-5 w-5 text-gray-400 transition-transform duration-200", isModelDropdownOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isModelDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                                    >
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {Object.values(MODEL_CONFIGS).map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => {
                                                        setActiveModel(m.id as any);
                                                        setIsModelDropdownOpen(false);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                                                        activeModel === m.id
                                                            ? "bg-indigo-50 dark:bg-indigo-900/30"
                                                            : "hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                                    )}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={cn(
                                                            "text-sm font-medium",
                                                            activeModel === m.id ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                                                        )}>
                                                            {m.displayName}
                                                        </span>
                                                        <span className="text-xs text-gray-500 mt-0.5">
                                                            {m.rpd} req/day limit
                                                        </span>
                                                    </div>
                                                    {activeModel === m.id && (
                                                        <div className="h-4 w-4 rounded-full border-2 border-indigo-500 flex items-center justify-center shrink-0">
                                                            <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>"""

old_model_section = r'<div className="space-y-3">\s*<label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">\s*<Zap className="h-4 w-4 text-amber-500" \/>\s*AI Model\s*<\/label>\s*<div className="flex flex-col gap-2">[\s\S]*?<\/div>\s*<\/div>'

content = re.sub(old_model_section, dropdown_html, content)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
