file_path = "src/features/synonyms/SynonymsConfig.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace Game 1: The Imposter Trap
old_imposter = """                    {/* Game 1 */}
                    <button
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=imposter'}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                🕵️‍♂️
                            </div>

                        </div>
                        <h4 className="text-lg font-bold mb-1">The Imposter Trap</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Spot the Antonym hiding among Synonyms before the 10-second timer runs out.</p>
                    </button>"""

new_imposter = """                    {/* Game 1: The Imposter Trap */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=imposter'}
                        className="bg-violet-50 dark:bg-violet-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-violet-100 dark:border-violet-900/40 border-b-4 border-b-violet-200 dark:border-b-violet-700 hover:border-violet-300 dark:hover:border-violet-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                                🕵️‍♂️
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">The Imposter Trap</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Spot the Antonym hiding among Synonyms before the 10-second timer runs out.
                                </p>
                            </div>
                        </div>
                    </div>"""

# Replace Game 2: Tap & Connect
old_connect = """                    {/* Game 2 */}
                    <button
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=connect'}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-pink-500 dark:hover:border-pink-500 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                🔗
                            </div>

                        </div>
                        <h4 className="text-lg font-bold mb-1">Tap & Connect</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Match the main word with its synonym in a fast-paced dual-column challenge.</p>
                    </button>"""

new_connect = """                    {/* Game 2: Tap & Connect */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=connect'}
                        className="bg-rose-50 dark:bg-rose-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-rose-100 dark:border-rose-900/40 border-b-4 border-b-rose-200 dark:border-b-rose-700 hover:border-rose-300 dark:hover:border-rose-500"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                                🔗
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tap & Connect</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Match the main word with its synonym in a fast-paced dual-column challenge.
                                </p>
                            </div>
                        </div>
                    </div>"""

# Replace Game 3: Lightning Review
old_speed = """                    {/* Game 3: Speed Mode */}
                    <button
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                        className="flex flex-col text-left bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-md transition-all group md:col-span-2 lg:col-span-1"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                ⚡
                            </div>
                            <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-md">Quick Revision</span>
                        </div>
                        <h4 className="text-lg font-bold mb-1">Lightning Review</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Swipe through words with a 5-second timer. Perfect for rapid revision.</p>
                    </button>"""

new_speed = """                    {/* Game 3: Speed Mode */}
                    <div
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                        className="bg-indigo-50 dark:bg-indigo-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-indigo-100 dark:border-indigo-900/40 border-b-4 border-b-indigo-200 dark:border-b-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-500 md:col-span-2 lg:col-span-1"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl relative">
                                ⚡
                                <span className="absolute -top-2 -right-2 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                </span>
                            </div>
                            <div className="flex-1 pr-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                    Lightning Review
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700">Quick</span>
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">
                                    Swipe through words with a 5-second timer. Perfect for rapid revision.
                                </p>
                            </div>
                        </div>
                    </div>"""

if old_imposter in content:
    content = content.replace(old_imposter, new_imposter)
    print("Updated Imposter")

if old_connect in content:
    content = content.replace(old_connect, new_connect)
    print("Updated Connect")

if old_speed in content:
    content = content.replace(old_speed, new_speed)
    print("Updated Speed")

with open(file_path, "w") as f:
    f.write(content)
