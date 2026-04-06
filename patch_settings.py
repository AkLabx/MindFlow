with open('src/features/quiz/components/ui/SettingsModal.tsx', 'r') as f:
    content = f.read()

search_str = """        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400">MindFlow Quiz App v2.0.0</p>
        </div>"""

replace_str = """        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400">MindFlow Quiz App v{import.meta.env.VITE_APP_VERSION}</p>
        </div>"""

content = content.replace(search_str, replace_str)

with open('src/features/quiz/components/ui/SettingsModal.tsx', 'w') as f:
    f.write(content)
