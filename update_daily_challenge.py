import re

file_path = "src/features/synonyms/SynonymsConfig.tsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace Daily Challenge block
old_daily = """                {/* Daily Challenge */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            🎯 Daily 20 Words Challenge
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Master 20 important words every day.</p>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[0%]" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">0 / 20</span>
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                        className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-colors"
                    >
                        Start Daily
                    </button>
                </div>"""

new_daily = """                {/* Daily Challenge */}
                <div
                    onClick={() => window.location.hash = '#/synonyms/quiz?mode=speed'}
                    className="bg-sky-50 dark:bg-sky-950/30 p-6 rounded-2xl cursor-pointer group relative z-20 transition-all duration-200 shadow-sm active:translate-y-1 active:border-b flex items-center justify-between border border-sky-100 dark:border-sky-900/40 border-b-4 border-b-sky-200 dark:border-b-sky-700 hover:border-sky-300 dark:hover:border-sky-500 mb-8"
                >
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 ring-1 ring-black/5 dark:ring-white/10 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform flex-shrink-0 text-2xl">
                            🎯
                        </div>
                        <div className="flex-1 pr-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Daily 20 Words Challenge</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-2">Master 20 important words every day.</p>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2 bg-sky-200 dark:bg-sky-900/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500 w-[0%]" />
                                </div>
                                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">0 / 20</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-sky-600 text-white font-bold rounded-xl shadow-sm flex-shrink-0 group-hover:bg-sky-700 transition-colors">
                        Start
                    </div>
                </div>"""

if old_daily in content:
    content = content.replace(old_daily, new_daily)
    with open(file_path, "w") as f:
        f.write(content)
    print("Updated Daily Challenge")
else:
    print("Could not find Daily Challenge block")
