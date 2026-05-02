const fs = require('fs');
const file = 'src/features/quiz/components/QuizNavigationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const uiReplacement = `
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Question Map</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Overview of your progress</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Grouping Controls */}
        {hasMultipleSubjects && (
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800">
                <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
                    <button
                        onClick={() => handleGroupModeChange('default')}
                        className={cn("flex-1 text-xs font-bold py-1.5 rounded-md transition-all", groupByMode === 'default' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300")}
                    >
                        Group by 25
                    </button>
                    <button
                        onClick={() => handleGroupModeChange('subject')}
                        className={cn("flex-1 text-xs font-bold py-1.5 rounded-md transition-all", groupByMode === 'subject' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300")}
                    >
                        By Subject
                    </button>
                </div>
            </div>
        )}
`;

code = code.replace(
  /\{\/\* Header \*\/\}.*?<\/button>\n        <\/div>/s,
  uiReplacement.trim()
);

fs.writeFileSync(file, code);
console.log('patched nav ui');
