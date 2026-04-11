const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/mock/GodModeSession.tsx', 'utf8');

// Rename component
content = content.replace(/MockSession/g, 'GodModeSession');

// Remove Pause functionality entirely for God Mode
content = content.replace(/import \{.*?Pause.*?\} from 'lucide-react';/, "import { Clock, Menu, Flag, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Minimize2, Eraser, Crown } from 'lucide-react';");

content = content.replace(/const handlePause = \(\) => \{[\s\S]*?\};/, '');

content = content.replace(/<Button onClick=\{handlePause\}.*?Pause.*?<\/Button>/s, '');
content = content.replace(/<button onClick=\{handlePause\}.*?Pause.*?<\/button>/s, '');

// Give it a more intense red theme by changing primary colors
content = content.replace(/bg-indigo-600/g, 'bg-red-600');
content = content.replace(/bg-indigo-700/g, 'bg-red-700');
content = content.replace(/text-indigo-600/g, 'text-red-600');
content = content.replace(/text-indigo-400/g, 'text-red-400');
content = content.replace(/border-indigo-200/g, 'border-red-200');
content = content.replace(/border-indigo-500/g, 'border-red-500');

// Add Crown to the top bar
content = content.replace(
  `<h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Mock Exam</h1>`,
  `<h1 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><Crown className="w-6 h-6" /> God Mode Protocol</h1>`
);

fs.writeFileSync('src/features/quiz/mock/GodModeSession.tsx', content);
