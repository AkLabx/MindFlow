const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/components/QuizConfig.tsx', 'utf8');

// Crown import
content = content.replace(
  `import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database } from 'lucide-react';`,
  `import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database, Crown } from 'lucide-react';`
);

// ExamBlueprintsHub import
content = content.replace(
  `import { ScrollableCapsules } from './ui/ScrollableCapsules';`,
  `import { ScrollableCapsules } from './ui/ScrollableCapsules';\nimport { ExamBlueprintsHub } from './ExamBlueprintsHub';`
);

// Location hook
content = content.replace(
  `import { useNavigate } from 'react-router-dom';`,
  `import { useNavigate, useLocation } from 'react-router-dom';`
);
content = content.replace(
  `const navigate = useNavigate();`,
  `const navigate = useNavigate();\n  const location = useLocation();`
);
content = content.replace(
  `const [mode, setMode] = useState<QuizMode>('learning');`,
  `const [mode, setMode] = useState<QuizMode>((location.state as any)?.initialMode || 'learning');`
);

// Segmented Control
const oldSegmentedControl = `          {/* Segmented Control for Mode Switch */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl flex-1 max-w-[280px]">
            <button
              onClick={() => setMode('learning')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'learning'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span>Learning</span>
            </button>
            <button
              onClick={() => setMode('mock')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'mock'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <Timer className="w-4 h-4" />
              <span>Mock</span>
            </button>
          </div>`;

const newSegmentedControl = `          {/* Segmented Control for Mode Switch */}
          <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl flex-1 max-w-[400px]">
            <button
              onClick={() => setMode('learning')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'learning'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <BookOpen className="w-4 h-4 hidden sm:block" />
              <span>Learning</span>
            </button>
            <button
              onClick={() => setMode('mock')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'mock'
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <Timer className="w-4 h-4 hidden sm:block" />
              <span>Mock</span>
            </button>
            <button
              onClick={() => setMode('god')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === 'god'
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm border border-red-200 dark:border-red-900/30"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent"
              )}
            >
              <Crown className="w-4 h-4 hidden sm:block" />
              <span>God Mode</span>
            </button>
          </div>`;

content = content.replace(oldSegmentedControl, newSegmentedControl);

// Instead of ternary wrapping the whole grid, I'll just conditionally render either the grid or the hub.
const gridStart = `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
const gridReplacement = `
        {mode === 'god' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <ExamBlueprintsHub onBack={onBack} onLaunchBlueprint={(bp) => navigate(\`/blueprints/preview/\${bp.id}\`)} />
          </div>
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", mode === 'god' && "hidden")}>`;

content = content.replace(gridStart, gridReplacement);

// Conditionally hide sticky footer
const stickyFooterStart = `<div className="fixed bottom-[80px] left-0 right-0 z-[60] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg lg:bottom-0 lg:left-64 flex justify-center">`;
const stickyFooterReplacement = `<div className={cn("fixed bottom-[80px] left-0 right-0 z-[60] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg lg:bottom-0 lg:left-64 flex justify-center", mode === 'god' && "hidden")}>`;
content = content.replace(stickyFooterStart, stickyFooterReplacement);

fs.writeFileSync('src/features/quiz/components/QuizConfig.tsx', content);
