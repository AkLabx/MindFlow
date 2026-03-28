import re

with open("src/features/school/components/SchoolDashboard.tsx", "r") as f:
    content = f.read()

header_replacement = """<header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            {/* MindFlow Icon */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-800 dark:text-white">MindFlow</span>
          </div>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>

          <div className="flex items-center gap-1.5">
            {/* School 'E' Logo */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 rounded-lg shadow-sm">
               <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  <path d="M8 7h6" />
                  <path d="M8 12h8" />
               </svg>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
               School
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          My Classroom
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Select your class to start learning CBSE/NCERT subjects.
        </p>
      </header>"""

content = re.sub(r'<header className="mb-8">.*?</header>', header_replacement, content, flags=re.DOTALL)

with open("src/features/school/components/SchoolDashboard.tsx", "w") as f:
    f.write(content)
