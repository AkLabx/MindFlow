import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Replace model select with segmented pills
old_model_select = """                        <div className="relative">
                            <select
                                value={activeModel}
                                onChange={(e) => setActiveModel(e.target.value as any)}
                                className="w-full appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 py-2.5 pl-3 pr-10 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {Object.values(MODEL_CONFIGS).map(m => (
                                    <option key={m.id} value={m.id} className="text-gray-900 dark:text-white bg-white dark:bg-slate-900">
                                        {m.displayName}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>"""

new_model_select = """                        <div className="flex flex-col gap-2">
                            {Object.values(MODEL_CONFIGS).map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setActiveModel(m.id as any)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                                        activeModel === m.id
                                            ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/50"
                                            : "bg-white border-gray-200 dark:bg-slate-800 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                                    )}
                                >
                                    <div className="flex flex-col items-start">
                                        <span className={cn(
                                            "text-sm font-medium",
                                            activeModel === m.id ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-300"
                                        )}>
                                            {m.displayName}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                            {m.rpd} req/day limit
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                                        activeModel === m.id ? "border-indigo-500" : "border-gray-300 dark:border-gray-600"
                                    )}>
                                        {activeModel === m.id && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
                                    </div>
                                </button>
                            ))}
                        </div>"""

content = content.replace(old_model_select, new_model_select)


# Replace grounding select with segmented controls
old_grounding_select = """                        <div className="relative">
                            <select
                                value={groundingState}
                                onChange={(e) => setGroundingState(e.target.value as any)}
                                className="block w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                            >
                                <option value="auto">Auto (Default)</option>
                                <option value="always">Always On</option>
                                <option value="off">Off</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>"""

new_grounding_select = """                        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 p-1">
                            {['auto', 'always', 'off'].map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => setGroundingState(opt as any)}
                                    className={cn(
                                        "flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200",
                                        groundingState === opt
                                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700"
                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    )}
                                >
                                    {opt === 'auto' ? 'Auto' : opt === 'always' ? 'Always' : 'Off'}
                                </button>
                            ))}
                        </div>"""

content = content.replace(old_grounding_select, new_grounding_select)


with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
