import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Replace thinking state with bouncing dots
old_thinking_state = """                            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                                <div className="flex w-full px-4 py-6 bg-gray-50 dark:bg-gray-800/50 animate-fade-in">
                                    <div className="mx-auto flex w-full max-w-3xl gap-4 items-start">
                                        <div className="flex-shrink-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-indigo-600/20 dark:bg-indigo-500/20">
                                                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 h-8 text-sm text-gray-500 dark:text-gray-400 italic">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            MindFlow AI is thinking...
                                        </div>
                                    </div>
                                </div>
                            )}"""

new_thinking_state = """                            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex w-full px-4 py-6 bg-gray-50 dark:bg-gray-800/30"
                                >
                                    <div className="mx-auto flex w-full max-w-3xl gap-4 items-start">
                                        <div className="flex-shrink-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/50 shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
                                                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        </div>
                                        <div className="flex items-center h-8">
                                            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} className="w-2 h-2 rounded-full bg-indigo-400" />
                                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}"""

content = content.replace(old_thinking_state, new_thinking_state)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
