import re

with open('src/features/quiz/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Add version to the 'v2.0 Live' section
search_str = """          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm animate-fade-in-up cursor-default group overflow-hidden relative">
            <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-400/20 transition-colors"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="group-hover:tracking-widest transition-all duration-300">v2.0 Live</span>
          </div>"""

replace_str = """          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm animate-fade-in-up cursor-default group overflow-hidden relative">
            <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-400/20 transition-colors"></div>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="group-hover:tracking-widest transition-all duration-300">v{import.meta.env.VITE_APP_VERSION} Live</span>
          </div>"""

content = content.replace(search_str, replace_str)

with open('src/features/quiz/components/LandingPage.tsx', 'w') as f:
    f.write(content)
