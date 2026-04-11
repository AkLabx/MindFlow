const fs = require('fs');

// QuizConfig: Ensure Crown is imported
let qc = fs.readFileSync('src/features/quiz/components/QuizConfig.tsx', 'utf8');
if (!qc.includes('Crown } from \'lucide-react\'')) {
    qc = qc.replace(/import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database } from 'lucide-react';/g, "import { BookOpen, Timer, Play, Layers, Briefcase, Filter, Info, Save, X, Database, Crown } from 'lucide-react';");
}
fs.writeFileSync('src/features/quiz/components/QuizConfig.tsx', qc);

// GodModeSession: ensure all `handlePause` and `Pause` references are removed.
let gm = fs.readFileSync('src/features/quiz/mock/GodModeSession.tsx', 'utf8');
gm = gm.replace(/<Button onClick=\{handlePause\}.*?Pause.*?<\/Button>/gs, '');
gm = gm.replace(/<button onClick=\{handlePause\}.*?Pause.*?<\/button>/gs, '');
// Wait, maybe regex dotall isn't working right. Let's just remove anything that says handlePause
const lines = gm.split('\n');
const filteredGm = lines.filter(line => !line.includes('handlePause') && !line.includes('<Pause'));
fs.writeFileSync('src/features/quiz/mock/GodModeSession.tsx', filteredGm.join('\n'));

// AppRoutes
let ar = fs.readFileSync('src/routes/AppRoutes.tsx', 'utf8');
if (!ar.includes('import { GodModeSession }')) {
    ar = ar.replace(/import { MockSession } from '\.\.\/features\/quiz\/mock\/MockSession';/g, "import { MockSession } from '../features/quiz/mock/MockSession';\nimport { GodModeSession } from '../features/quiz/mock/GodModeSession';");
}
ar = ar.replace(/onComplete=\{\(results\) =>/g, "onComplete={(results: any) =>");
fs.writeFileSync('src/routes/AppRoutes.tsx', ar);
