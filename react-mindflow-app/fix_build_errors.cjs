const fs = require('fs');

// 1. QuizConfig.tsx - Crown import
let qc = fs.readFileSync('src/features/quiz/components/QuizConfig.tsx', 'utf8');
qc = qc.replace(
  `import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database } from 'lucide-react';`,
  `import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database, Crown } from 'lucide-react';`
);
fs.writeFileSync('src/features/quiz/components/QuizConfig.tsx', qc);

// 2. GodModeSession.tsx - handlePause / Pause removal
let gm = fs.readFileSync('src/features/quiz/mock/GodModeSession.tsx', 'utf8');
gm = gm.replace(
  `                            <Button onClick={handlePause} variant="secondary" className="flex items-center gap-2" disabled={showConfirmModal}>
                                <Pause className="w-4 h-4" /> Pause
                            </Button>`,
  ``
);
gm = gm.replace(
  `                            <button onClick={handlePause} className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors" disabled={showConfirmModal}>
                                <Pause className="w-5 h-5" />
                            </button>`,
  ``
);
fs.writeFileSync('src/features/quiz/mock/GodModeSession.tsx', gm);

// 3. AppRoutes.tsx - GodModeSession import & types
let ar = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');
ar = ar.replace(
  `import { MockSession } from '../features/quiz/mock/MockSession';`,
  `import { MockSession } from '../features/quiz/mock/MockSession';\nimport { GodModeSession } from '../features/quiz/mock/GodModeSession';`
);
ar = ar.replace(
  `onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}`,
  `onComplete={(results: any) => { submitSessionResults(results); navTo('/result'); }}`
); // Fix implicit any for GodModeSession and MockSession
ar = ar.replace(
  `onComplete={(results) => { submitSessionResults(results); navTo('/result'); }}`,
  `onComplete={(results: any) => { submitSessionResults(results); navTo('/result'); }}`
);
fs.writeFileSync('src/routes/AppRoutes.tsx', ar);
