import re

with open('src/layouts/MainLayout.tsx', 'r') as f:
    content = f.read()

search_str = """          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white transition-colors duration-300">MindFlow</span>
          </div>"""

replace_str = """          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onTabChange('home')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white transition-colors duration-300 leading-none">MindFlow</span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-none mt-0.5">v{import.meta.env.VITE_APP_VERSION}</span>
            </div>
          </div>"""

content = content.replace(search_str, replace_str)

with open('src/layouts/MainLayout.tsx', 'w') as f:
    f.write(content)
