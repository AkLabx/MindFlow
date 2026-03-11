file_path = "src/features/synonyms/SynonymsConfig.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace Phase 1: Guided Word Exploration
old_phase1 = """                    {/* Phase 1: Guided Learning */}
                    <button
                        onClick={() => window.location.hash = '#/synonyms/phase1'}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            📖
                        </div>
                        <h4 className="text-lg font-bold mb-1">Guided Word Exploration</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Discover words with deep meanings, Hindi translations, and audio pronunciation. Perfect for building a strong foundation.</p>
                    </button>"""

new_phase1 = """                    {/* Phase 1: Guided Learning */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/phase1'}
                        className="bg-amber-50 dark:bg-amber-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-amber-100 dark:border-amber-900/40 border-b-4 border-b-amber-200 dark:border-b-amber-700 hover:border-amber-300 dark:hover:border-amber-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                                📖
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Guided Word Exploration</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Discover words with deep meanings, Hindi translations, and audio pronunciation. Perfect for building a strong foundation.
                                </p>
                            </div>
                        </div>
                    </div>"""

# Replace Phase 2: Smart Flashcards
old_flashcards = """                    {/* Mode 1: Swipe Flashcards */}
                    <button
                        onClick={handleStartLearning}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            🃏
                        </div>
                        <h4 className="text-lg font-bold mb-1">Smart Flashcards</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Swipe through High-Frequency words first. Tap to reveal meanings and Mark as Mastered.</p>
                    </button>"""

new_flashcards = """                    {/* Mode 1: Swipe Flashcards */}
                    <div
                        onClick={handleStartLearning}
                        className="bg-blue-50 dark:bg-blue-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-blue-100 dark:border-blue-900/40 border-b-4 border-b-blue-200 dark:border-b-blue-700 hover:border-blue-300 dark:hover:border-blue-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                                🃏
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Smart Flashcards</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Swipe through High-Frequency words first. Tap to reveal meanings and Mark as Mastered.
                                </p>
                            </div>
                        </div>
                    </div>"""

# Replace Phase 2: Word Families
old_list = """                    {/* Mode 2: Cluster List */}
                    <button
                        onClick={() => window.location.hash = '#/synonyms/list'}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group"
                    >
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                            📋
                        </div>
                        <h4 className="text-lg font-bold mb-1">Word Families (List)</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View words grouped by meaning. See which words are hot (🔥) and review your Mastery spectrum.</p>
                    </button>"""

new_list = """                    {/* Mode 2: Cluster List */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/list'}
                        className="bg-emerald-50 dark:bg-emerald-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-emerald-100 dark:border-emerald-900/40 border-b-4 border-b-emerald-200 dark:border-b-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                                📋
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Word Families (List)</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    View words grouped by meaning. See which words are hot (🔥) and review your Mastery spectrum.
                                </p>
                            </div>
                        </div>
                    </div>"""

if old_phase1 in content:
    content = content.replace(old_phase1, new_phase1)
    print("Updated Phase 1")

if old_flashcards in content:
    content = content.replace(old_flashcards, new_flashcards)
    print("Updated Flashcards")

if old_list in content:
    content = content.replace(old_list, new_list)
    print("Updated List")

with open(file_path, "w") as f:
    f.write(content)
