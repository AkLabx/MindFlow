import re

with open('src/features/quiz/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Add version to the 'Ignite your curiosity' section
search_str = """          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm animate-fade-in-up hover:scale-105 transition-transform cursor-default">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Ignite your curiosity</span>
          </div>"""

replace_str = """          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold text-sm mb-6 border border-indigo-100 dark:border-indigo-800 shadow-sm animate-fade-in-up hover:scale-105 transition-transform cursor-default">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Ignite your curiosity</span>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded-full ml-1">v{import.meta.env.VITE_APP_VERSION}</span>
          </div>"""

content = content.replace(search_str, replace_str)

with open('src/features/quiz/components/LandingPage.tsx', 'w') as f:
    f.write(content)
