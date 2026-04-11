import re

with open('src/features/ai/chat/AIChatPage.tsx', 'r') as f:
    content = f.read()

# Replace empty state section with framer-motion versions
old_empty_state = """                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center animate-fade-in">
                            <div className="mb-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 p-4 ring-1 ring-indigo-100 dark:ring-indigo-800">
                                <Brain className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">How can I help you learn today?</h2>
                            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-8">
                                Ask a question, request an explanation, or practice your vocabulary with MindFlow AI.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 md:px-0">
                                {quickStarters.map((starter, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (!isLoading) {
                                                sendMessage(starter);
                                            }
                                        }}
                                        className="flex items-start text-left gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-200 group"
                                    >
                                        <div className="mt-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-2 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                                            {starter}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>"""

new_empty_state = """                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="flex h-full flex-col items-center justify-center p-8 text-center"
                        >
                            <div className="relative mb-6">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-0 bg-indigo-400/30 dark:bg-indigo-600/30 blur-2xl rounded-full"
                                />
                                <div className="relative rounded-full bg-indigo-50 dark:bg-indigo-900/30 p-5 ring-1 ring-indigo-100 dark:ring-indigo-800/50 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-900/20">
                                    <Brain className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">How can I help you learn today?</h2>
                            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-8">
                                Ask a question, request an explanation, or practice your vocabulary with MindFlow AI.
                            </p>

                            <motion.div
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4 md:px-0"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1 }
                                    }
                                }}
                            >
                                {quickStarters.map((starter, index) => (
                                    <motion.button
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 }
                                        }}
                                        whileHover={{ scale: 1.02, translateY: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={index}
                                        onClick={() => {
                                            if (!isLoading) {
                                                sendMessage(starter);
                                            }
                                        }}
                                        className="flex items-start text-left gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/80 p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 transition-colors group shadow-sm hover:shadow-md"
                                    >
                                        <div className="mt-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-2 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <MessageSquare className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                                            {starter}
                                        </span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </motion.div>"""

content = content.replace(old_empty_state, new_empty_state)

with open('src/features/ai/chat/AIChatPage.tsx', 'w') as f:
    f.write(content)
