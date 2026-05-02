const fs = require('fs');
const file = 'src/features/quiz/components/QuizNavigationPanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const mapRenderReplacement = `            {/* Question Groups */}
            {groups.map((group, i) => {
                const isOpenGroup = openGroups.has(i);

                return (
                    <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => toggleGroup(i)}
                            className="w-full flex justify-between items-center p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-slate-800 dark:bg-slate-800/50 transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
                        >
                            <span>{group.title} <span className="text-gray-400 font-normal text-xs ml-1">({group.count} {group.count === 1 ? 'question' : 'questions'})</span></span>
                            <ChevronDown className={cn("w-4 h-4 text-gray-400 dark:text-slate-500 transition-transform", isOpenGroup ? "rotate-180" : "")} />
                        </button>

                        {isOpenGroup && (
                            <div className="p-3 pt-0 grid grid-cols-5 gap-2 bg-white dark:bg-gray-800">
                                {group.items.map((q) => {`;

code = code.replace(
  /\{\/\* Question Groups \*\/\}.*?\{group\.map\(\(q\) => \{/s,
  mapRenderReplacement.trim()
);

fs.writeFileSync(file, code);
console.log('patched nav render');
